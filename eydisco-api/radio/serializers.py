from rest_framework import serializers

from artists.serializers import ArtistSummarySerializer
from releases.serializers import TrackSummarySerializer

from .models import Show


class ShowSummarySerializer(serializers.ModelSerializer):
    host_artist = ArtistSummarySerializer()
    ends_at = serializers.DateTimeField()

    class Meta:
        model = Show
        fields = ['title', 'slug', 'description', 'host_name', 'host_artist', 'starts_at', 'ends_at']


class ShowSerializer(ShowSummarySerializer):
    tracks = serializers.SerializerMethodField()

    class Meta(ShowSummarySerializer.Meta):
        fields = [*ShowSummarySerializer.Meta.fields, 'tracks']

    def get_tracks(self, show):
        return TrackSummarySerializer(show.ordered_tracks(), many=True, context=self.context).data
