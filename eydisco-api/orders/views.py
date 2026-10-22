from rest_framework import generics, permissions
from rest_framework.exceptions import ValidationError

from .models import Order
from .serializers import SHIPPING_FIELDS, OrderSerializer
from .services import NotOnSale, SoldOut, place_order


class OrderListCreateView(generics.ListCreateAPIView):
    """Pedidos do usuário logado; POST compra um exemplar na pré-venda."""

    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).select_related('item__edition__release__artist')

    def perform_create(self, serializer):
        data = serializer.validated_data
        shipping = {field: data[field] for field in SHIPPING_FIELDS if field in data}
        try:
            serializer.instance = place_order(self.request.user, data['edition'], shipping)
        except NotOnSale:
            raise ValidationError({'edition': 'A pré-venda deste disco ainda não começou.'})
        except SoldOut:
            raise ValidationError({'edition': 'Esta edição esgotou.'})
