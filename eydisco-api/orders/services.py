from django.db import transaction
from django.utils import timezone

from releases.models import Edition
from shelf.models import Item

from .models import Order


class NotOnSale(Exception):
    pass


class SoldOut(Exception):
    pass


@transaction.atomic
def place_order(user, edition, shipping):
    """Reserva o próximo número livre da edição e cria o pedido."""
    # Trava a edição para dois pedidos simultâneos não pegarem o mesmo número.
    edition = Edition.objects.select_for_update().select_related('release').get(pk=edition.pk)

    if timezone.now() < edition.release.presale_starts_at:
        raise NotOnSale

    used = set(edition.items.values_list('serial_number', flat=True))
    serial = next((n for n in range(1, edition.total_supply + 1) if n not in used), None)
    if serial is None:
        raise SoldOut

    item = Item.objects.create(edition=edition, owner=user, serial_number=serial)
    return Order.objects.create(user=user, item=item, price=edition.price, **shipping)
