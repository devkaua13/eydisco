from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class DropQuerySet(models.QuerySet):
    def published(self):
        return self.filter(published_at__lte=timezone.now())


class Drop(models.Model):
    """Discovery Drop: uma seleção editorial de três a cinco descobertas."""

    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    intro = models.TextField('apresentação', blank=True)
    published_at = models.DateTimeField('publicar em')

    objects = DropQuerySet.as_manager()

    class Meta:
        ordering = ['-published_at']

    def __str__(self):
        return self.title


class DropItem(models.Model):
    """Uma descoberta do Drop: aponta para um artista, um Disc ou uma faixa."""

    drop = models.ForeignKey(Drop, on_delete=models.CASCADE, related_name='items')
    position = models.PositiveSmallIntegerField(default=0)
    blurb = models.TextField('por que ouvir', max_length=600)
    artist = models.ForeignKey('artists.Artist', on_delete=models.CASCADE, null=True, blank=True)
    release = models.ForeignKey('releases.Release', on_delete=models.CASCADE, null=True, blank=True)
    track = models.ForeignKey('releases.Track', on_delete=models.CASCADE, null=True, blank=True)

    class Meta:
        ordering = ['position', 'id']

    def clean(self):
        targets = [self.artist_id, self.release_id, self.track_id]
        if sum(t is not None for t in targets) != 1:
            raise ValidationError('Escolha exatamente um: artista, Disc ou faixa.')
