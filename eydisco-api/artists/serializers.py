from rest_framework import serializers

from .models import Artist


class ArtistSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Artist
        fields = ['name', 'slug', 'avatar']


class ArtistSerializer(serializers.ModelSerializer):
    """Perfil do artista."""

    releases = serializers.SerializerMethodField()
    tracks = serializers.SerializerMethodField()
    houses = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = Artist
        fields = ['name', 'slug', 'bio', 'avatar', 'followers_count', 'is_following', 'releases', 'tracks', 'houses']

    def get_releases(self, artist):
        from releases.serializers import ReleaseSummarySerializer

        return ReleaseSummarySerializer(artist.releases.all(), many=True, context=self.context).data

    def get_tracks(self, artist):
        from releases.models import Track
        from releases.serializers import TrackSummarySerializer

        tracks = Track.objects.filter(release__artist=artist).select_related('release__artist').order_by('-release__released_at', 'position')
        return TrackSummarySerializer(tracks[:10], many=True, context=self.context).data

    def get_houses(self, artist):
        from houses.models import House
        from houses.serializers import HouseSummarySerializer

        from houses.views import houses_with_tracks

        houses = houses_with_tracks().upcoming_or_live().filter(artist=artist).exclude(visibility=House.Visibility.PRIVATE)
        return HouseSummarySerializer([h for h in houses if h.status != 'ended'], many=True, context=self.context).data

    def get_followers_count(self, artist):
        return artist.followers.count()

    def get_is_following(self, artist):
        user = self.context['request'].user
        return user.is_authenticated and artist.followers.filter(pk=user.pk).exists()
