from django.db.models import Count, OuterRef, Prefetch, Q, Subquery
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from releases.playback import playback_data

from .models import PRESENCE_WINDOW, House, HouseTrack, Participant
from .serializers import (
    HouseCreateSerializer,
    HouseSerializer,
    HouseSummarySerializer,
    MessageSerializer,
    ReactionSerializer,
)

# Reações são efêmeras: quem chega não precisa ver as de dez minutos atrás.
REACTIONS_LIMIT = 30
MESSAGES_LIMIT = 50

ACCESS_MESSAGES = {
    'private': 'Esta House é privada. Entre pelo link de convite.',
    'collector': 'Esta House é só para quem tem o Disc na coleção.',
    'login': 'Entre na sua conta para acessar esta House.',
}


def houses_with_tracks():
    entries = HouseTrack.objects.select_related('track__release__artist')
    # Subquery, e não Count no join: o filtro de "Minhas" também passa por participants.
    present = (
        Participant.objects.filter(house=OuterRef('pk'), last_seen_at__gte=timezone.now() - PRESENCE_WINDOW)
        .values('house')
        .annotate(total=Count('pk'))
        .values('total')
    )
    return (
        House.objects.select_related('host', 'artist', 'release__artist')
        .prefetch_related(Prefetch('entries', queryset=entries))
        .annotate(live_count=Coalesce(Subquery(present), 0))
    )


def get_house(request, slug):
    """A House, ou 403 se quem pede não pode entrar."""
    house = get_object_or_404(houses_with_tracks(), slug=slug)
    can_enter, reason = house.access_for(request.user, request.query_params.get('code') or request.data.get('code'))
    if not can_enter:
        raise PermissionDenied(ACCESS_MESSAGES[reason])
    return house


def since(request, name):
    try:
        return int(request.query_params.get(name, 0))
    except ValueError:
        return 0


class HouseListView(generics.ListCreateAPIView):
    """GET lista Houses (?tab=live|upcoming|mine). POST cria uma House."""

    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def get_serializer_class(self):
        return HouseCreateSerializer if self.request.method == 'POST' else HouseSummarySerializer

    def get_queryset(self):
        user = self.request.user
        if self.request.query_params.get('tab') == 'mine':
            if not user.is_authenticated:
                return House.objects.none()
            mine = Q(host=user) | Q(participants__user=user)
            return houses_with_tracks().filter(mine).distinct().order_by('-starts_at')
        # Privadas não aparecem na vitrine.
        return houses_with_tracks().upcoming_or_live().exclude(visibility=House.Visibility.PRIVATE)

    def list(self, request, *args, **kwargs):
        tab = request.query_params.get('tab')
        houses = list(self.get_queryset())
        if tab == 'live':
            houses = [h for h in houses if h.status == 'live']
        elif tab == 'upcoming':
            houses = [h for h in houses if h.status == 'scheduled']
        elif tab != 'mine':
            houses = [h for h in houses if h.status != 'ended']
        return Response(self.get_serializer(houses, many=True).data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        house = serializer.save()
        house = houses_with_tracks().get(pk=house.pk)
        return Response(HouseSerializer(house, context=self.get_serializer_context()).data, status=status.HTTP_201_CREATED)


class HouseDetailView(generics.RetrieveAPIView):
    """Detalhe da House. Para quem não pode entrar, vem com access.can_enter = false."""

    serializer_class = HouseSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return houses_with_tracks()


class LiveView(APIView):
    """Estado da sala, consultado a cada poucos segundos pelo navegador.

    ?after_reaction=<id>&after_message=<id> devolve só o que chegou depois.
    """

    def get(self, request, slug):
        house = get_house(request, slug)
        now = timezone.now()
        context = {'request': request}
        participants = (
            Participant.objects.filter(house=house, last_seen_at__gte=now - PRESENCE_WINDOW)
            .select_related('user')
            .order_by('user__username')
        )
        reactions = house.reactions.filter(id__gt=since(request, 'after_reaction')).select_related('user').order_by('-id')[:REACTIONS_LIMIT]
        messages = house.messages.filter(id__gt=since(request, 'after_message')).select_related('user').order_by('-id')[:MESSAGES_LIMIT]
        return Response({
            'server_time': now,
            'status': house.status,
            'starts_at': house.starts_at,
            'playback': playback_data(house.ordered_tracks(), house.starts_at, now, context),
            'participants': [p.user.username for p in participants],
            'reactions': ReactionSerializer(reversed(reactions), many=True).data,
            'messages': MessageSerializer(reversed(messages), many=True).data,
        })


class PresenceView(APIView):
    """Sinal de "estou na sala". Numa House privada, aceitar o convite registra a pessoa."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        house = get_house(request, slug)
        now = timezone.now()
        participant, created = Participant.objects.get_or_create(house=house, user=request.user, defaults={'joined_at': now, 'last_seen_at': now})
        if not created:
            participant.last_seen_at = now
            participant.save(update_fields=['last_seen_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)


class StartView(APIView):
    """O anfitrião começa a sessão agora, antes do horário programado."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        house = get_house(request, slug)
        if house.host_id != request.user.id:
            raise PermissionDenied('Só o anfitrião pode começar a sessão.')
        if house.status != 'scheduled':
            raise ValidationError({'detail': 'A sessão já começou.'})
        house.starts_at = timezone.now()
        house.save(update_fields=['starts_at'])
        return Response(HouseSerializer(house, context={'request': request}).data)


class ReactionCreateView(generics.CreateAPIView):
    serializer_class = ReactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        house = get_house(self.request, self.kwargs['slug'])
        if house.status != 'live':
            raise ValidationError({'detail': 'As reações abrem quando a sessão começa.'})
        serializer.save(house=house, user=self.request.user)


class MessageCreateView(generics.CreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        house = get_house(self.request, self.kwargs['slug'])
        if house.status == 'ended':
            raise ValidationError({'detail': 'Esta sessão já terminou.'})
        serializer.save(house=house, user=self.request.user)
