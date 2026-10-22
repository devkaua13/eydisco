import type { Metadata } from "next"
import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { ButtonLink } from "@/components/button-link"
import { HouseList } from "@/components/house-list"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { getCurrentUser, getHouses, type HouseTab } from "@/lib/api"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Houses" }

const tabs: { tab: HouseTab; label: string; empty: string }[] = [
  {
    tab: "live",
    label: "Em andamento",
    empty: "Nenhuma House acontecendo agora. Que tal abrir uma?",
  },
  {
    tab: "upcoming",
    label: "Em breve",
    empty: "Nenhuma House programada por enquanto.",
  },
  {
    tab: "mine",
    label: "Minhas",
    empty: "As Houses que você criar ou entrar aparecem aqui.",
  },
]

function isTab(value: unknown): value is HouseTab {
  return value === "live" || value === "upcoming" || value === "mine"
}

export default async function HousesPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>
}) {
  const requested = (await searchParams).aba
  const current = isTab(requested) ? requested : "live"
  const [houses, user] = await Promise.all([
    getHouses(current),
    getCurrentUser(),
  ])
  const tab = tabs.find((t) => t.tab === current)!

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Houses
        </h1>
        <ButtonLink
          href={user ? "/houses/criar" : "/entrar?next=/houses/criar"}
          variant="secondary"
        >
          <PlusIcon data-icon="inline-start" />
          Criar
        </ButtonLink>
      </header>
      <p className="-mt-3 max-w-prose text-muted-foreground">
        Sessões para ouvir junto: todo mundo escuta a mesma faixa no mesmo
        momento, reage e conversa.
      </p>

      <nav aria-label="Abas de Houses" className="flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t.tab}
            href={`/houses?aba=${t.tab}`}
            aria-current={t.tab === current ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm",
              t.tab === current
                ? "bg-secondary text-foreground ring-1 ring-white/10"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {current === "mine" && !user ? (
        <Empty className="border border-white/10">
          <EmptyHeader>
            <EmptyTitle>Entre para ver suas Houses</EmptyTitle>
            <EmptyDescription>
              As Houses que você criar ou entrar ficam guardadas aqui.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <ButtonLink href="/entrar?next=/houses?aba=mine">Entrar</ButtonLink>
          </EmptyContent>
        </Empty>
      ) : houses.length > 0 ? (
        <HouseList houses={houses} />
      ) : (
        <Empty className="border border-white/10">
          <EmptyHeader>
            <EmptyTitle>Nada por aqui</EmptyTitle>
            <EmptyDescription>{tab.empty}</EmptyDescription>
          </EmptyHeader>
          {user && (
            <EmptyContent>
              <ButtonLink href="/houses/criar">Criar House</ButtonLink>
            </EmptyContent>
          )}
        </Empty>
      )}
    </div>
  )
}
