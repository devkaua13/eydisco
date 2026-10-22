from django.db.models import Count, Prefetch, Q
from django.utils import timezone
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from artists.models import Artist
from artists.serializers import ArtistSummarySerializer

from .models import Edition, Release, Track
from .serializers import ReleaseListSerializer, ReleaseSerializer, ReleaseSummarySerializer, TrackSerializer, TrackSummarySerializer


def releases_with_editions():
    editions = Edition.objects.annotate(sold=Count('items'))
    return (
        Release.objects.select_related('artist')
        .prefetch_related(Prefetch('editions', queryset=editions))
        .annotate(tracks_count=Count('tracks', distinct=True))
    )


def tracks_for_player():
    return Track.objects.select_related('release__artist')


def owned_release_ids(user):
    if not user.is_authenticated:
        return set()
    return set(user.items.values_list('edition__release_id', flat=True))


class FeedView(generics.ListAPIView):
    """Lista de Discs. Aceita ?status=upcoming|presale|released."""

    serializer_class = ReleaseListSerializer

    def get_queryset(self):
        queryset = releases_with_editions().order_by('-presale_starts_at')
        now = timezone.now()
        status = self.request.query_params.get('status')
        if status == 'upcoming':
            queryset = queryset.filter(presale_starts_at__gt=now)
        elif status == 'presale':
            queryset = queryset.filter(presale_starts_at__lte=now, released_at__gt=now)
        elif status == 'released':
            queryset = queryset.filter(released_at__lte=now)
        return queryset


class ReleaseDetailView(generics.RetrieveAPIView):
    """Página do Disc: edições, faixas, história e extras."""

    serializer_class = ReleaseSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return releases_with_editions().prefetch_related('tracks', 'extras')

    def get_serializer_context(self):
        return {**super().get_serializer_context(), 'owned_release_ids': owned_release_ids(self.request.user)}


class TrackDetailView(generics.RetrieveAPIView):
    """Página da faixa com o Behind the Track."""

    serializer_class = TrackSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return tracks_for_player().prefetch_related('credits', 'extras', 'release__tracks')

    def get_serializer_context(self):
        return {**super().get_serializer_context(), 'owned_release_ids': owned_release_ids(self.request.user)}


class SearchView(APIView):
    """Busca simples por artista, Disc e faixa: ?q=."""

    LIMIT = 6

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if len(q) < 2:
            return Response({'q': q, 'artists': [], 'releases': [], 'tracks': []})
        context = {'request': request}
        artists = Artist.objects.filter(name__icontains=q)[: self.LIMIT]
        releases = Release.objects.filter(Q(title__icontains=q) | Q(artist__name__icontains=q))[: self.LIMIT]
        tracks = tracks_for_player().filter(Q(title__icontains=q) | Q(release__artist__name__icontains=q))[: self.LIMIT]
        return Response({
            'q': q,
            'artists': ArtistSummarySerializer(artists, many=True, context=context).data,
            'releases': ReleaseSummarySerializer(releases, many=True, context=context).data,
            'tracks': TrackSummarySerializer(tracks, many=True, context=context).data,
        })
