"""Popula o Eydisco com dados de demonstração: artistas, Discs com faixas,
Behind the Track, Discovery Drop, programas da rádio, Houses e colecionadores.

    uv run python manage.py seed_demo             # cria o que faltar
    uv run python manage.py seed_demo --if-empty  # com dados, só repõe arquivos que sumiram
    uv run python manage.py seed_demo --on-air    # só recoloca rádio e Houses no ar agora

Faixas e imagens vêm de demo/assets (as imagens são geradas por demo/art.py).
"""

import os
import random
from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import User
from artists.models import Artist
from discovery.models import Drop, DropItem
from houses.models import House, HouseTrack, Message, Participant
from orders.services import place_order
from radio.models import Show, ShowTrack
from releases.models import Credit, Edition, Extra, Release, Track

ASSETS_DIR = Path(__file__).resolve().parents[2] / 'assets'
AUDIO_DIR = ASSETS_DIR / 'audio'
IMAGES_DIR = ASSETS_DIR / 'images'

ARTISTS = [
    ('Marina Sena', 'marina-sena', 'Cantora e compositora mineira. Pop tropical com sintetizador, guitarra baiana e muito calor.'),
    ('Terno Rei', 'terno-rei', 'Banda paulistana de indie e dream pop. Guitarras com reverb e letras sobre a cidade à noite.'),
    ('Luedji Luna', 'luedji-luna', 'Cantora baiana. Jazz, MPB e música afro-diaspórica.'),
    ('BaianaSystem', 'baianasystem', 'Guitarra baiana, sound system e carnaval de rua de Salvador.'),
    ('Ana Frango Elétrico', 'ana-frango-eletrico', 'Compositora e produtora carioca. Canções tortas, metais e muito humor.'),
]

# artista, título, slug, dias até a pré-venda, dias até o lançamento, paleta da capa, edições, faixas
RELEASES = [
    ('marina-sena', 'Coisas Naturais', 'coisas-naturais', -10, 25,
     [(255, 120, 40), (255, 60, 140), (255, 200, 90)],
     [('Vinil laranja translúcido', '189.90', 500), ('Vinil preto 180g', '159.90', 1000), ('CD digipak', '59.90', 300)],
     ['Sol de Maio', 'Coisas Naturais', 'Lua de Vidro', 'Sabiá']),
    ('terno-rei', 'Nenhuma Estrela', 'nenhuma-estrela', -3, 40,
     [(60, 120, 255), (120, 60, 255), (40, 220, 255)],
     [('Vinil azul marmorizado', '199.90', 300), ('Fita cassete', '49.90', 150)],
     ['Nenhuma Estrela', 'Avenida', 'Três da Manhã']),
    ('luedji-luna', 'Um Mar Para Cada Um', 'um-mar-para-cada-um', 12, 60,
     [(30, 200, 220), (40, 80, 255), (255, 90, 160)],
     [('Vinil duplo verde-água', '249.90', 400)],
     ['Mar Aberto', 'Cais', 'Banzo']),
    ('baianasystem', 'O Futuro Não Demora', 'o-futuro-nao-demora', -400, -330,
     [(255, 210, 40), (255, 70, 60), (140, 40, 255)],
     [('Vinil amarelo', '179.90', 800), ('Box com zine', '349.90', 100)],
     ['Lucro', 'Reza Forte', 'Navio Pirata', 'Água']),
    ('marina-sena', 'De Primeira', 'de-primeira', -900, -850,
     [(255, 110, 200), (170, 70, 255), (255, 180, 120)],
     [('Vinil rosa', '169.90', 500)],
     ['De Primeira', 'Voltei pra Mim', 'Tudo Pra Amar Você']),
    ('terno-rei', 'Violeta', 'violeta', -1500, -1450,
     [(150, 60, 255), (90, 30, 200), (255, 90, 230)],
     [('Vinil roxo', '149.90', 500)],
     ['Violeta', 'Dia Lindo', 'Yoko']),
]

