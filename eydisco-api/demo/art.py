"""Gera as imagens de demonstração em demo/assets/images.

Roda uma vez, quando a arte muda:
    uv run python manage.py shell -c "from demo.art import build; build()"
O seed só copia os arquivos prontos, para a partida da API no Render ser rápida.
"""

import io
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

IMAGES_DIR = Path(__file__).resolve().parent / 'assets' / 'images'


def jpeg(img):
    buf = io.BytesIO()
    img.convert('RGB').save(buf, 'JPEG', quality=88)
    return buf.getvalue()


def glow_cover(seed, palette, size=900):
    """Luz desfocada com faixas horizontais, no estilo das referências."""
    rnd = random.Random(seed)
    light = Image.new('RGB', (size, size))
    d = ImageDraw.Draw(light)
    for i in range(rnd.randint(2, 3)):
        r = rnd.randint(200, 330)
        cx, cy = rnd.randint(250, 650), rnd.randint(300, 620)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=palette[i % len(palette)])
    img = Image.blend(Image.new('RGB', (size, size), (8, 6, 16)), light.filter(ImageFilter.GaussianBlur(70)), 0.95)
    if rnd.random() < 0.7:
        stripes = Image.new('L', (size, size), 255)
        sd = ImageDraw.Draw(stripes)
        step = rnd.randint(14, 24)
        for y in range(0, size, step):
            sd.rectangle([0, y, size, y + step // 3], fill=150)
        img = Image.composite(img, Image.new('RGB', (size, size)), stripes)
    vignette = Image.new('L', (size, size))
    ImageDraw.Draw(vignette).ellipse([-200, -200, size + 200, size + 200], fill=255)
    return Image.composite(img, Image.new('RGB', (size, size), (4, 3, 10)), vignette.filter(ImageFilter.GaussianBlur(160)))


def stage_cover(seed):
    """Palco com luz roxa e público: foto das Houses."""
    rnd = random.Random(seed)
    w, h = 1200, 800
    light = Image.new('RGB', (w, h))
    d = ImageDraw.Draw(light)
    for _ in range(5):
        x = rnd.randint(100, w - 100)
        d.polygon([(x, 0), (x - rnd.randint(80, 200), h), (x + rnd.randint(80, 200), h)],
                  fill=rnd.choice([(140, 60, 255), (200, 80, 255), (90, 60, 220)]))
    d.ellipse([w // 2 - 260, 120, w // 2 + 260, 220], outline=(220, 120, 255), width=10)
    img = Image.blend(Image.new('RGB', (w, h), (10, 4, 22)), light.filter(ImageFilter.GaussianBlur(35)), 0.75)
    crowd = ImageDraw.Draw(img)
    for _ in range(140):
        x, y, r = rnd.randint(-20, w + 20), rnd.randint(int(h * 0.72), h), rnd.randint(18, 34)
        crowd.ellipse([x - r, y - r, x + r, y + r * 3], fill=(6, 3, 12))
    return img


def avatar(seed, color):
    img = Image.new('RGB', (600, 600), color)
    d = ImageDraw.Draw(img)
    d.ellipse([150, 90, 450, 390], fill=(8, 6, 16))
    d.ellipse([60, 330, 540, 820], fill=(8, 6, 16))
    return img.filter(ImageFilter.GaussianBlur(random.Random(seed).randint(3, 8)))


def build():
    from demo.management.commands.seed_demo import ARTISTS, HOUSES, RELEASES

    for folder in ('releases', 'artists', 'houses'):
        (IMAGES_DIR / folder).mkdir(parents=True, exist_ok=True)
    for _, _, slug, _, _, palette, _, _ in RELEASES:
        (IMAGES_DIR / 'releases' / f'{slug}.jpg').write_bytes(jpeg(glow_cover(slug, palette)))
    for i, (_, slug, _) in enumerate(ARTISTS):
        color = [(40, 20, 70), (20, 30, 70), (60, 20, 50), (20, 50, 60), (50, 30, 20)][i % 5]
        (IMAGES_DIR / 'artists' / f'{slug}.jpg').write_bytes(jpeg(avatar(slug, color)))
    for _, slug, *_ in HOUSES:
        (IMAGES_DIR / 'houses' / f'{slug}.jpg').write_bytes(jpeg(stage_cover(slug)))

