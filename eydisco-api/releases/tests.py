import tempfile
from datetime import timedelta

from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from artists.models import Artist

from .models import Edition, Release


def make_release(artist, slug, presale_in_days, release_in_days):
    now = timezone.now()
    return Release.objects.create(
        artist=artist,
        title=slug.title(),
        slug=slug,
        presale_starts_at=now + timedelta(days=presale_in_days),
        released_at=now + timedelta(days=release_in_days),
    )


class FeedTests(APITestCase):
    def setUp(self):
        self.artist = Artist.objects.create(name='Artista', slug='artista')
        self.upcoming = make_release(self.artist, 'futuro', 5, 30)
        self.presale = make_release(self.artist, 'pre-venda', -1, 30)
        self.released = make_release(self.artist, 'lancado', -60, -30)
        Edition.objects.create(release=self.presale, name='Vinil', price='199.90', total_supply=10)

    def test_feed_lists_every_release(self):
        response = self.client.get('/api/feed/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 3)

    def test_feed_filters_by_status(self):
        for status, release in [('upcoming', self.upcoming), ('presale', self.presale), ('released', self.released)]:
            response = self.client.get('/api/feed/', {'status': status})
            self.assertEqual([r['slug'] for r in response.data['results']], [release.slug])
            self.assertEqual(response.data['results'][0]['status'], status)

    def test_release_detail_shows_available_editions(self):
        response = self.client.get('/api/releases/pre-venda/')
        self.assertEqual(response.data['artist']['slug'], 'artista')
        self.assertEqual(response.data['editions'][0]['available'], 10)

    def test_artist_profile_lists_releases(self):
        response = self.client.get('/api/artists/artista/')
        self.assertEqual(len(response.data['releases']), 3)


def make_track(release, position, duration=60, **fields):
    from django.core.files.uploadedfile import SimpleUploadedFile

    from .models import Track

    return Track.objects.create(
        release=release,
        position=position,
        title=f'Faixa {position}',
        slug=f'{release.slug}-{position}',
        audio=SimpleUploadedFile(f'{release.slug}-{position}.mp3', b'audio'),
        duration=duration,
        **fields,
    )


class PlaybackTests(APITestCase):
    def test_now_playing_walks_the_tracklist(self):
        from types import SimpleNamespace

        from .playback import now_playing

        start = timezone.now()
        tracks = [SimpleNamespace(duration=60), SimpleNamespace(duration=120)]
        self.assertIsNone(now_playing(tracks, start, start - timedelta(seconds=1)))
        self.assertEqual(now_playing(tracks, start, start + timedelta(seconds=30))[0], 0)
        index, _, track_start = now_playing(tracks, start, start + timedelta(seconds=90))
        self.assertEqual((index, track_start), (1, start + timedelta(seconds=60)))
        self.assertIsNone(now_playing(tracks, start, start + timedelta(seconds=180)))


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class DiscTests(APITestCase):
    def setUp(self):
        from accounts.models import User

        from .models import Credit, Extra

        self.artist = Artist.objects.create(name='Artista', slug='artista')
        self.release = make_release(self.artist, 'disco', -1, 30)
        self.edition = Edition.objects.create(release=self.release, name='Vinil', price='99.90', total_supply=5, includes='Encarte\nPôster')
        self.track = make_track(self.release, 1, story='Gravada numa noite só.')
        Credit.objects.create(track=self.track, role='Produção', name='Fulana')
        Extra.objects.create(release=self.release, title='Demo caseira', body='segredo', owners_only=True)
        Extra.objects.create(release=self.release, title='Clipe', url='https://example.com/clipe')
        self.user = User.objects.create_user('ana', password='x')

    def test_disc_shows_tracks_includes_and_demo_flag(self):
        data = self.client.get('/api/releases/disco/').data
        self.assertEqual(data['tracks'][0]['slug'], 'disco-1')
        self.assertEqual(data['editions'][0]['includes'], ['Encarte', 'Pôster'])
        self.assertTrue(data['editions'][0]['is_demo'])

    def test_owners_only_extra_is_locked_for_visitors(self):
        extras = {e['title']: e for e in self.client.get('/api/releases/disco/').data['extras']}
        self.assertTrue(extras['Demo caseira']['locked'])
        self.assertEqual(extras['Demo caseira']['body'], '')
        self.assertFalse(extras['Clipe']['locked'])

    def test_owner_unlocks_extras(self):
        from shelf.models import Item

        Item.objects.create(edition=self.edition, owner=self.user, serial_number=3)
        self.client.force_authenticate(self.user)
        data = self.client.get('/api/releases/disco/').data
        extras = {e['title']: e for e in data['extras']}
        self.assertEqual(extras['Demo caseira']['body'], 'segredo')
        self.assertEqual(data['my_items'][0]['serial_number'], 3)

    def test_behind_the_track(self):
        data = self.client.get('/api/tracks/disco-1/').data
        self.assertEqual(data['story'], 'Gravada numa noite só.')
        self.assertEqual(data['credits'], [{'role': 'Produção', 'name': 'Fulana'}])
        self.assertEqual(data['artist']['slug'], 'artista')

    def test_search(self):
        data = self.client.get('/api/search/', {'q': 'artis'}).data
        self.assertEqual([a['slug'] for a in data['artists']], ['artista'])
        self.assertEqual(len(data['tracks']), 1)
        self.assertEqual(self.client.get('/api/search/', {'q': 'a'}).data['artists'], [])

    def test_follow_and_unfollow(self):
        self.client.force_authenticate(self.user)
        self.assertTrue(self.client.post('/api/artists/artista/follow/').data['is_following'])
        profile = self.client.get('/api/artists/artista/').data
        self.assertEqual((profile['followers_count'], profile['is_following']), (1, True))
        self.assertEqual(self.client.delete('/api/artists/artista/follow/').data['followers_count'], 0)

    def test_media_supports_range(self):
        from django.test import RequestFactory

        from config.media import serve_media

        request = RequestFactory().get('/', HTTP_RANGE='bytes=1-3')
        response = serve_media(request, self.track.audio.name)
        self.assertEqual(response.status_code, 206)
        self.assertEqual(response.content, b'udi')
        self.assertEqual(response['Content-Range'], 'bytes 1-3/5')
