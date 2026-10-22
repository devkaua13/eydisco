"use client"

import Image from "next/image"
import Link from "next/link"
import { useRef, useState } from "react"
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GemIcon,
  MusicIcon,
  PlayIcon,
} from "lucide-react"

import { usePlayer } from "@/components/player/player-provider"
import { EditionNumber } from "@/components/edition-number"
import { Button } from "@/components/ui/button"
import { formatDate, padSerial } from "@/lib/format"
import type { Item } from "@/lib/types"
import { cn } from "@/lib/utils"

const BEHIND = 5
const SWIPE_PX = 50

// A coleção como uma pilha de Discs: o da frente em destaque, os outros espiando atrás.
export function CollectionStack({ items }: { items: Item[] }) {
  const [index, setIndex] = useState(0)
  const { playQueue } = usePlayer()
  const pointerStart = useRef<number | null>(null)
  const stackRef = useRef<HTMLDivElement>(null)

  const item = items[index]
  const behind = items.slice(index + 1, index + 1 + BEHIND)

  function go(to: number) {
    setIndex(Math.max(0, Math.min(items.length - 1, to)))
  }

  function select(to: number) {
    go(to)
    stackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="flex flex-col gap-12">
      <section
        ref={stackRef}
        aria-roledescription="carrossel"
        aria-label="Coleção"
        className="mx-auto flex w-full max-w-md scroll-mt-24 flex-col items-center gap-6"
      >
        <div
          className="relative w-full touch-pan-y pt-[calc(var(--behind)*0.9rem)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ "--behind": behind.length } as React.CSSProperties}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") go(index + 1)
            if (event.key === "ArrowLeft") go(index - 1)
          }}
          onPointerDown={(event) => (pointerStart.current = event.clientX)}
          onPointerUp={(event) => {
            if (pointerStart.current === null) return
            const delta = event.clientX - pointerStart.current
            pointerStart.current = null
            if (delta < -SWIPE_PX) go(index + 1)
            if (delta > SWIPE_PX) go(index - 1)
          }}
        >
          {/* Os próximos Discs aparecem como bordas atrás do da frente. */}
          {behind
            .map((next, i) => ({ next, depth: i + 1 }))
            .reverse()
            .map(({ next, depth }) => (
              <div
                key={next.id}
                aria-hidden
                className="absolute inset-x-0 top-0 mx-auto h-24 overflow-hidden rounded-2xl ring-1 ring-white/15"
                style={{
                  top: `${(behind.length - depth) * 0.9}rem`,
                  width: `${100 - depth * 7}%`,
                  opacity: 1 - depth * 0.12,
                }}
              >
                {next.release.cover && (
                  <Image
                    src={next.release.cover}
                    alt=""
                    fill
                    sizes="28rem"
                    className="object-cover object-center"
                  />
                )}
              </div>
            ))}

          <article
            key={item.id}
            aria-label={`${item.release.title}, de ${item.artist.name}`}
            className="relative aspect-[1/1.05] w-full overflow-hidden rounded-3xl bg-surface glow motion-safe:animate-in motion-safe:duration-300 motion-safe:zoom-in-95 motion-safe:fade-in"
          >
            {item.release.cover && (
              <Image
                src={item.release.cover}
                alt=""
                fill
                sizes="(min-width: 640px) 28rem, 90vw"
                loading="eager"
                className="object-cover"
                draggable={false}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/60" />
            <div className="absolute inset-x-0 top-0 flex flex-col gap-1 p-6">
              <h2 className="text-2xl font-light tracking-[0.35em] uppercase">
                {item.release.title}
              </h2>
              <p className="text-xs tracking-[0.35em] text-white/70 uppercase">
                {item.artist.name}
              </p>
            </div>
            <EditionNumber
              serial={item.serial_number}
              total={item.total_supply}
              className="absolute bottom-6 left-6"
            />
          </article>
        </div>

        <ul className="grid w-full grid-cols-3 divide-x divide-white/10 text-xs text-muted-foreground">
          <li className="flex items-center justify-center gap-2 px-2">
            <MusicIcon className="size-4 shrink-0" aria-hidden />
            {item.tracks.length} {item.tracks.length === 1 ? "faixa" : "faixas"}
          </li>
          <li className="flex items-center justify-center gap-2 px-2">
            <CalendarIcon className="size-4 shrink-0" aria-hidden />
            <span>
              Adquirido em
              <br />
              {formatDate(item.acquired_at)}
            </span>
          </li>
          <li className="flex items-center justify-center gap-2 px-2">
            <GemIcon className="size-4 shrink-0" aria-hidden />
            {item.is_demo ? "Demonstração" : "Edição limitada"}
          </li>
        </ul>

        <Button
          variant="glow"
          size="lg"
          className="h-14 w-full max-w-xs"
          disabled={item.tracks.length === 0}
          onClick={() => playQueue(item.tracks, 0)}
        >
          <PlayIcon data-icon="inline-start" className="fill-current" />
          Ouvir
        </Button>

        <div className="flex items-center divide-x divide-white/15 text-xs tracking-[0.25em] text-muted-foreground uppercase">
          <Link
            href={`/discos/${item.release.slug}`}
            className="px-6 hover:text-foreground"
          >
            Detalhes
          </Link>
          {item.tracks[0] && (
            <Link
              href={`/faixas/${item.tracks[0].slug}`}
              className="px-6 hover:text-foreground"
            >
              Bastidores
            </Link>
          )}
        </div>

        {items.length > 1 && (
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => go(index - 1)}
              disabled={index === 0}
              aria-label="Disc anterior"
            >
              <ChevronLeftIcon />
            </Button>
            <span
              className="text-[0.65rem] tracking-[0.3em] text-muted-foreground uppercase"
              aria-live="polite"
            >
              {index + 1} de {items.length}, deslize para explorar
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => go(index + 1)}
              disabled={index === items.length - 1}
              aria-label="Próximo Disc"
            >
              <ChevronRightIcon />
            </Button>
          </div>
        )}
      </section>

      <section aria-label="Todos os Discs" className="flex flex-col gap-4">
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((entry, i) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => select(i)}
                aria-current={i === index ? "true" : undefined}
                className="group flex w-full flex-col gap-2 text-left"
              >
                <div
                  className={cn(
                    "relative aspect-square w-full overflow-hidden rounded-xl bg-surface ring-1 ring-white/10 transition-shadow",
                    i === index && "glow"
                  )}
                >
                  {entry.release.cover && (
                    <Image
                      src={entry.release.cover}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      className="object-cover"
                    />
                  )}
                </div>
                <span className="flex flex-col">
                  <span className="text-xs font-semibold tracking-[0.15em] uppercase">
                    {entry.artist.name}
                  </span>
                  <span className="text-xs tracking-[0.15em] text-muted-foreground uppercase">
                    {entry.release.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    #{padSerial(entry.serial_number, entry.total_supply)}/
                    {entry.total_supply}
                    {entry.is_demo && ", demonstração"}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
