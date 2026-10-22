import type { Metadata } from "next"
import Link from "next/link"

import { ArtistAvatar } from "@/components/artist-avatar"
import { TrackList } from "@/components/player/track-list"
import { ReleaseGrid, ReleaseTile } from "@/components/release-tile"
import { SearchForm } from "@/components/search-form"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { search } from "@/lib/api"

export const metadata: Metadata = { title: "Buscar" }

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const q = ((await searchParams).q ?? "").trim()
  const results = q.length >= 2 ? await search(q) : null
  const empty =
    results &&
    results.artists.length + results.releases.length + results.tracks.length ===
      0

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <h1 className="text-4xl font-bold tracking-tight">
          {results ? `Resultados para “${q}”` : "Buscar"}
        </h1>
        <SearchForm defaultValue={q} autoFocus={!results} />
      </div>

      {empty && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Nada encontrado para “{q}”</EmptyTitle>
            <EmptyDescription>
              Confira a grafia ou busque só pelo nome do artista.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {results && results.artists.length > 0 && (
        <section
          aria-labelledby="artists-title"
          className="flex flex-col gap-4"
        >
          <h2 id="artists-title" className="text-2xl font-semibold">
            Artistas
          </h2>
          <ul className="flex flex-wrap gap-6">
            {results.artists.map((artist) => (
              <li key={artist.slug}>
                <Link
                  href={`/artistas/${artist.slug}`}
                  className="flex items-center gap-3 font-semibold hover:underline"
                >
                  <div className="size-12">
                    <ArtistAvatar artist={artist} />
                  </div>
                  {artist.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results && results.tracks.length > 0 && (
        <section aria-labelledby="tracks-title" className="flex flex-col gap-4">
          <h2 id="tracks-title" className="text-2xl font-semibold">
            Faixas
          </h2>
          <TrackList tracks={results.tracks} showArtist showRelease />
        </section>
      )}

      {results && results.releases.length > 0 && (
        <section
          aria-labelledby="releases-title"
          className="flex flex-col gap-4"
        >
          <h2 id="releases-title" className="text-2xl font-semibold">
            Discs
          </h2>
          <ReleaseGrid>
            {results.releases.map((release) => (
              <ReleaseTile key={release.slug} release={release} />
            ))}
          </ReleaseGrid>
        </section>
      )}
    </div>
  )
}
