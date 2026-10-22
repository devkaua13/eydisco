import type { Metadata } from "next"
import Link from "next/link"

import { ArtistAvatar } from "@/components/artist-avatar"
import { DropItems } from "@/components/drop-items"
import { PlayTrackButton } from "@/components/player/play-buttons"
import { TrackList } from "@/components/player/track-list"
import { RadioCard } from "@/components/radio-card"
import { ReleaseGrid, ReleaseTile } from "@/components/release-tile"
import { SearchForm } from "@/components/search-form"
import { SectionHeader } from "@/components/section-header"
import { getRadio, getRoute } from "@/lib/api"

export const metadata: Metadata = { title: "Descobrir" }

// A Route: seleção de artistas e faixas, Discs em destaque, Drop e busca.
export default async function DiscoverPage() {
  const [route, radio] = await Promise.all([getRoute(), getRadio()])

  return (
    <div className="flex flex-col gap-14">
      <header className="flex flex-col gap-5">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Descobrir
        </h1>
        <SearchForm placeholder="Buscar artistas, discos, faixas" />
      </header>

      <RadioCard radio={radio} />

      {route.drop && (
        <section aria-labelledby="drop-title" className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-brand">Discovery Drop</p>
            <h2
              id="drop-title"
              className="text-2xl font-bold tracking-tight sm:text-3xl"
            >
              <Link
                href={`/drops/${route.drop.slug}`}
                className="underline-offset-4 hover:underline"
              >
                {route.drop.title}
              </Link>
            </h2>
            {route.drop.intro && (
              <p className="max-w-prose text-muted-foreground">
                {route.drop.intro}
              </p>
            )}
          </div>
          <DropItems items={route.drop.items} />
        </section>
      )}

      {route.tracks.length > 0 && (
        <section aria-labelledby="tracks-title" className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-4">
            <SectionHeader id="tracks-title" title="Para ouvir agora" />
            <PlayTrackButton
              tracks={route.tracks}
              label="Ouvir tudo"
              variant="secondary"
            />
          </div>
          <TrackList tracks={route.tracks} showArtist showRelease />
        </section>
      )}

      {route.artists.length > 0 && (
        <section
          aria-labelledby="artists-title"
          className="flex flex-col gap-4"
        >
          <SectionHeader id="artists-title" title="Artistas" />
          <ul className="-mx-4 flex gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {route.artists.map((artist) => (
              <li key={artist.slug} className="w-24 shrink-0">
                <Link
                  href={`/artistas/${artist.slug}`}
                  className="group flex flex-col items-center gap-2 text-center"
                >
                  <div className="size-24">
                    <ArtistAvatar
                      artist={artist}
                      className="text-xl ring-2 ring-white/10 group-hover:ring-brand"
                    />
                  </div>
                  <span className="text-sm leading-tight font-medium">
                    {artist.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {route.featured.length > 0 && (
        <section aria-labelledby="discs-title" className="flex flex-col gap-4">
          <SectionHeader id="discs-title" title="Discs" href="/discos" />
          <ReleaseGrid>
            {route.featured.map((release) => (
              <ReleaseTile
                key={release.slug}
                release={release}
                artist={release.artist}
              />
            ))}
          </ReleaseGrid>
        </section>
      )}
    </div>
  )
}
