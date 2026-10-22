from rest_framework import generics, permissions, status
from django.shortcuts import get_object_or_404
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .serializers import MeSerializer, RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token = Token.objects.create(user=user)
        return Response({'token': token.key, 'user': UserSerializer(user).data}, status=status.HTTP_201_CREATED)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = MeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ProfileView(APIView):
    """Perfil público de quem coleciona: números, Houses e atividade recente."""

    ACTIVITY_LIMIT = 12

    def get(self, request, username):
        from houses.models import House, Participant
        from houses.serializers import HouseSummarySerializer
        from houses.views import houses_with_tracks
        from shelf.models import Item

        user = get_object_or_404(User, username=username)
        context = {'request': request}
        hosted = houses_with_tracks().filter(host=user).order_by('-starts_at')
        is_self = request.user.is_authenticated and request.user.pk == user.pk
        if not is_self:
            hosted = hosted.exclude(visibility=House.Visibility.PRIVATE)

        items = Item.objects.filter(owner=user).select_related('edition__release')[: self.ACTIVITY_LIMIT]
        visits = Participant.objects.filter(user=user).select_related('house')
        if not is_self:
            visits = visits.exclude(house__visibility=House.Visibility.PRIVATE)
        activity = [
            {'kind': 'collected', 'at': i.acquired_at, 'title': i.edition.release.title, 'slug': i.edition.release.slug}
            for i in items
        ] + [
            {'kind': 'created_house', 'at': h.created_at, 'title': h.title, 'slug': h.slug}
            for h in hosted[: self.ACTIVITY_LIMIT]
        ] + [
            {'kind': 'joined_house', 'at': v.joined_at, 'title': v.house.title, 'slug': v.house.slug}
            for v in visits.order_by('-joined_at')[: self.ACTIVITY_LIMIT]
            if v.house.host_id != user.pk
        ]
        activity.sort(key=lambda event: event['at'], reverse=True)

        return Response({
            'username': user.username,
            'name': user.get_full_name(),
            'date_joined': user.date_joined,
            'counts': {
                'discs': user.items.count(),
                'houses_created': user.hosted_houses.count(),
                'houses_joined': visits.exclude(house__host=user).count(),
            },
            'houses': HouseSummarySerializer(hosted[:6], many=True, context=context).data,
            'activity': activity[: self.ACTIVITY_LIMIT],
        })
