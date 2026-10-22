"use client"

import Image from "next/image"
import Link from "next/link"
import {
  PauseIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon,
  XIcon,
} from "lucide-react"

import { usePlayer } from "@/components/player/player-provider"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { formatDuration } from "@/lib/format"

export function PlayerBar() {
  const {
    track,
    live,
    offAir,
    playing,
    time,
    queue,
    toggle,
    next,
    previous,
    seek,
    stop,
  } = usePlayer()

  if (!track && !(live && offAir)) {
    // Enquanto a transmissão carrega, a barra ainda não tem o que mostrar.
    return live ? <PlayerShell>Sintonizando {live.title}...</PlayerShell> : null
  }

  if (!track && live) {
    return (
      <PlayerShell onClose={stop}>
        <span>
          {live.title} está fora do ar agora.{" "}
          <Link href={live.href} className="underline underline-offset-4">
            Ver programação
          </Link>
        </span>
      </PlayerShell>
    )
  }
  if (!track) return null

  const index = queue.findIndex((t) => t.slug === track.slug)

  return (
    <PlayerShell onClose={stop}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
          {track.release.cover && (
            <Image
              src={track.release.cover}
              alt=""
              fill
              sizes="3rem"
              className="object-cover"
            />
          )}
        </div>
        <div className="flex min-w-0 flex-col">
          <Link
            href={`/faixas/${track.slug}`}
            className="truncate text-sm leading-tight font-semibold underline-offset-4 hover:underline"
          >
            {track.title}
          </Link>
          <Link
            href={`/artistas/${track.artist.slug}`}
            className="truncate text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {track.artist.name}
          </Link>
          {live && (
            <Link
              href={live.href}
              className="truncate text-xs text-brand underline-offset-4 hover:underline"
            >
              Ao vivo em {live.title}
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {!live && (
          <Button
            variant="ghost"
            size="icon"
            onClick={previous}
            aria-label="Faixa anterior"
          >
            <SkipBackIcon />
          </Button>
        )}
        <Button
          size="icon-lg"
          onClick={toggle}
          aria-label={playing ? "Pausar" : "Tocar"}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </Button>
        {!live && (
          <Button
            variant="ghost"
            size="icon"
            onClick={next}
            disabled={index < 0 || index + 1 >= queue.length}
            aria-label="Próxima faixa"
          >
            <SkipForwardIcon />
          </Button>
        )}
      </div>

      <div className="hidden flex-1 items-center gap-3 md:flex">
        <span className="w-10 text-right text-xs text-muted-foreground">
          {formatDuration(time)}
        </span>
        {live ? (
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-brand"
              style={{
                width: `${Math.min(100, (time / Math.max(track.duration, 1)) * 100)}%`,
              }}
            />
          </div>
        ) : (
          <Slider
            aria-label="Posição na faixa"
            className="flex-1"
            min={0}
            max={Math.max(track.duration, 1)}
            value={[time]}
            onValueChange={(value) =>
              seek(Array.isArray(value) ? value[0] : value)
            }
          />
        )}
        <span className="w-10 text-xs text-muted-foreground">
          {formatDuration(track.duration)}
        </span>
      </div>
    </PlayerShell>
  )
}

function PlayerShell({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose?: () => void
}) {
  return (
    <>
      {/* Reserva o espaço da barra para ela não cobrir o rodapé. */}
      <div aria-hidden className="h-20" />
      <section
        aria-label="Player"
        className="fixed inset-x-2 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 rounded-2xl border bg-popover/95 shadow-2xl shadow-black/60 backdrop-blur-lg md:inset-x-0 md:bottom-0 md:rounded-none md:border-x-0 md:border-b-0"
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-3 sm:px-6 md:h-20 md:gap-4">
          {children}
          {onClose && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Fechar player"
            >
              <XIcon />
            </Button>
          )}
        </div>
      </section>
    </>
  )
}
