from django.shortcuts import get_object_or_404
from rest_framework import generics

from accounts.models import User

from .models import Item
from .serializers import ItemSerializer


class ShelfView(generics.ListAPIView):
    """Estante pública de um usuário."""

    serializer_class = ItemSerializer

    def get_queryset(self):
        owner = get_object_or_404(User, username=self.kwargs['username'])
        return Item.objects.filter(owner=owner).select_related('edition__release__artist', 'order').prefetch_related('edition__release__tracks')
