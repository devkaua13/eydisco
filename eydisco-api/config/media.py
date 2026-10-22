"""Serve o /media/ do disco aceitando Range.

O static() do Django sempre devolve o arquivo inteiro. Sem resposta 206 o
navegador não consegue pular para o meio de uma faixa, e a Radio e a House
precisam disso para tocar todo mundo no mesmo ponto. Com bucket S3/R2
configurado, quem serve o /media/ é o storage, que já aceita Range.
"""

import mimetypes
import re
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404, HttpResponse
from django.utils._os import safe_join

RANGE = re.compile(r'bytes=(\d*)-(\d*)$')


def serve_media(request, path):
    try:
        full_path = Path(safe_join(settings.MEDIA_ROOT, path))
    except ValueError:
        raise Http404
    if not full_path.is_file():
        raise Http404

    size = full_path.stat().st_size
    content_type = mimetypes.guess_type(full_path)[0] or 'application/octet-stream'
    match = RANGE.match(request.headers.get('Range', ''))
    if not match or not any(match.groups()):
        response = FileResponse(full_path.open('rb'), content_type=content_type)
        response['Accept-Ranges'] = 'bytes'
        return response

    first, last = match.groups()
    if first:
        start, end = int(first), int(last) if last else size - 1
    else:
        # bytes=-500: os últimos 500 bytes.
        start, end = max(size - int(last), 0), size - 1
    end = min(end, size - 1)
    if start > end:
        response = HttpResponse(status=416)
        response['Content-Range'] = f'bytes */{size}'
        return response

    with full_path.open('rb') as file:
        file.seek(start)
        data = file.read(end - start + 1)
    response = HttpResponse(data, status=206, content_type=content_type)
    response['Content-Range'] = f'bytes {start}-{end}/{size}'
    response['Accept-Ranges'] = 'bytes'
    return response
