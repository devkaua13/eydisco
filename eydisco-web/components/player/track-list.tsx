"use client"

import Link from "next/link"
import { AudioLinesIcon } from "lucide-react"

import { PlayTrackButton } from "@/components/player/play-buttons"
import { usePlayer } from "@/components/player/player-provider"
import { formatDuration } from "@/lib/format"
import type { TrackSummary } from "@/lib/types"
import { cn } from "@/lib/utils"

// Lista de faixas tocável. `highlight` marca a faixa no ar numa Rádio ou House.
export function TrackList({
  tracks,
  showArtist,
  showRelease,
  playable = true,
  highlight,
}: {
  tracks: TrackSummary[]
  showArtist?: boolean
  showRelease?: boolean
  playable?: boolean
  highlight?: string
}) {
  const { track: current } = usePlayer()

  return (
    <ol className="flex flex-col divide-y border-y">
      {tracks.map((track, index) => {
        const active = (highlight ?? current?.slug) === track.slug
        return (
          <li
            key={`${track.slug}-${index}`}
            className={cn(
              "flex items-center gap-3 py-2.5",
              active && "text-brand"
            )}
            aria-current={active ? "true" : undefined}
          >
            {playable ? (
              <PlayTrackButton
                tracks={tracks}
                index={index}
                size="icon-sm"
                variant="ghost"
              />
            ) : (
              <span className="grid size-7 place-items-center text-sm text-muted-foreground">
                {active ? (
                  <AudioLinesIcon aria-label="No ar" className="size-4" />
                ) : (
                  index + 1
                )}
              </span>
            )}
            <div className="flex min-w-0 flex-1 flex-col">
              <Link
                href={`/faixas/${track.slug}`}
                className="truncate font-semibold underline-offset-4 hover:underline"
              >
                {track.title}
              </Link>
              {(showArtist || showRelease) && (
                <span className="truncate text-sm text-muted-foreground">
                  {[
                    showArtist && track.artist.name,
                    showRelease && track.release.title,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {formatDuration(track.duration)}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
