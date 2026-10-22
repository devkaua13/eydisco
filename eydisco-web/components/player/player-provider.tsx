"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import type { Playback, TrackSummary } from "@/lib/types"

// Rádio ou House: o servidor diz qual faixa toca e desde quando.
export type LiveSource = {
  kind: "radio" | "house"
  // Identifica a transmissão, para o botão saber se é ela que está tocando.
  id: string
  title: string
  href: string
  endpoint: string
}

type LiveResponse = { server_time: string; playback: Playback | null }

type PlayerContextValue = {
  track: TrackSummary | null
  queue: TrackSummary[]
  live: LiveSource | null
  offAir: boolean
  playing: boolean
  time: number
  playQueue: (tracks: TrackSummary[], index: number) => void
  playLive: (source: LiveSource) => void
  toggle: () => void
  next: () => void
  previous: () => void
  seek: (seconds: number) => void
  stop: () => void
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

const LIVE_POLL_MS = 15_000
// Diferença tolerada entre o áudio e a posição esperada antes de corrigir.
const DRIFT_SECONDS = 2

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (!context) throw new Error("usePlayer precisa do PlayerProvider")
  return context
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [queue, setQueue] = useState<TrackSummary[]>([])
  const [index, setIndex] = useState(0)
  const [live, setLive] = useState<LiveSource | null>(null)
  const [liveTrack, setLiveTrack] = useState<TrackSummary | null>(null)
  const [offAir, setOffAir] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)

  // Onde o áudio ao vivo deveria estar agora, em segundos, ou null se não há nada no ar.
  const liveTarget = useRef<{ startedAt: number; skew: number } | null>(null)

  const track = live ? liveTrack : (queue[index] ?? null)

  function expectedLivePosition() {
    const target = liveTarget.current
    if (!target) return 0
    return (Date.now() + target.skew - target.startedAt) / 1000
  }

  const syncLive = useCallback(async (source: LiveSource) => {
    const audio = audioRef.current
    if (!audio) return
    let data: LiveResponse
    try {
      const response = await fetch(source.endpoint, { cache: "no-store" })
      if (!response.ok) return
      data = await response.json()
    } catch {
      return
    }
    if (!data.playback) {
      liveTarget.current = null
      setOffAir(true)
      setLiveTrack(null)
      audio.pause()
      return
    }
    setOffAir(false)
    liveTarget.current = {
      startedAt: Date.parse(data.playback.track_started_at),
      skew: Date.parse(data.server_time) - Date.now(),
    }
    const nextTrack = data.playback.track
    if (audio.dataset.slug !== nextTrack.slug) {
      audio.dataset.slug = nextTrack.slug
      audio.src = nextTrack.audio
      setLiveTrack(nextTrack)
      // A posição é aplicada no loadedmetadata, quando o navegador já pode pular.
      audio.play().catch(() => setPlaying(false))
    } else if (
      Math.abs(audio.currentTime - expectedLivePosition()) > DRIFT_SECONDS
    ) {
      audio.currentTime = expectedLivePosition()
    }
  }, [])

  // Enquanto ao vivo, confere a posição de tempos em tempos.
  useEffect(() => {
    if (!live) return
    const first = window.setTimeout(() => syncLive(live), 0)
    const timer = window.setInterval(() => syncLive(live), LIVE_POLL_MS)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(timer)
    }
  }, [live, syncLive])

  // Na fila, troca o arquivo quando a faixa muda.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || live) return
    const current = queue[index]
    if (!current || audio.dataset.slug === current.slug) return
    audio.dataset.slug = current.slug
    audio.src = current.audio
    audio.play().catch(() => setPlaying(false))
  }, [queue, index, live])

  // Mostra a faixa no controle de mídia do sistema (tela bloqueada, fone com botões).
  useEffect(() => {
    if (!track || !("mediaSession" in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist.name,
      album: track.release.title,
      artwork: track.release.cover ? [{ src: track.release.cover }] : [],
    })
  }, [track])

  const playQueue = useCallback((tracks: TrackSummary[], start: number) => {
    liveTarget.current = null
    setLive(null)
    setLiveTrack(null)
    setOffAir(false)
    setQueue(tracks)
    setIndex(start)
    const audio = audioRef.current
    // Mesma faixa de novo: recomeça em vez de ignorar.
    if (audio && audio.dataset.slug === tracks[start]?.slug) {
      audio.currentTime = 0
      audio.play().catch(() => setPlaying(false))
    }
  }, [])

  const playLive = useCallback((source: LiveSource) => {
    setQueue([])
    setOffAir(false)
    setLive(source)
    // O play acontece dentro do clique para o navegador liberar o áudio.
    audioRef.current?.play().catch(() => undefined)
  }, [])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      // Ao vivo não tem pausa de verdade: voltar é voltar para onde a transmissão está.
      if (live && liveTarget.current) audio.currentTime = expectedLivePosition()
      audio.play().catch(() => setPlaying(false))
    } else {
      audio.pause()
    }
  }, [live])

  const next = useCallback(() => {
    setIndex((i) => (i + 1 < queue.length ? i + 1 : i))
  }, [queue.length])

  const previous = useCallback(() => {
    const audio = audioRef.current
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0
      return
    }
    setIndex((i) => Math.max(0, i - 1))
  }, [])

  const seek = useCallback(
    (seconds: number) => {
      if (audioRef.current && !live) audioRef.current.currentTime = seconds
    },
    [live]
  )

  const stop = useCallback(() => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.removeAttribute("src")
      delete audio.dataset.slug
      audio.load()
    }
    liveTarget.current = null
    setLive(null)
    setLiveTrack(null)
    setQueue([])
    setOffAir(false)
    setTime(0)
  }, [])

  function onLoadedMetadata() {
    const audio = audioRef.current
    if (audio && live && liveTarget.current)
      audio.currentTime = expectedLivePosition()
  }

  function onEnded() {
    if (live) {
      // A próxima faixa já deve estar no ar; um respiro cobre a diferença de relógio.
      window.setTimeout(() => syncLive(live), 500)
    } else if (index + 1 < queue.length) {
      setIndex(index + 1)
    } else {
      setPlaying(false)
    }
  }

  const value = useMemo(
    () => ({
      track,
      queue,
      live,
      offAir,
      playing,
      time,
      playQueue,
      playLive,
      toggle,
      next,
      previous,
      seek,
      stop,
    }),
    [
      track,
      queue,
      live,
      offAir,
      playing,
      time,
      playQueue,
      playLive,
      toggle,
      next,
      previous,
      seek,
      stop,
    ]
  )

  return (
    <PlayerContext value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
      />
    </PlayerContext>
  )
}
