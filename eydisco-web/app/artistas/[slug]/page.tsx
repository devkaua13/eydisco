import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { FollowButton } from "./follow-button"
import { ArtistAvatar } from "@/components/artist-avatar"
import { HouseList } from "@/components/house-list"
import { PlayTrackButton } from "@/components/player/play-buttons"
import { TrackList } from "@/components/player/track-list"
import { ReleaseGrid, ReleaseTile } from "@/components/release-tile"
import { ButtonLink } from "@/components/button-link"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { getArtist, getCurrentUser } from "@/lib/api"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const artist = await getArtist((await params).slug)
  if (!artist) return {}
  return { title: artist.name, description: artist.bio || undefined }
}

function SectionTitle({
  id,
  children,
}: {
  id: string
  children: React.ReactNode
}) {
  return (
    <h2 id={id} className="text-3xl font-semibold">
      {children}
    </h2>
  )
}

export default async function ArtistPage({ params }: Props) {
  const { slug } = await params
  const [artist, user] = await Promise.all([getArtist(slug), getCurrentUser()])
  if (!artist) notFound()

  // Discs com edição à venda ou para abrir vêm primeiro.
  const onSale = artist.releases.filter((r) => r.status !== "released")
  const catalog = artist.releases.filter((r) => r.status === "released")

  return (
    <div className="flex flex-col gap-16">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
        <div className="size-28 shrink-0 sm:size-40">
          <ArtistAvatar artist={artist} className="text-4xl" />
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl leading-tight font-bold tracking-tight text-balance sm:text-6xl">
            {artist.name}
          </h1>
          <FollowButton
            slug={artist.slug}
            initialFollowing={artist.is_following}
            initialCount={artist.followers_count}
            loggedIn={Boolean(user)}
          />
        </div>
      </header>

      {artist.bio && (
        <section aria-labelledby="bio-title" className="flex flex-col gap-3">
          <SectionTitle id="bio-title">Biografia</SectionTitle>
          <p className="max-w-prose text-lg/relaxed whitespace-pre-line">
            {artist.bio}
          </p>
        </section>
      )}

      {onSale.length > 0 && (
        <section aria-labelledby="discs-title" className="flex flex-col gap-8">
          <SectionTitle id="discs-title">Discs disponíveis</SectionTitle>
          <ReleaseGrid>
            {onSale.map((release) => (
              <ReleaseTile key={release.slug} release={release} />
            ))}
          </ReleaseGrid>
        </section>
      )}

      {artist.tracks.length > 0 && (
        <section aria-labelledby="tracks-title" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionTitle id="tracks-title">Músicas</SectionTitle>
            <PlayTrackButton
              tracks={artist.tracks}
              label="Ouvir tudo"
              variant="outline"
            />
          </div>
          <TrackList tracks={artist.tracks} showRelease />
        </section>
      )}

      <section aria-labelledby="houses-title" className="flex flex-col gap-4">
        <SectionTitle id="houses-title">Houses</SectionTitle>
        {artist.houses.length > 0 ? (
          <HouseList houses={artist.houses} />
        ) : (
          <p className="text-muted-foreground">
            Nenhuma sessão marcada com {artist.name}.{" "}
            <Link
              href="/houses"
              className="text-foreground underline underline-offset-4"
            >
              Ver todas as Houses
            </Link>
          </p>
        )}
      </section>

      <section aria-labelledby="catalog-title" className="flex flex-col gap-8">
        <SectionTitle id="catalog-title">Lançamentos</SectionTitle>
        {catalog.length > 0 ? (
          <ReleaseGrid>
            {catalog.map((release) => (
              <ReleaseTile key={release.slug} release={release} />
            ))}
          </ReleaseGrid>
        ) : onSale.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>Nenhum Disc anunciado</EmptyTitle>
              <EmptyDescription>
                Os lançamentos de {artist.name} aparecem aqui assim que forem
                anunciados.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <p className="text-muted-foreground">
            O primeiro lançamento de {artist.name} ainda está em pré-venda.
          </p>
        )}
        <div>
          <ButtonLink href="/discos" variant="outline">
            Ver todos os Discs
          </ButtonLink>
        </div>
      </section>
    </div>
  )
}
