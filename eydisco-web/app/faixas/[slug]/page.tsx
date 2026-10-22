import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Cover } from "@/components/cover"
import { Extras } from "@/components/extras"
import { PlayTrackButton } from "@/components/player/play-buttons"
import { getTrack } from "@/lib/api"
import { formatDuration } from "@/lib/format"
import { cn } from "@/lib/utils"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const track = await getTrack((await params).slug)
  return track ? { title: `${track.title}, ${track.artist.name}` } : {}
}

function Story({ title, text }: { title: string; text: string }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="max-w-prose text-lg/relaxed whitespace-pre-line">{text}</p>
    </section>
  )
}

export default async function TrackPage({ params }: Props) {
  const track = await getTrack((await params).slug)
  if (!track) notFound()

  // Tocar daqui segue o disco na ordem a partir desta faixa.
  const index = track.siblings.findIndex((s) => s.slug === track.slug)

  return (
    <article className="grid gap-10 md:grid-cols-12 md:gap-12">
      <aside className="flex flex-col gap-6 md:col-span-4">
        <Cover
          src={track.release.cover}
          title={track.release.title}
          slug={track.release.slug}
          sizes="(min-width: 768px) 30vw, 100vw"
          eager
        />
        <nav
          aria-label={`Faixas de ${track.release.title}`}
          className="flex flex-col gap-2"
        >
          <Link
            href={`/discos/${track.release.slug}`}
            className="font-semibold underline-offset-4 hover:underline"
          >
            {track.release.title}
          </Link>
          <ol className="flex flex-col text-sm">
            {track.siblings.map((sibling) => (
              <li key={sibling.slug}>
                <Link
                  href={`/faixas/${sibling.slug}`}
                  aria-current={
                    sibling.slug === track.slug ? "page" : undefined
                  }
                  className={cn(
                    "flex justify-between gap-3 py-1 underline-offset-4 hover:underline",
                    sibling.slug === track.slug
                      ? "font-semibold text-brand"
                      : "text-muted-foreground"
                  )}
                >
                  <span>
                    {sibling.position}. {sibling.title}
                  </span>
                  <span>{formatDuration(sibling.duration)}</span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      </aside>

      <div className="flex flex-col gap-10 md:col-span-8">
        <header className="flex flex-col items-start gap-4">
          <Link
            href={`/artistas/${track.artist.slug}`}
            className="text-lg underline-offset-4 hover:underline"
          >
            {track.artist.name}
          </Link>
          <h1 className="text-4xl leading-[0.9] font-bold tracking-tight text-balance sm:text-5xl">
            {track.title}
          </h1>
          <p className="text-muted-foreground">
            Faixa {track.position} de {track.release.title},{" "}
            {formatDuration(track.duration)}
          </p>
          <PlayTrackButton
            tracks={track.siblings}
            index={index}
            label="Ouvir a faixa"
            size="lg"
          />
        </header>

        {track.story && <Story title="Como ela foi feita" text={track.story} />}
        {track.inspirations && (
          <Story title="Inspirações" text={track.inspirations} />
        )}

        {track.credits.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-2xl font-semibold">Créditos</h2>
            <dl className="grid max-w-xl grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t pt-3">
              {track.credits.map((credit, index) => (
                <div key={index} className="contents">
                  <dt className="text-muted-foreground">{credit.role}</dt>
                  <dd className="font-semibold">{credit.name}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {track.extras.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-2xl font-semibold">Extras</h2>
            <Extras extras={track.extras} releaseSlug={track.release.slug} />
          </section>
        )}
      </div>
    </article>
  )
}
