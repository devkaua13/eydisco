import tempfile
from datetime import timedelta

from django.core.exceptions import ValidationError
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from artists.models import Artist
from releases.tests import make_release, make_track

from .models import Drop, DropItem


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class DiscoveryTests(APITestCase):
    def setUp(self):
        self.artist = Artist.objects.create(name='Artista', slug='artista')
        self.release = make_release(self.artist, 'disco', -1, 30)
        self.track = make_track(self.release, 1)
        self.drop = Drop.objects.create(title='Drop 1', slug='drop-1', published_at=timezone.now())
        DropItem.objects.create(drop=self.drop, blurb='Ouça alto.', track=self.track)
        DropItem.objects.create(drop=self.drop, blurb='Estreia.', artist=self.artist, position=1)
        Drop.objects.create(title='Futuro', slug='futuro', published_at=timezone.now() + timedelta(days=1))

    def test_route_brings_latest_published_drop(self):
        data = self.client.get('/api/route/').data
        self.assertEqual(data['drop']['slug'], 'drop-1')
        self.assertEqual([i['kind'] for i in data['drop']['items']], ['track', 'artist'])
        self.assertEqual(data['tracks'][0]['slug'], 'disco-1')
        self.assertEqual(data['featured'][0]['slug'], 'disco')

    def test_unpublished_drop_is_hidden(self):
        self.assertEqual(self.client.get('/api/drops/futuro/').status_code, 404)

    def test_item_points_to_exactly_one_thing(self):
        with self.assertRaises(ValidationError):
            DropItem(drop=self.drop, blurb='x', artist=self.artist, track=self.track).clean()
