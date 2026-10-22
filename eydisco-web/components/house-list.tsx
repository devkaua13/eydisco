import Image from "next/image"
import Link from "next/link"
import { LockIcon } from "lucide-react"

import { formatCount, LiveTag, Tag, visibilityLabel } from "@/components/badges"
import { formatWhen } from "@/lib/format"
import type { HouseSummary } from "@/lib/types"

export function houseWhen(house: HouseSummary) {
  if (house.status === "live") return "Acontecendo agora"
  if (house.status === "ended") return "Encerrada"
  if (!house.starts_at) return "Horário a definir"
  const when = formatWhen(house.starts_at)
  return when.charAt(0).toUpperCase() + when.slice(1)
}

function HouseRow({ house }: { house: HouseSummary }) {
  const locked =
    house.visibility === "private" || house.visibility === "collector"
  return (
    <li className="relative flex items-center gap-4 rounded-2xl bg-card p-3 ring-1 ring-white/5 hover:ring-brand/40">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-surface">
        {house.cover && (
          <Image
            src={house.cover}
            alt=""
            fill
            sizes="5rem"
            className="object-cover"
          />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Link
          href={`/houses/${house.slug}`}
          className="truncate font-bold tracking-wide uppercase after:absolute after:inset-0"
        >
          {house.title}
        </Link>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          {house.status === "live"
            ? `${formatCount(house.participants_count)} dentro, `
            : ""}
          {visibilityLabel[house.visibility]}
          {locked && <LockIcon className="size-3 text-brand" aria-hidden />}
        </span>
        <span className="truncate text-sm text-muted-foreground">
          {house.now_playing
            ? `Agora: ${house.now_playing.artist}, faixa ${house.now_playing.position}`
            : houseWhen(house)}
        </span>
      </div>
      {house.status === "live" ? (
        <LiveTag className="self-start" />
      ) : house.status === "ended" ? (
        <Tag tone="muted" className="self-start">
          Encerrada
        </Tag>
      ) : null}
    </li>
  )
}

export function HouseList({ houses }: { houses: HouseSummary[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {houses.map((house) => (
        <HouseRow key={house.slug} house={house} />
      ))}
    </ul>
  )
}
