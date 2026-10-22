"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { Cover } from "@/components/cover"
import { PlayLiveButton } from "@/components/player/play-buttons"
import type { LiveSource } from "@/components/player/player-provider"
import { TrackList } from "@/components/player/track-list"
import { formatTime } from "@/lib/format"
import type { Radio } from "@/lib/types"

const RADIO: LiveSource = {
  kind: "radio",
  id: "radio",
  title: "Eydisco Radio",
  href: "/radio",
  endpoint: "/api/radio",
}

const POLL_MS = 10_000

// O que está no ar, atualizado sozinho enquanto a página está aberta.
export function RadioNow({ initial }: { initial: Radio }) {
  const [radio, setRadio] = useState(initial)

  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(RADIO.endpoint, { cache: "no-store" })
        if (response.ok) setRadio(await response.json())
      } catch {
        // Fica com o último estado; a próxima consulta tenta de novo.
      }
    }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [])

  const { show, playback } = radio

  if (!show || !playback) {
    const next = radio.upcoming[0]
    return (
      <section className="flex flex-col gap-4 border-y py-10">
        <h2 className="text-4xl font-bold">Fora do ar agora</h2>
        <p className="max-w-prose text-muted-foreground">
          {next
            ? `O próximo programa é ${next.title}, com ${next.host_name}, às ${formatTime(next.starts_at)}.`
            : "Nenhum programa marcado por enquanto. Volte mais tarde."}
        </p>
      </section>
    )
  }

  const track = playback.track
  return (
    <section
      aria-labelledby="now-title"
      className="grid gap-8 md:grid-cols-12 md:gap-12"
    >
      <div className="md:col-span-5">
        <Cover
          src={track.release.cover}
          title={track.release.title}
          slug={track.release.slug}
          sizes="(min-width: 768px) 40vw, 100vw"
          eager
        />
      </div>
      <div className="flex flex-col items-start gap-5 md:col-span-7">
        <p className="text-lg">
          <span className="font-semibold text-brand">No ar</span> {show.title},
          com{" "}
          {show.host_artist ? (
            <Link
              href={`/artistas/${show.host_artist.slug}`}
              className="underline underline-offset-4"
            >
              {show.host_name}
            </Link>
          ) : (
            show.host_name
          )}
        </p>
        <h2
          id="now-title"
          className="text-4xl leading-tight font-bold tracking-tight text-balance sm:text-6xl"
        >
          <Link
            href={`/faixas/${track.slug}`}
            className="underline-offset-8 hover:underline"
          >
            {track.title}
          </Link>
        </h2>
        <p className="text-lg">
          <Link
            href={`/artistas/${track.artist.slug}`}
            className="underline-offset-4 hover:underline"
          >
            {track.artist.name}
          </Link>
          , do Disc{" "}
          <Link
            href={`/discos/${track.release.slug}`}
            className="underline-offset-4 hover:underline"
          >
            {track.release.title}
          </Link>
        </p>
        <PlayLiveButton source={RADIO} label="Ouvir a rádio" />
        {playback.next && (
          <p className="text-sm text-muted-foreground">
            Depois: {playback.next.title}, de {playback.next.artist.name}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4 md:col-span-12">
        <h3 className="text-2xl font-semibold">
          {show.title}: {formatTime(show.starts_at)} às{" "}
          {formatTime(show.ends_at)}
        </h3>
        {show.description && (
          <p className="max-w-prose text-muted-foreground">
            {show.description}
          </p>
        )}
        <TrackList
          tracks={show.tracks}
          showArtist
          playable={false}
          highlight={track.slug}
        />
      </div>
    </section>
  )
}
