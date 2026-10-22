import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { CollectionStack } from "./collection-stack"
import { ButtonLink } from "@/components/button-link"
import { HouseList } from "@/components/house-list"
import { PageLinks } from "@/components/page-links"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  getCurrentUser,
  getHouses,
  getProfile,
  getShelf,
  pageFromUrl,
} from "@/lib/api"
import { cn } from "@/lib/utils"

type Props = {
  params: Promise<{ username: string }>
  searchParams: Promise<{ page?: string; aba?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Coleção de ${(await params).username}` }
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { username } = await params
  const { page: pageParam, aba } = await searchParams
  const page = Number(pageParam) || undefined
  const tab = aba === "houses" ? "houses" : "discs"
  const [shelf, user] = await Promise.all([
    getShelf(username, page),
    getCurrentUser(),
  ])
  if (!shelf) notFound()

  const isOwner = user?.username === username
  // Na própria coleção, as Houses incluem as privadas e as que a pessoa entrou.
  const houses =
    tab === "houses"
      ? isOwner
        ? await getHouses("mine")
        : ((await getProfile(username))?.houses ?? [])
      : []

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-4xl font-light tracking-tight sm:text-5xl">
          {isOwner ? "Minha coleção" : `Coleção de ${username}`}
        </h1>
        <p className="tracking-wide text-muted-foreground">
          {shelf.count === 1 ? "1 disco" : `${shelf.count} discos`}
        </p>
      </header>

      <nav aria-label="Abas da coleção" className="flex gap-2">
        {[
          { value: "discs", label: "Discs", href: `/estante/${username}` },
          {
            value: "houses",
            label: "Houses",
            href: `/estante/${username}?aba=houses`,
          },
        ].map((t) => (
          <Link
            key={t.value}
            href={t.href}
            aria-current={t.value === tab ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm",
              t.value === tab
                ? "bg-secondary text-foreground ring-1 ring-brand/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "houses" ? (
        houses.length > 0 ? (
          <HouseList houses={houses} />
        ) : (
          <Empty className="border border-white/10">
            <EmptyHeader>
              <EmptyTitle>Nenhuma House por aqui</EmptyTitle>
              <EmptyDescription>
                {isOwner
                  ? "As Houses que você criar ou entrar ficam guardadas aqui."
                  : `${username} ainda não abriu nenhuma House pública.`}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )
      ) : shelf.results.length === 0 ? (
        <Empty className="border border-white/10">
          <EmptyHeader>
            <EmptyTitle>
              {isOwner
                ? "Sua coleção está vazia"
                : "Nenhum disco por aqui ainda"}
            </EmptyTitle>
            <EmptyDescription>
              {isOwner
                ? "Cada Disc que você colecionar entra aqui com o número do seu exemplar."
                : `Quando ${username} colecionar um Disc, ele aparece aqui com o número do exemplar.`}
            </EmptyDescription>
          </EmptyHeader>
          {isOwner && (
            <EmptyContent>
              <ButtonLink href="/discos?status=presale">
                Ver pré-vendas abertas
              </ButtonLink>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <CollectionStack items={shelf.results} />
      )}

      {tab === "discs" && (
        <PageLinks
          hrefFor={(p) => `/estante/${username}?page=${p}`}
          previous={pageFromUrl(shelf.previous)}
          next={pageFromUrl(shelf.next)}
        />
      )}
    </div>
  )
}