INCLUDES = {
    'Vinil': 'Vinil 180g numerado à mão\nEncarte com letras e fotos\nDownload em alta qualidade',
    'CD': 'CD em digipak\nLivreto de 12 páginas',
    'Fita': 'Fita cassete com estojo colorido\nCartão de download',
    'Box': 'Vinil duplo\nZine de 40 páginas\nPôster 60×90\nDownload em alta qualidade',
}
STORIES = [
    'Nasceu numa passagem de som, quando o baixo errou de tom e todo mundo gostou do erro.',
    'A primeira versão tinha o dobro do tamanho. Cortamos tudo que não fazia a gente dançar.',
    'Gravada em uma tarde só, com a janela aberta. Dá pra ouvir a chuva no fim.',
    'O refrão veio antes da letra; por meses a gente cantou só vogais em cima dele.',
]
INSPIRATIONS = [
    'Discos de samba-rock dos anos 70, ônibus noturno, a voz da avó cantando no quintal.',
    'Synthpop japonês, guitarra baiana e o barulho de uma cidade acordando.',
    'Jazz espiritual, Clube da Esquina e uma viagem de barco até Itaparica.',
]
ROLES = [('Composição', None), ('Produção', 'Lia Mar'), ('Mixagem', 'Estúdio Cais'), ('Bateria', 'Davi Rocha'), ('Masterização', 'Rafa Pires')]

SHOWS = [
    # título, slug, quem apresenta, artista que apresenta, minutos até começar, descrição
    ('Manhã de Sol', 'manha-de-sol', 'DJ Nara', None, -2, 'Pop tropical e MPB nova para começar o dia.'),
    ('Pista Lenta', 'pista-lenta', 'Terno Rei', 'terno-rei', 50, 'A banda escolhe o que ouve depois do show.'),
    ('Guitarra Baiana', 'guitarra-baiana', 'DJ Rafa Dias', None, 4 * 60, 'Do trio elétrico ao sound system.'),
    ('Mar de Dentro', 'mar-de-dentro', 'Luedji Luna', 'luedji-luna', 26 * 60, 'Jazz, MPB e música afro-diaspórica.'),
]

HOUSES = [
    # título, slug, anfitrião, Disc, tipo, minutos até começar, mensagem
    ('Audição de Coisas Naturais', 'audicao-coisas-naturais', 'fa1', 'coisas-naturais', 'public', -1,
     'Vamos ouvir o disco novo inteiro, em ordem, antes do lançamento. Quem trouxer a faixa favorita no chat ganha destaque.'),
    ('Sexta 23h, só pedrada', 'sexta-23h', 'colecionador', 'o-futuro-nao-demora', 'private', -1,
     'Bora curtir essa sexta com muita música boa. Quem trouxer recomendação ganha ponto.'),
    ('Pista Violeta', 'pista-violeta', 'fa3', 'violeta', 'public', -1, 'Violeta inteiro, sem pular nada.'),
    ('Sala dos colecionadores', 'sala-dos-colecionadores', 'fa2', 'coisas-naturais', 'collector', 30,
     'Só para quem tem Coisas Naturais na coleção. Vamos ouvir com os extras abertos.'),
    ('Terno Rei de madrugada', 'terno-rei-de-madrugada', 'terno.rei', 'nenhuma-estrela', 'artist', 120,
     'A banda apresenta Nenhuma Estrela de ponta a ponta, com luz apagada.'),
]
# Uma House de demonstração toca o Disc algumas vezes, para ficar no ar enquanto alguém olha.
HOUSE_REPEAT = 4

SHIPPING = dict(recipient_name='Ana Souza', postal_code='01310-100', street='Avenida Paulista', number='1000',
                complement='ap 12', neighborhood='Bela Vista', city='São Paulo', state='SP')


def save_asset(field_file, source):
    with source.open('rb') as f:
        field_file.save(source.name, File(f))


