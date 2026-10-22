from rest_framework.test import APITestCase

from accounts.models import User
from artists.models import Artist
from releases.models import Edition
from releases.tests import make_release
from shelf.models import Item

SHIPPING = {
    'recipient_name': 'Maria Silva',
    'postal_code': '01001-000',
    'street': 'Praça da Sé',
    'number': '100',
    'neighborhood': 'Sé',
    'city': 'São Paulo',
    'state': 'SP',
}


class PreorderTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user('maria', password='x')
        artist = Artist.objects.create(name='Artista', slug='artista')
        self.edition = Edition.objects.create(
            release=make_release(artist, 'disco', -1, 30), name='Vinil azul', price='199.90', total_supply=2
        )
        self.client.force_authenticate(self.user)

    def buy(self, edition=None):
        return self.client.post('/api/orders/', {'edition': (edition or self.edition).pk, **SHIPPING})

    def test_order_reserves_numbered_item(self):
        first, second = self.buy(), self.buy()
        self.assertEqual(first.status_code, 201)
        self.assertEqual(first.data['item']['serial_number'], 1)
        self.assertEqual(second.data['item']['serial_number'], 2)
        self.assertEqual(first.data['price'], '199.90')
        self.assertEqual(first.data['status'], 'pending')

    def test_sold_out(self):
        self.buy(), self.buy()
        response = self.buy()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Item.objects.count(), 2)

    def test_freed_serial_is_reused(self):
        self.buy(), self.buy()
        Item.objects.get(serial_number=1).order.delete()
        Item.objects.filter(serial_number=1).delete()
        self.assertEqual(self.buy().data['item']['serial_number'], 1)

    def test_cannot_buy_before_presale(self):
        artist = Artist.objects.get()
        edition = Edition.objects.create(
            release=make_release(artist, 'futuro', 5, 30), name='CD', price='59.90', total_supply=10
        )
        self.assertEqual(self.buy(edition).status_code, 400)

    def test_requires_login(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.buy().status_code, 401)

    def test_item_shows_on_public_shelf(self):
        self.buy()
        self.client.force_authenticate(None)
        response = self.client.get('/api/users/maria/shelf/')
        item = response.data['results'][0]
        self.assertEqual(item['serial_number'], 1)
        self.assertEqual(item['total_supply'], 2)
        self.assertEqual(item['release']['slug'], 'disco')
        self.assertNotIn('street', item)

    def test_only_lists_own_orders(self):
        self.buy()
        self.client.force_authenticate(User.objects.create_user('joao'))
        self.assertEqual(self.client.get('/api/orders/').data['count'], 0)


class AuthTests(APITestCase):
    def test_register_returns_token(self):
        response = self.client.post('/api/auth/register/', {'username': 'ana', 'password': 'senha-forte-123'})
        self.assertEqual(response.status_code, 201)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {response.data['token']}")
        self.assertEqual(self.client.get('/api/auth/me/').data['username'], 'ana')
