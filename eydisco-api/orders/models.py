from django.conf import settings
from django.db import models


class Order(models.Model):
    """Compra de um exemplar físico, com o endereço de entrega."""

    class Status(models.TextChoices):
        PENDING = 'pending', 'Aguardando pagamento'
        PAID = 'paid', 'Pago'
        SHIPPED = 'shipped', 'Enviado'
        DELIVERED = 'delivered', 'Entregue'
        CANCELED = 'canceled', 'Cancelado'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='orders')
    item = models.OneToOneField('shelf.Item', on_delete=models.PROTECT, related_name='order')
    # Preço no momento da compra; a Edition pode mudar de preço depois.
    price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status, default=Status.PENDING)

    recipient_name = models.CharField(max_length=150)
    postal_code = models.CharField(max_length=9)
    street = models.CharField(max_length=200)
    number = models.CharField(max_length=20)
    complement = models.CharField(max_length=100, blank=True)
    neighborhood = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=2)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Pedido #{self.pk} - {self.item}'
