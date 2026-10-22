import tempfile
from datetime import timedelta

from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from artists.models import Artist
from releases.tests import make_release, make_track

from .models import Show, ShowTrack


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class RadioTests(APITestCase):
    def setUp(self):
        release = make_release(Artist.objects.create(name='Artista', slug='artista'), 'disco', -10, -5)
        self.tracks = [make_track(release, 1, 100), make_track(release, 2, 100)]

    def schedule(self, slug, starts_in_seconds):
        show = Show.objects.create(title=slug, slug=slug, host_name='DJ', starts_at=timezone.now() + timedelta(seconds=starts_in_seconds))
        for position, track in enumerate(self.tracks):
            ShowTrack.objects.create(show=show, track=track, position=position)
        return show

    def test_now_playing(self):
        self.schedule('no-ar', -150)
        self.schedule('depois', 3600)
        data = self.client.get('/api/radio/').data
        self.assertEqual(data['show']['slug'], 'no-ar')
        self.assertEqual(data['playback']['track']['slug'], 'disco-2')
        self.assertIsNone(data['playback']['next'])
        self.assertEqual([s['slug'] for s in data['upcoming']], ['depois'])

    def test_nothing_on_air_after_the_show_ends(self):
        self.schedule('acabou', -500)
        data = self.client.get('/api/radio/').data
        self.assertIsNone(data['show'])
        self.assertIsNone(data['playback'])
