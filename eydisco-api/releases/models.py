from django.db import models
from django.utils import timezone


class Release(models.Model):
    """O Disc: a página colecionável do lançamento."""

    artist = models.ForeignKey('artists.Artist', on_delete=models.CASCADE, related_name='releases')
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    story = models.TextField('história', blank=True, help_text='Como o disco nasceu. Aparece na página do Disc.')
    cover = models.ImageField(upload_to='releases/', blank=True)
    is_featured = models.BooleanField('destaque na Route', default=False)
    presale_starts_at = models.DateTimeField()
    released_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-released_at']

    def __str__(self):
        return f'{self.artist} - {self.title}'

    @property
    def status(self):
        now = timezone.now()
        if now < self.presale_starts_at:
            return 'upcoming'
        if now < self.released_at:
            return 'presale'
        return 'released'


class Edition(models.Model):
    """Uma versão comprável do Disco, ex.: "Vinil azul, tiragem de 500"."""

    release = models.ForeignKey(Release, on_delete=models.CASCADE, related_name='editions')
    name = models.CharField(max_length=150)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    total_supply = models.PositiveIntegerField()
    includes = models.TextField('conteúdo incluído', blank=True, help_text='Um item por linha.')
    # Enquanto a loja é demonstrativa, o preço é de teste e a compra não é cobrada.
    is_demo = models.BooleanField('demonstração', default=True)

    def __str__(self):
        return f'{self.release} ({self.name})'

    @property
    def includes_list(self):
        return [line.strip() for line in self.includes.splitlines() if line.strip()]


class Track(models.Model):
    """Uma faixa do Disc, com o áudio e a camada Behind the Track."""

    release = models.ForeignKey(Release, on_delete=models.CASCADE, related_name='tracks')
    position = models.PositiveSmallIntegerField('número')
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    audio = models.FileField(upload_to='tracks/')
    # Preenchida a partir do arquivo ao salvar; a Radio e a House dependem dela para sincronizar.
    duration = models.PositiveIntegerField('duração (segundos)', default=0, blank=True)
    story = models.TextField('história de produção', blank=True)
    inspirations = models.TextField('inspirações', blank=True)
    is_featured = models.BooleanField('destaque na Route', default=False)

    class Meta:
        ordering = ['release', 'position']
        constraints = [
            models.UniqueConstraint(fields=['release', 'position'], name='unique_track_position'),
        ]

    def __str__(self):
        return f'{self.release.title} {self.position}. {self.title}'

    def save(self, *args, **kwargs):
        if not self.duration and self.audio:
            self.duration = audio_duration(self.audio)
        super().save(*args, **kwargs)


def audio_duration(field_file):
    import mutagen

    field_file.open('rb')
    try:
        info = mutagen.File(field_file)
    finally:
        field_file.seek(0)
    return round(info.info.length) if info else 0


class Credit(models.Model):
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='credits')
    role = models.CharField('função', max_length=100)
    name = models.CharField('nome', max_length=150)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['position', 'id']

    def __str__(self):
        return f'{self.role}: {self.name}'


class Extra(models.Model):
    """Conteúdo extra autorizado de um Disc ou de uma faixa."""

    class Kind(models.TextChoices):
        TEXT = 'text', 'Texto'
        VIDEO = 'video', 'Vídeo'
        IMAGE = 'image', 'Imagem'
        AUDIO = 'audio', 'Áudio'
        LINK = 'link', 'Link'

    release = models.ForeignKey(Release, on_delete=models.CASCADE, related_name='extras')
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='extras', null=True, blank=True)
    kind = models.CharField('tipo', max_length=10, choices=Kind, default=Kind.TEXT)
    title = models.CharField(max_length=200)
    body = models.TextField('texto', blank=True)
    url = models.URLField(blank=True)
    file = models.FileField(upload_to='extras/', blank=True)
    # Conteúdo que só quem tem um exemplar na Estante acessa.
    owners_only = models.BooleanField('só para quem tem o Disc', default=False)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['position', 'id']

    def __str__(self):
        return self.title
