"""Reprodução sincronizada sem servidor de streaming.

Radio e House são uma lista de faixas com horário de início. Quem abre a página
recebe a faixa atual e o instante em que ela começou; o navegador calcula a
posição a partir disso, então todo mundo ouve o mesmo trecho.
"""

from datetime import timedelta


def now_playing(tracks, starts_at, now):
    """Devolve (índice, faixa, início da faixa) ou None antes do início ou depois do fim."""
    if starts_at is None or now < starts_at:
        return None
    track_start = starts_at
    for index, track in enumerate(tracks):
        track_end = track_start + timedelta(seconds=track.duration)
        if now < track_end:
            return index, track, track_start
        track_start = track_end
    return None


def total_duration(tracks):
    return timedelta(seconds=sum(track.duration for track in tracks))


def playback_data(tracks, starts_at, now, context):
    """O bloco "playback" que Radio e House devolvem para o player."""
    from .serializers import TrackSummarySerializer

    current = now_playing(tracks, starts_at, now)
    if current is None:
        return None
    index, track, track_started_at = current
    following = tracks[index + 1] if index + 1 < len(tracks) else None
    return {
        'track': TrackSummarySerializer(track, context=context).data,
        'track_started_at': track_started_at,
        'index': index,
        'next': TrackSummarySerializer(following, context=context).data if following else None,
    }
