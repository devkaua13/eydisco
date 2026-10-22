from django.conf import settings
from django.db import models


class Artist(models.Model):
    name = models.CharField(max_length=150)
    slug = models.SlugField(unique=True)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='artists/', blank=True)
    # Quem pode editar a House: o próprio artista, empresário, gravadora.
    managers = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='managed_artists', blank=True)
    followers = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='following', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
