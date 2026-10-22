from rest_framework import serializers

from releases.serializers import ReleaseSummarySerializer, TrackSummarySerializer
from artists.serializers import ArtistSummarySerializer

from .models import Item


class ItemSerializer(serializers.ModelSerializer):
    edition = serializers.CharField(source='edition.name')
    total_supply = serializers.IntegerField(source='edition.total_supply')
    release = ReleaseSummarySerializer(source='edition.release')
    artist = ArtistSummarySerializer(source='edition.release.artist')
    status = serializers.CharField(source='order.status', default=None)
    is_demo = serializers.BooleanField(source='edition.is_demo')
    # Para o botão Ouvir da coleção tocar o Disc direto.
    tracks = TrackSummarySerializer(source='edition.release.tracks', many=True)

    class Meta:
        model = Item
        fields = ['id', 'serial_number', 'total_supply', 'edition', 'release', 'artist', 'status', 'is_demo', 'tracks', 'acquired_at']
