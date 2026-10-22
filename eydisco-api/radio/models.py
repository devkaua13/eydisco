from django.db import models

from releases.playback import total_duration


class Show(models.Model):
    """Um programa da Eydisco Radio: uma lista de faixas curada, com horário marcado."""

    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    host_name = models.CharField('DJ ou apresentador', max_length=150)
    # Quando quem apresenta é um artista da casa, o player leva ao Perfil.
    host_artist = models.ForeignKey('artists.Artist', on_delete=models.SET_NULL, null=True, blank=True, related_name='shows')
    starts_at = models.DateTimeField('começa em')

    class Meta:
        ordering = ['starts_at']

    def __str__(self):
        return self.title

    def ordered_tracks(self):
        return [entry.track for entry in self.entries.all()]

    @property
    def ends_at(self):
        return self.starts_at + total_duration(self.ordered_tracks())


class ShowTrack(models.Model):
    show = models.ForeignKey(Show, on_delete=models.CASCADE, related_name='entries')
    track = models.ForeignKey('releases.Track', on_delete=models.CASCADE)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['position', 'id']
