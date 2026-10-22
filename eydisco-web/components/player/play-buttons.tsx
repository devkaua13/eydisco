"use client"

import { PauseIcon, PlayIcon, RadioIcon } from "lucide-react"

import { usePlayer, type LiveSource } from "@/components/player/player-provider"
import { Button } from "@/components/ui/button"
import type { TrackSummary } from "@/lib/types"

// Toca a faixa `index` e deixa as seguintes na fila; se já está tocando, pausa.
export function PlayTrackButton({
  tracks,
  index = 0,
  label,
  size = "icon",
  variant = "default",
}: {
  tracks: TrackSummary[]
  index?: number
  label?: string
  size?: "icon" | "icon-sm" | "lg"
  variant?: "default" | "outline" | "ghost" | "secondary"
}) {
  const { track, live, playing, playQueue, toggle } = usePlayer()
  const target = tracks[index]
  const isCurrent = !live && track?.slug === target?.slug
  const showPause = isCurrent && playing

  if (!target) return null

  const action = showPause ? `Pausar ${target.title}` : `Tocar ${target.title}`
  return (
    <Button
      size={label ? (size === "lg" ? "lg" : "default") : size}
      variant={variant}
      onClick={() => (isCurrent ? toggle() : playQueue(tracks, index))}
      aria-label={label ? undefined : action}
    >
      {showPause ? (
        <PauseIcon data-icon={label ? "inline-start" : undefined} />
      ) : (
        <PlayIcon data-icon={label ? "inline-start" : undefined} />
      )}
      {label && (showPause ? "Pausar" : label)}
    </Button>
  )
}

export function PlayLiveButton({
  source,
  label,
  disabled,
}: {
  source: LiveSource
  label: string
  disabled?: boolean
}) {
  const { live, playing, playLive, toggle } = usePlayer()
  const isCurrent = live?.id === source.id
  return (
    <Button
      size="lg"
      disabled={disabled}
      onClick={() => (isCurrent ? toggle() : playLive(source))}
    >
      {isCurrent && playing ? (
        <PauseIcon data-icon="inline-start" />
      ) : (
        <RadioIcon data-icon="inline-start" />
      )}
      {isCurrent && playing ? "Pausar" : label}
    </Button>
  )
}