def audio_assets():
    """Slug da faixa -> arquivo em demo/assets/audio, na mesma ordem do seed."""
    paths, index = {}, 0
    for _, _, slug, _, _, _, _, tracks in RELEASES:
        for position in range(1, len(tracks) + 1):
            index += 1
            paths[f'{slug}-{position}'] = AUDIO_DIR / f'{index}.mp3'
    return paths


class Command(BaseCommand):
    help = 'Popula o Eydisco com dados de demonstração.'

    def add_arguments(self, parser):
        parser.add_argument('--if-empty', action='store_true', help='Não faz nada se já houver artistas.')
        parser.add_argument('--on-air', action='store_true', help='Só recoloca a rádio e as Houses no ar agora.')

    def handle(self, *args, if_empty=False, on_air=False, **options):
        if on_air:
            self.put_on_air()
            return
        if if_empty and Artist.objects.exists():
            self.restore_media()
            return
        with transaction.atomic():
            users = self.create_users()
            releases = self.create_catalog()
            self.create_collections(users, releases)
            self.create_drop(releases)
            self.create_shows()
            self.create_houses(users, releases)
        self.stdout.write(self.style.SUCCESS(
            f'Pronto: {Artist.objects.count()} artistas, {Track.objects.count()} faixas, '
            f'{Show.objects.count()} programas, {House.objects.count()} Houses.'
        ))

    def create_users(self):
        # Em produção a senha vem do DEMO_PASSWORD; sem ela, as contas existem mas
        # ninguém entra com elas. Localmente, o padrão é discos123.
        password = os.environ.get('DEMO_PASSWORD') or ('discos123' if settings.DEBUG else None)
        if password is None:
            self.stdout.write(self.style.WARNING('DEMO_PASSWORD vazio: contas de demonstração sem login.'))
        users = {}
        for username, first_name, last_name in [('colecionador', 'Ana', 'Souza'), ('terno.rei', 'Terno Rei', '')] + [
            (f'fa{i}', '', '') for i in range(16)
        ]:
            user, created = User.objects.get_or_create(username=username, defaults={'first_name': first_name, 'last_name': last_name})
            if created:
                if password:
                    user.set_password(password)
                else:
                    user.set_unusable_password()
                user.save()
            users[username] = user
        return users

    def create_catalog(self):
        now = timezone.now()
        for name, slug, bio in ARTISTS:
            artist, created = Artist.objects.get_or_create(slug=slug, defaults={'name': name, 'bio': bio})
            if created or not artist.avatar:
                save_asset(artist.avatar, IMAGES_DIR / 'artists' / f'{slug}.jpg')
        Artist.objects.get(slug='terno-rei').managers.add(User.objects.get(username='terno.rei'))

        rnd = random.Random(3)
        audio_index = 0
        releases = {}
        for artist_slug, title, slug, presale, release, _palette, editions, tracks in RELEASES:
            r, created = Release.objects.get_or_create(slug=slug, defaults={
                'artist': Artist.objects.get(slug=artist_slug),
                'title': title,
                'description': f'{title} em edição física numerada. Cada exemplar sai da fábrica com o número na contracapa.',
                'story': f'{title} foi gravado em dez dias, entre o fim de uma turnê e o começo de outra. A ideia era '
                         'registrar o som da banda ao vivo, sem esconder respiração nem ruído de sala.',
                'is_featured': slug in ('coisas-naturais', 'nenhuma-estrela', 'um-mar-para-cada-um'),
                'presale_starts_at': now + timedelta(days=presale),
                'released_at': now + timedelta(days=release),
            })
            if not r.cover:
                save_asset(r.cover, IMAGES_DIR / 'releases' / f'{slug}.jpg')
            for name, price, supply in editions:
                key = next((k for k in INCLUDES if k.lower() in name.lower()), 'Vinil')
                Edition.objects.get_or_create(release=r, name=name, defaults={
                    'price': price, 'total_supply': supply, 'includes': INCLUDES[key]})
            for position, track_title in enumerate(tracks, start=1):
                audio_index += 1
                track_slug = f'{slug}-{position}'
                if Track.objects.filter(slug=track_slug).exists():
                    continue
                with (AUDIO_DIR / f'{audio_index}.mp3').open('rb') as f:
                    track = Track(release=r, position=position, title=track_title, slug=track_slug,
                                  story=rnd.choice(STORIES), inspirations=rnd.choice(INSPIRATIONS), is_featured=position == 1)
                    track.audio.save(f'{track_slug}.mp3', File(f), save=False)
                    track.save()
                for order, (role, credit_name) in enumerate(ROLES):
                    Credit.objects.create(track=track, role=role, name=credit_name or r.artist.name, position=order)
                if position == 1:
                    Extra.objects.create(release=r, track=track, title='Letra comentada',
                                         body='Cada verso desta faixa tem uma história. A primeira linha foi escrita num guardanapo.')
            if not r.extras.filter(track__isnull=True).exists():
                Extra.objects.create(release=r, kind='video', title='Making of no estúdio', url='https://example.com/making-of')
                Extra.objects.create(release=r, kind='audio', title='Demo caseira da faixa-título', owners_only=True, position=1,
                                     body='A primeira gravação, feita no celular, antes de qualquer arranjo.')
                Extra.objects.create(release=r, kind='text', title='Carta da banda para quem comprou', owners_only=True, position=2,
                                     body='Obrigado por levar este disco pra casa. Ele só existe porque vocês quiseram.')
            releases[slug] = r
        return releases

    def create_collections(self, users, releases):
        collector = users['colecionador']
        if collector.items.exists():
            return
        fans = [users[f'fa{i}'] for i in range(16)]
        rnd = random.Random(7)
        # Gente comprando antes, para os números não começarem em #1.
        for slug in ['coisas-naturais', 'nenhuma-estrela', 'o-futuro-nao-demora', 'de-primeira']:
            for edition in releases[slug].editions.all():
                for fan in rnd.sample(fans, rnd.randint(4, 12)):
                    place_order(fan, edition, SHIPPING)
        for slug, index, status in [('o-futuro-nao-demora', 0, 'delivered'), ('de-primeira', 0, 'delivered'),
                                    ('coisas-naturais', 0, 'paid'), ('nenhuma-estrela', 1, 'pending')]:
            edition = list(releases[slug].editions.order_by('id'))[index]
            order = place_order(collector, edition, SHIPPING)
            order.status = status
            order.save()

    def create_drop(self, releases):
        drop, created = Drop.objects.get_or_create(slug='drop-de-estreia', defaults={
            'title': 'Quatro discos para ouvir de fone no ônibus',
            'intro': 'A seleção da semana: um disco que acabou de abrir pré-venda, uma faixa que não sai da nossa cabeça, '
                     'um clássico recente e uma estreia.',
            'published_at': timezone.now() - timedelta(days=1),
        })
        if not created:
            return
        DropItem.objects.create(drop=drop, position=0, release=releases['nenhuma-estrela'],
                                blurb='Terno Rei mais lento e mais bonito. As guitarras parecem neblina de madrugada.')
        DropItem.objects.create(drop=drop, position=1, track=Track.objects.get(slug='coisas-naturais-1'),
                                blurb='Sol de Maio abre o disco novo da Marina Sena com um baixo que pede janela aberta.')
        DropItem.objects.create(drop=drop, position=2, release=releases['o-futuro-nao-demora'],
                                blurb='O disco que levou o carnaval de Salvador para fone de ouvido. Ainda soa como amanhã.')
        DropItem.objects.create(drop=drop, position=3, artist=Artist.objects.get(slug='ana-frango-eletrico'),
                                blurb='Ana Frango Elétrico faz canção torta do jeito certo. Comece por aqui antes de todo mundo.')

    def create_shows(self):
        tracks = list(Track.objects.all())
        rnd = random.Random(11)
        for title, slug, host, artist_slug, minutes, description in SHOWS:
            show, created = Show.objects.get_or_create(slug=slug, defaults={
                'title': title, 'host_name': host, 'description': description,
                'host_artist': Artist.objects.filter(slug=artist_slug).first(),
                'starts_at': timezone.now() + timedelta(minutes=minutes),
            })
            if created:
                shuffled = tracks[:]
                rnd.shuffle(shuffled)
                for position, track in enumerate(shuffled):
                    ShowTrack.objects.create(show=show, track=track, position=position)

    def create_houses(self, users, releases):
        fans = [users[f'fa{i}'] for i in range(16)]
        for title, slug, host, release_slug, visibility, minutes, description in HOUSES:
            release = releases[release_slug]
            house, created = House.objects.get_or_create(slug=slug, defaults={
                'title': title, 'host': users[host], 'release': release, 'artist': release.artist,
                'visibility': visibility, 'description': description,
                'starts_at': timezone.now() + timedelta(minutes=minutes),
            })
            if not created:
                continue
            save_asset(house.cover, IMAGES_DIR / 'houses' / f'{slug}.jpg')
            position = 0
            for _ in range(HOUSE_REPEAT if minutes < 0 else 1):
                for track in release.tracks.all():
                    HouseTrack.objects.create(house=house, track=track, position=position)
                    position += 1
            if minutes < 0:
                for fan, text in zip(fans[4:8], ['essa faixa é surreal', 'já tô viciada nesse álbum', 'alguém mais tá arrepiado?', 'qual é a próxima?']):
                    Message.objects.create(house=house, user=fan, text=text)
        self.put_on_air()

    def put_on_air(self):
        """Programas e Houses ao vivo começam agora; as demais, mais tarde."""
        now = timezone.now()
        for _, slug, _, _, minutes, _ in SHOWS:
            Show.objects.filter(slug=slug).update(starts_at=now + timedelta(minutes=minutes))
        fans = list(User.objects.filter(username__startswith='fa').order_by('username')[:16])
        for _, slug, _, _, _, minutes, _ in HOUSES:
            House.objects.filter(slug=slug).update(starts_at=now + timedelta(minutes=minutes))
            house = House.objects.filter(slug=slug).first()
            if house and minutes < 0:
                # Público de demonstração: fica "na sala" enquanto a sessão dura.
                ends = house.ends_at
                for fan in random.Random(slug).sample(fans, min(6, len(fans))):
                    Participant.objects.update_or_create(house=house, user=fan, defaults={'last_seen_at': ends})
        self.stdout.write('Rádio e Houses de demonstração no ar.')

    def restore_media(self):
        """Repõe os arquivos de demonstração que sumiram do storage.

        Sem bucket, o Render gratuito apaga o disco quando o serviço reinicia; o
        banco continua apontando para os arquivos. Os de demonstração voltam dos
        assets; os enviados pelo site não têm como voltar, então o campo é limpo
        e a página usa a imagem padrão (a capa do Disc, as iniciais).
        """
        restored, cleared = 0, 0

        def ensure(instance, field, source=None, required=False):
            nonlocal restored, cleared
            file = getattr(instance, field)
            if not file or file.storage.exists(file.name):
                return
            if source and source.exists():
                with source.open('rb') as f:
                    file.storage.save(file.name, File(f))
                restored += 1
            elif not required:
                setattr(instance, field, '')
                instance.save(update_fields=[field])
                cleared += 1

        audio = audio_assets()
        for track in Track.objects.all():
            ensure(track, 'audio', audio.get(track.slug), required=True)
        for release in Release.objects.all():
            ensure(release, 'cover', IMAGES_DIR / 'releases' / f'{release.slug}.jpg')
        for artist in Artist.objects.all():
            ensure(artist, 'avatar', IMAGES_DIR / 'artists' / f'{artist.slug}.jpg')
        for house in House.objects.all():
            ensure(house, 'cover', IMAGES_DIR / 'houses' / f'{house.slug}.jpg')
        for extra in Extra.objects.exclude(file=''):
            ensure(extra, 'file')
        self.stdout.write(f'Arquivos: {restored} repostos, {cleared} sem cópia (campo limpo).')
