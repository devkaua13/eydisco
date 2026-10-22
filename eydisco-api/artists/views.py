from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Artist
from .serializers import ArtistSerializer


class ArtistDetailView(generics.RetrieveAPIView):
    """Perfil do artista."""

    queryset = Artist.objects.prefetch_related('releases')
    serializer_class = ArtistSerializer
    lookup_field = 'slug'


class FollowView(APIView):
    """POST segue o artista, DELETE deixa de seguir."""

    permission_classes = [permissions.IsAuthenticated]

    def respond(self, artist):
        return Response({
            'is_following': artist.followers.filter(pk=self.request.user.pk).exists(),
            'followers_count': artist.followers.count(),
        })

    def post(self, request, slug):
        artist = get_object_or_404(Artist, slug=slug)
        artist.followers.add(request.user)
        return self.respond(artist)

    def delete(self, request, slug):
        artist = get_object_or_404(Artist, slug=slug)
        artist.followers.remove(request.user)
        return self.respond(artist)
