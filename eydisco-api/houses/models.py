import secrets
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone

from releases.playback import total_duration

# Quem mandou sinal de presença nesse intervalo conta como participante.
PRESENCE_WINDOW = timedelta(seconds=45)


class HouseQuerySet(models.QuerySet):
    def upcoming_or_live(self):
        # O fim depende da duração das faixas; um dia para trás cobre qualquer sessão.
        recent = timezone.now() - timedelta(days=1)
        return self.filter(models.Q(starts_at__gte=recent) | models.Q(starts_at__isnull=True))


def new_invite_code():
    return secrets.token_urlsafe(9)


class House(models.Model):
    """Sessão coletiva de escuta, programada, com anfitrião."""

    class Visibility(models.TextChoices):
        PUBLIC = 'public', 'Pública'
        PRIVATE = 'private', 'Privada'
        COLLECTOR = 'collector', 'Collector'
        ARTIST = 'artist', 'Artista'

    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField('mensagem da House', blank=True)
    cover = models.ImageField(upload_to='houses/', blank=True)
    host = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='hosted_houses')
    artist = models.ForeignKey('artists.Artist', on_delete=models.SET_NULL, null=True, blank=True, related_name='houses')
    # Pública: qualquer pessoa. Privada: quem tem o convite. Collector: quem tem
    # um exemplar do Disc. Artista: aberta, criada por quem gerencia o artista.
    visibility = models.CharField('tipo', max_length=10, choices=Visibility, default=Visibility.PUBLIC)
    # O Disc que a House toca; numa House Collector, também é o que dá acesso.
    release = models.ForeignKey('releases.Release', on_delete=models.SET_NULL, null=True, blank=True, related_name='houses')
    invite_code = models.CharField(max_length=20, default=new_invite_code, editable=False)
    # Horário programado. O anfitrião pode começar antes, o que regrava este campo.
    starts_at = models.DateTimeField('começa em', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = HouseQuerySet.as_manager()

    class Meta:
        ordering = ['starts_at']

    def __str__(self):
        return self.title

    def ordered_tracks(self):
        return [entry.track for entry in self.entries.all()]

    @property
    def ends_at(self):
        if self.starts_at is None:
            return None
        return self.starts_at + total_duration(self.ordered_tracks())

    def access_for(self, user, code=None):
        """(pode entrar, motivo) para quem abre a House."""
        if user.is_authenticated and user.pk == self.host_id:
            return True, None
        if self.visibility == self.Visibility.PRIVATE:
            if code and secrets.compare_digest(code, self.invite_code):
                return True, None
            if user.is_authenticated and self.participants.filter(user=user).exists():
                return True, None
            return False, 'private'
        if self.visibility == self.Visibility.COLLECTOR:
            if not user.is_authenticated:
                return False, 'login'
            if self.release_id and user.items.filter(edition__release_id=self.release_id).exists():
                return True, None
            return False, 'collector'
        return True, None

    @property
    def cover_file(self):
        if self.cover:
            return self.cover
        if self.release_id and self.release.cover:
            return self.release.cover
        return None

    @property
    def status(self):
        now = timezone.now()
        if self.starts_at is None or now < self.starts_at:
            return 'scheduled'
        if now < self.ends_at:
            return 'live'
        return 'ended'


class HouseTrack(models.Model):
    house = models.ForeignKey(House, on_delete=models.CASCADE, related_name='entries')
    track = models.ForeignKey('releases.Track', on_delete=models.CASCADE)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['position', 'id']


class Participant(models.Model):
    house = models.ForeignKey(House, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='house_visits')
    joined_at = models.DateTimeField(default=timezone.now)
    last_seen_at = models.DateTimeField(default=timezone.now)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['house', 'user'], name='unique_house_participant')]


class Reaction(models.Model):
    class Emoji(models.TextChoices):
        FIRE = '🔥', 'Fogo'
        HEART = '❤️', 'Coração'
        DANCE = '💃', 'Dança'
        WOW = '😮', 'Uau'
        CLAP = '👏', 'Palmas'

    house = models.ForeignKey(House, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    emoji = models.CharField(max_length=8, choices=Emoji)
    created_at = models.DateTimeField(auto_now_add=True)


class Message(models.Model):
    house = models.ForeignKey(House, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']
