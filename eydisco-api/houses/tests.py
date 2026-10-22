import tempfile
from datetime import timedelta

from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from accounts.models import User
from artists.models import Artist
from releases.tests import make_release, make_track

from .models import House, HouseTrack


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class HouseTests(APITestCase):
    def setUp(self):
        self.artist = Artist.objects.create(name='Artista', slug='artista')
        release = make_release(self.artist, 'disco', -10, -5)
        self.host = User.objects.create_user('anfitriao')
        self.guest = User.objects.create_user('convidada')
        self.house = House.objects.create(
            title='Audição', slug='audicao', host=self.host, artist=self.artist,
            starts_at=timezone.now() + timedelta(hours=1),
        )
        for position in (1, 2):
            HouseTrack.objects.create(house=self.house, track=make_track(release, position, 120), position=position)

    def test_only_host_starts_early(self):
        self.client.force_authenticate(self.guest)
        self.assertEqual(self.client.post('/api/houses/audicao/start/').status_code, 403)
        self.client.force_authenticate(self.host)
        self.assertEqual(self.client.post('/api/houses/audicao/start/').data['status'], 'live')
        playback = self.client.get('/api/houses/audicao/live/').data['playback']
        self.assertEqual(playback['track']['slug'], 'disco-1')

    def test_reactions_wait_for_the_session(self):
        self.client.force_authenticate(self.guest)
        self.assertEqual(self.client.post('/api/houses/audicao/reactions/', {'emoji': '🔥'}).status_code, 400)

    def test_live_room(self):
        self.house.starts_at = timezone.now() - timedelta(seconds=10)
        self.house.save()
        self.client.force_authenticate(self.guest)
        self.client.post('/api/houses/audicao/presence/')
        first = self.client.post('/api/houses/audicao/reactions/', {'emoji': '🔥'}).data
        self.client.post('/api/houses/audicao/messages/', {'text': 'que som'})
        self.assertEqual(self.client.post('/api/houses/audicao/reactions/', {'emoji': '🍕'}).status_code, 400)

        self.client.force_authenticate(None)
        live = self.client.get('/api/houses/audicao/live/').data
        self.assertEqual(live['status'], 'live')
        self.assertEqual(live['participants'], ['convidada'])
        self.assertEqual([m['text'] for m in live['messages']], ['que som'])
        later = self.client.get('/api/houses/audicao/live/', {'after_reaction': first['id']}).data
        self.assertEqual(later['reactions'], [])

    def test_guests_cannot_post(self):
        self.assertEqual(self.client.post('/api/houses/audicao/messages/', {'text': 'oi'}).status_code, 401)

    def test_profile_lists_houses(self):
        data = self.client.get('/api/artists/artista/').data
        self.assertEqual([h['slug'] for h in data['houses']], ['audicao'])


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class HouseAccessTests(APITestCase):
    def setUp(self):
        from releases.models import Edition
        from shelf.models import Item

        self.artist = Artist.objects.create(name='Artista', slug='artista')
        self.release = make_release(self.artist, 'disco', -10, -5)
        make_track(self.release, 1, 120)
        make_track(self.release, 2, 120)
        self.host = User.objects.create_user('anfitriao')
        self.collector = User.objects.create_user('colecionadora')
        self.stranger = User.objects.create_user('estranho')
        edition = Edition.objects.create(release=self.release, name='Vinil', price='10', total_supply=10)
        Item.objects.create(edition=edition, owner=self.collector, serial_number=1)

    def create(self, **data):
        self.client.force_authenticate(self.host)
        payload = {'title': 'Sexta 23h', 'visibility': 'public', 'release': 'disco', **data}
        return self.client.post('/api/houses/', payload)

    def test_create_house_plays_the_disc_now(self):
        response = self.create(description='Bora curtir')
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['status'], 'live')
        self.assertEqual([t['slug'] for t in response.data['tracks']], ['disco-1', 'disco-2'])
        self.assertEqual(response.data['artist']['slug'], 'artista')
        self.assertTrue(response.data['is_host'])

    def test_private_house_needs_invite(self):
        data = self.create(visibility='private').data
        slug, code = data['slug'], data['invite_code']
        self.assertTrue(code)
        self.client.force_authenticate(self.stranger)
        self.assertFalse(self.client.get(f'/api/houses/{slug}/').data['access']['can_enter'])
        self.assertEqual(self.client.get(f'/api/houses/{slug}/live/').status_code, 403)
        self.assertNotIn(slug, [h['slug'] for h in self.client.get('/api/houses/').data])
        # Com o convite, entra e passa a ter acesso sem o código.
        self.assertEqual(self.client.post(f'/api/houses/{slug}/presence/?code={code}').status_code, 204)
        self.assertEqual(self.client.get(f'/api/houses/{slug}/live/').status_code, 200)
        self.assertIsNone(self.client.get(f'/api/houses/{slug}/').data['invite_code'])

    def test_collector_house_is_for_owners(self):
        slug = self.create(visibility='collector').data['slug']
        self.client.force_authenticate(self.stranger)
        self.assertEqual(self.client.get(f'/api/houses/{slug}/live/').status_code, 403)
        self.client.force_authenticate(self.collector)
        self.assertEqual(self.client.get(f'/api/houses/{slug}/live/').status_code, 200)

    def test_artist_house_requires_manager(self):
        self.assertEqual(self.create(visibility='artist').status_code, 400)
        self.artist.managers.add(self.host)
        self.assertEqual(self.create(visibility='artist').status_code, 201)

    def test_mine_tab_and_profile(self):
        slug = self.create(visibility='private').data['slug']
        self.client.force_authenticate(self.host)
        self.assertEqual([h['slug'] for h in self.client.get('/api/houses/', {'tab': 'mine'}).data], [slug])
        profile = self.client.get('/api/users/anfitriao/').data
        self.assertEqual(profile['counts']['houses_created'], 1)
        self.assertEqual(profile['activity'][0]['kind'], 'created_house')
        # Quem visita o perfil não vê a House privada.
        self.client.force_authenticate(self.stranger)
        self.assertEqual(self.client.get('/api/users/anfitriao/').data['houses'], [])

    def test_shelf_item_brings_tracks(self):
        item = self.client.get('/api/users/colecionadora/shelf/').data['results'][0]
        self.assertEqual(len(item['tracks']), 2)
