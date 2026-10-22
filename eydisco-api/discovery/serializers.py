from rest_framework import serializers

from artists.serializers import ArtistSummarySerializer
from releases.serializers import ReleaseSummarySerializer, TrackSummarySerializer

from .models import Drop, DropItem


class DropItemSerializer(serializers.ModelSerializer):
    kind = serializers.SerializerMethodField()
    artist = ArtistSummarySerializer()
    release = ReleaseSummarySerializer()
    track = TrackSummarySerializer()
    release_artist = ArtistSummarySerializer(source='release.artist', default=None)

    class Meta:
        model = DropItem
        fields = ['id', 'kind', 'blurb', 'artist', 'release', 'release_artist', 'track']

    def get_kind(self, item):
        if item.track_id:
            return 'track'
        if item.release_id:
            return 'release'
        return 'artist'


class DropSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Drop
        fields = ['title', 'slug', 'intro', 'published_at']


class DropSerializer(DropSummarySerializer):
    items = DropItemSerializer(many=True)

    class Meta(DropSummarySerializer.Meta):
        fields = [*DropSummarySerializer.Meta.fields, 'items']
