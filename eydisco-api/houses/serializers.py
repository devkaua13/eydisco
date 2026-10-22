from datetime import timedelta

from django.utils import timezone
from django.utils.crypto import get_random_string
from django.utils.text import slugify
from rest_framework import serializers

from artists.models import Artist
from artists.serializers import ArtistSummarySerializer
from releases.models import Release
from releases.playback import now_playing
from releases.serializers import ReleaseSummarySerializer, TrackSummarySerializer

from .models import PRESENCE_WINDOW, House, Message, Reaction


class HouseSummarySerializer(serializers.ModelSerializer):
    host = serializers.CharField(source='host.username')
    artist = ArtistSummarySerializer()
    release = ReleaseSummarySerializer()
    cover = serializers.SerializerMethodField()
    status = serializers.CharField()
    ends_at = serializers.DateTimeField()
    participants_count = serializers.SerializerMethodField()
    now_playing = serializers.SerializerMethodField()

    class Meta:
        model = House
        fields = [
            'title', 'slug', 'description', 'cover', 'visibility', 'host', 'artist', 'release',
            'starts_at', 'ends_at', 'status', 'participants_count', 'now_playing',
        ]

    def get_cover(self, house):
        file = house.cover_file
        if not file:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(file.url) if request else file.url

    def get_participants_count(self, house):
        # As listas anotam a contagem; o detalhe conta na hora.
        if hasattr(house, 'live_count'):
            return house.live_count
        return house.participants.filter(last_seen_at__gte=timezone.now() - PRESENCE_WINDOW).count()

    def get_now_playing(self, house):
        if house.status != 'live':
            return None
        current = now_playing(house.ordered_tracks(), house.starts_at, timezone.now())
        if current is None:
            return None
        _, track, _ = current
        return {'title': track.title, 'artist': track.release.artist.name, 'position': track.position}


class HouseSerializer(HouseSummarySerializer):
    tracks = serializers.SerializerMethodField()
    access = serializers.SerializerMethodField()
    is_host = serializers.SerializerMethodField()
    invite_code = serializers.SerializerMethodField()

    class Meta(HouseSummarySerializer.Meta):
        fields = [*HouseSummarySerializer.Meta.fields, 'tracks', 'access', 'is_host', 'invite_code']

    def access_of(self, house):
        request = self.context['request']
        return house.access_for(request.user, request.query_params.get('code'))

    def get_access(self, house):
        can_enter, reason = self.access_of(house)
        return {'can_enter': can_enter, 'reason': reason}

    def get_tracks(self, house):
        # A lista do que vai tocar é parte do que a House guarda para quem entra.
        if not self.access_of(house)[0]:
            return []
        return TrackSummarySerializer(house.ordered_tracks(), many=True, context=self.context).data

    def get_is_host(self, house):
        user = self.context['request'].user
        return user.is_authenticated and user.pk == house.host_id

    def get_invite_code(self, house):
        return house.invite_code if self.get_is_host(house) and house.visibility == House.Visibility.PRIVATE else None


class HouseCreateSerializer(serializers.ModelSerializer):
    """Criar House: nome, tipo, o Disc que vai tocar e, opcionalmente, foto e horário."""

    release = serializers.SlugRelatedField(slug_field='slug', queryset=Release.objects.all())
    artist = serializers.SlugRelatedField(slug_field='slug', queryset=Artist.objects.all(), required=False, allow_null=True)
    starts_at = serializers.DateTimeField(required=False, allow_null=True)

    class Meta:
        model = House
        fields = ['title', 'description', 'cover', 'visibility', 'release', 'artist', 'starts_at']
        extra_kwargs = {'title': {'max_length': 50}}

    def validate(self, data):
        user = self.context['request'].user
        if not data['release'].tracks.exists():
            raise serializers.ValidationError({'release': 'Este Disc ainda não tem faixas para tocar.'})
        if data['visibility'] == House.Visibility.ARTIST:
            artist = data.get('artist') or data['release'].artist
            if not artist.managers.filter(pk=user.pk).exists():
                raise serializers.ValidationError({'visibility': 'Só quem gerencia o artista pode criar uma House de artista.'})
            data['artist'] = artist
        else:
            data['artist'] = data['release'].artist
        starts_at = data.get('starts_at')
        if starts_at and starts_at < timezone.now() - timedelta(minutes=1):
            raise serializers.ValidationError({'starts_at': 'Escolha um horário a partir de agora.'})
        return data

    def create(self, data):
        from .models import HouseTrack

        data['starts_at'] = data.get('starts_at') or timezone.now()
        slug = f"{slugify(data['title'])[:40] or 'house'}-{get_random_string(5).lower()}"
        house = House.objects.create(slug=slug, host=self.context['request'].user, **data)
        for position, track in enumerate(data['release'].tracks.all()):
            HouseTrack.objects.create(house=house, track=track, position=position)
        return house


class ReactionSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Reaction
        fields = ['id', 'emoji', 'user', 'created_at']
        read_only_fields = ['created_at']


class MessageSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'text', 'user', 'created_at']
        read_only_fields = ['created_at']
