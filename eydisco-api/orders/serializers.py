from rest_framework import serializers

from releases.models import Edition
from shelf.serializers import ItemSerializer

from .models import Order

SHIPPING_FIELDS = ['recipient_name', 'postal_code', 'street', 'number', 'complement', 'neighborhood', 'city', 'state']


class OrderSerializer(serializers.ModelSerializer):
    edition = serializers.PrimaryKeyRelatedField(queryset=Edition.objects.all(), write_only=True)
    item = ItemSerializer(read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'edition', 'item', 'price', 'status', *SHIPPING_FIELDS, 'created_at']
        read_only_fields = ['price', 'status']
