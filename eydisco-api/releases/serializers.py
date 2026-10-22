from rest_framework import serializers

from artists.serializers import ArtistSummarySerializer

from .models import Credit, Edition, Extra, Release, Track


class EditionSerializer(serializers.ModelSerializer):
    available = serializers.SerializerMethodField()
    includes = serializers.ListField(source='includes_list', read_only=True)

    class Meta:
        model = Edition
        fields = ['id', 'name', 'price', 'total_supply', 'available', 'includes', 'is_demo']

    def get_available(self, edition):
        return edition.total_supply - edition.sold


class ReleaseSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Release
        fields = ['title', 'slug', 'cover', 'status', 'presale_starts_at', 'released_at']


class TrackSummarySerializer(serializers.ModelSerializer):
    """O que o player precisa para tocar e mostrar uma faixa."""

    release = ReleaseSummarySerializer()
    artist = ArtistSummarySerializer(source='release.artist')

    class Meta:
        model = Track
        fields = ['slug', 'title', 'position', 'duration', 'audio', 'release', 'artist']


class CreditSerializer(serializers.ModelSerializer):
    class Meta:
        model = Credit
        fields = ['role', 'name']


class ExtraSerializer(serializers.ModelSerializer):
    """Extras só para donos chegam sem conteúdo para quem não tem o Disc."""

    locked = serializers.SerializerMethodField()
    track = serializers.SlugRelatedField(slug_field='slug', read_only=True)

    class Meta:
        model = Extra
        fields = ['id', 'kind', 'title', 'body', 'url', 'file', 'owners_only', 'locked', 'track']

    def is_locked(self, extra):
        return extra.owners_only and extra.release_id not in self.context.get('owned_release_ids', set())

    def get_locked(self, extra):
        return self.is_locked(extra)

    def to_representation(self, extra):
        data = super().to_representation(extra)
        if self.is_locked(extra):
            data.update(body='', url='', file=None)
        return data


class ReleaseListSerializer(serializers.ModelSerializer):
    artist = ArtistSummarySerializer()
    editions = EditionSerializer(many=True)
    tracks_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Release
        fields = ['title', 'slug', 'description', 'cover', 'status', 'presale_starts_at', 'released_at', 'artist', 'editions', 'tracks_count']


class ReleaseSerializer(ReleaseListSerializer):
    """Página do Disc."""

    tracks = serializers.SerializerMethodField()
    extras = serializers.SerializerMethodField()
    my_items = serializers.SerializerMethodField()
    houses = serializers.SerializerMethodField()

    class Meta(ReleaseListSerializer.Meta):
        fields = [*ReleaseListSerializer.Meta.fields, 'story', 'tracks', 'extras', 'my_items', 'houses']

    def get_houses(self, release):
        """Houses abertas ou programadas que tocam este Disc."""
        from houses.models import House
        from houses.serializers import HouseSummarySerializer
        from houses.views import houses_with_tracks

        houses = houses_with_tracks().upcoming_or_live().filter(release=release).exclude(visibility=House.Visibility.PRIVATE)
        return HouseSummarySerializer([h for h in houses if h.status != 'ended'], many=True, context=self.context).data

    def get_tracks(self, release):
        return TrackSummarySerializer(release.tracks.all(), many=True, context=self.context).data

    def get_extras(self, release):
        # Os extras de faixa aparecem no Behind the Track; aqui ficam os do Disc.
        extras = [extra for extra in release.extras.all() if extra.track_id is None]
        return ExtraSerializer(extras, many=True, context=self.context).data

    def get_my_items(self, release):
        user = self.context['request'].user
        if not user.is_authenticated:
            return []
        from shelf.models import Item

        items = Item.objects.filter(owner=user, edition__release=release).select_related('edition')
        return [{'serial_number': i.serial_number, 'total_supply': i.edition.total_supply, 'edition': i.edition.name} for i in items]


class TrackSerializer(TrackSummarySerializer):
    """Página da faixa com o Behind the Track."""

    credits = CreditSerializer(many=True)
    extras = ExtraSerializer(many=True)
    siblings = serializers.SerializerMethodField()

    class Meta(TrackSummarySerializer.Meta):
        fields = [*TrackSummarySerializer.Meta.fields, 'story', 'inspirations', 'credits', 'extras', 'siblings']

    def get_siblings(self, track):
        # Completas, para o player tocar o disco a partir de qualquer faixa.
        return TrackSummarySerializer(track.release.tracks.all(), many=True, context=self.context).data
