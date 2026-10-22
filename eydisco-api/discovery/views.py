from django.db.models import Prefetch
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from artists.models import Artist
from artists.serializers import ArtistSummarySerializer
from releases.serializers import ReleaseListSerializer, TrackSummarySerializer
from releases.views import releases_with_editions, tracks_for_player

from .models import Drop, DropItem
from .serializers import DropSerializer, DropSummarySerializer


def drops_with_items():
    items = DropItem.objects.select_related('artist', 'release__artist', 'track__release__artist')
    return Drop.objects.published().prefetch_related(Prefetch('items', queryset=items))


class DropListView(generics.ListAPIView):
    serializer_class = DropSummarySerializer

    def get_queryset(self):
        return Drop.objects.published()


class DropDetailView(generics.RetrieveAPIView):
    serializer_class = DropSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return drops_with_items()


class RouteView(APIView):
    """Route: a home de descoberta. Destaques, faixas, artistas e o Drop mais recente."""

    def get(self, request):
        context = {'request': request}
        featured = releases_with_editions().filter(is_featured=True)
        if not featured.exists():
            featured = releases_with_editions().order_by('-presale_starts_at')
        tracks = tracks_for_player().filter(is_featured=True)
        if not tracks.exists():
            tracks = tracks_for_player().order_by('-release__released_at', 'position')
        # Pré-venda aberta é o que mais pede atenção, depois o que está para abrir.
        priority = {'presale': 0, 'upcoming': 1, 'released': 2}
        featured = sorted(featured[:8], key=lambda release: priority[release.status])
        drop = drops_with_items().first()
        return Response({
            'featured': ReleaseListSerializer(featured[:4], many=True, context=context).data,
            'tracks': TrackSummarySerializer(tracks[:8], many=True, context=context).data,
            'artists': ArtistSummarySerializer(Artist.objects.order_by('name')[:8], many=True, context=context).data,
            'drop': DropSerializer(drop, context=context).data if drop else None,
        })
