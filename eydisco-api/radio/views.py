from datetime import timedelta

from django.db.models import Prefetch
from django.utils import timezone
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from releases.playback import playback_data

from .models import Show, ShowTrack
from .serializers import ShowSerializer, ShowSummarySerializer


def shows_with_tracks():
    entries = ShowTrack.objects.select_related('track__release__artist')
    return Show.objects.select_related('host_artist').prefetch_related(Prefetch('entries', queryset=entries))


class RadioView(APIView):
    """O que está tocando agora e a programação a seguir."""

    def get(self, request):
        now = timezone.now()
        context = {'request': request}
        # Programas longos são raros; um dia para trás basta para achar o que está no ar.
        recent = shows_with_tracks().filter(starts_at__lte=now, starts_at__gte=now - timedelta(days=1))
        on_air = next((show for show in reversed(recent) if show.ends_at > now), None)
        upcoming = shows_with_tracks().filter(starts_at__gt=now)[:6]
        return Response({
            'server_time': now,
            'show': ShowSerializer(on_air, context=context).data if on_air else None,
            'playback': playback_data(on_air.ordered_tracks(), on_air.starts_at, now, context) if on_air else None,
            'upcoming': ShowSummarySerializer(upcoming, many=True, context=context).data,
        })


class ShowDetailView(generics.RetrieveAPIView):
    serializer_class = ShowSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return shows_with_tracks()
