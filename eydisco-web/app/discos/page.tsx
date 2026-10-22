import type { Metadata } from "next"

import { PageLinks } from "@/components/page-links"
import { ReleaseGrid, ReleaseTile } from "@/components/release-tile"
import { ButtonLink } from "@/components/button-link"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { getFeed, pageFromUrl } from "@/lib/api"
import type { ReleaseStatus } from "@/lib/types"

export const metadata: Metadata = { title: "Discs" }

const filters: { status?: ReleaseStatus; label: string }[] = [
  { label: "Todos" },
  { status: "presale", label: "Em pré-venda" },
  { status: "upcoming", label: "Em breve" },
  { status: "released", label: "Lançados" },
]

function isStatus(value: unknown): value is ReleaseStatus {
  return value === "upcoming" || value === "presale" || value === "released"
}

function hrefFor(status?: ReleaseStatus, page?: number) {
  const params = new URLSearchParams()
  if (status) params.set("status", status)
  if (page && page > 1) params.set("page", String(page))
  const query = params.toString()
  return query ? `/discos?${query}` : "/discos"
}

export default async function DiscsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const params = await searchParams
  const status = isStatus(params.status) ? params.status : undefined
  const page = Math.max(1, Number(params.page) || 1)
  const feed = await getFeed(status, page)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Discs
          </h1>
          <p className="max-w-prose text-muted-foreground">
            Edições físicas numeradas. Cada exemplar comprado vai para a sua
            estante com o número dele.
          </p>
        </div>
        <nav aria-label="Filtrar por situação" className="flex flex-wrap gap-1">
          {filters.map((filter) => {
            const active = filter.status === status
            return (
              <ButtonLink
                href={hrefFor(filter.status)}
                aria-current={active ? "page" : undefined}
                key={filter.label}
                variant={active ? "secondary" : "ghost"}
                size="sm"
              >
                {filter.label}
              </ButtonLink>
            )
          })}
        </nav>
      </div>

      {feed.results.length > 0 ? (
        <ReleaseGrid>
          {feed.results.map((release) => (
            <ReleaseTile
              key={release.slug}
              release={release}
              artist={release.artist}
            />
          ))}
        </ReleaseGrid>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Nenhum Disc aqui por enquanto</EmptyTitle>
            <EmptyDescription>
              {status === "presale"
                ? "Não há pré-vendas abertas agora. Veja os que estão para abrir em Em breve."
                : "Quando um artista anunciar um Disc, ele aparece nesta lista."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <PageLinks
        hrefFor={(p) => hrefFor(status, p)}
        previous={pageFromUrl(feed.previous)}
        next={pageFromUrl(feed.next)}
      />
    </div>
  )
}
