import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { HomeIcon } from "lucide-react"

import { ReleaseTag } from "@/components/badges"
import { ButtonLink } from "@/components/button-link"
import { Cover } from "@/components/cover"
import { EditionNumber } from "@/components/edition-number"
import { Extras } from "@/components/extras"
import { PlayTrackButton } from "@/components/player/play-buttons"
import { TrackList } from "@/components/player/track-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress, ProgressLabel } from "@/components/ui/progress"
import { getRelease } from "@/lib/api"
import { formatDate, formatPrice, formatYear, padSerial } from "@/lib/format"
import type { Edition, Release } from "@/lib/types"
import { cn } from "@/lib/utils"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const release = await getRelease((await params).slug)
  if (!release) return {}
  return {
    title: `${release.title}, ${release.artist.name}`,
    description: release.description || undefined,
  }
}

function SectionTitle({
  id,
  children,
}: {
  id: string
  children: React.ReactNode
}) {
  return (
    <h2 id={id} className="text-xl font-bold tracking-tight sm:text-2xl">
      {children}
    </h2>
  )
}

// Pré-venda abre, disco chega: a ordem real dos acontecimentos.
function Timeline({ release }: { release: Release }) {
  const steps = [
    {
      label: "Pré-venda abre",
      date: release.presale_starts_at,
      done: release.status !== "upcoming",
    },
    {
      label: "Disco lançado",
      date: release.released_at,
      done: release.status === "released",
    },
  ]
  return (
    <ol className="grid grid-cols-2 gap-3">
      {steps.map((step, index) => (
        <li
          key={step.label}
          className="flex flex-col gap-1 rounded-xl bg-card p-4 ring-1 ring-white/5"
        >
          <span
            className={cn(
              "text-xs",
              step.done ? "text-brand" : "text-muted-foreground"
            )}
          >
            {index + 1}. {step.label}
          </span>
          <span className="font-semibold">{formatDate(step.date)}</span>
        </li>
      ))}
    </ol>
  )
}

function EditionCard({
  release,
  edition,
}: {
  release: Release
  edition: Edition
}) {
  const sold = edition.total_supply - edition.available
  const soldOut = edition.available === 0
  const notYet = release.status === "upcoming"

  return (
    <li className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-white/5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">{edition.name}</h3>
          <span className="flex items-center gap-2">
            <span className="text-lg">{formatPrice(edition.price)}</span>
            {edition.is_demo && <Badge variant="outline">Preço de teste</Badge>}
          </span>
        </div>
        {edition.includes.length > 0 && (
          <ul className="flex flex-col gap-0.5 text-sm text-muted-foreground">
            {edition.includes.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
        <Progress value={sold} max={edition.total_supply}>
          <ProgressLabel className="text-xs font-normal text-muted-foreground">
            Tiragem de {edition.total_supply}
          </ProgressLabel>
          <span className="ml-auto text-xs text-muted-foreground">
            {soldOut ? "Esgotada" : `${edition.available} disponíveis`}
          </span>
        </Progress>
      </div>
      <div className="flex flex-col gap-1.5 sm:w-44 sm:items-end">
        {soldOut || notYet ? (
          <Button size="lg" disabled className="w-full">
            {soldOut ? "Esgotada" : "Ainda não abriu"}
          </Button>
        ) : (
          <>
            <ButtonLink
              href={`/discos/${release.slug}/comprar?edicao=${edition.id}`}
              size="lg"
              className="w-full"
            >
              Colecionar
            </ButtonLink>
            <span className="text-xs text-muted-foreground">
              Próximo: #{padSerial(sold + 1, edition.total_supply)}
            </span>
          </>
        )}
      </div>
    </li>
  )
}

export default async function DiscPage({ params }: Props) {
  const release = await getRelease((await params).slug)
  if (!release) notFound()

  const onSale = release.editions.filter(
    (e) => e.available > 0 && release.status !== "upcoming"
  )
  const cheapest = [...onSale].sort(
    (a, b) => Number(a.price) - Number(b.price)
  )[0]
  const house = release.houses[0]

  return (
    <article className="relative flex flex-col gap-12">
      {/* A capa, desfocada, vira a luz de fundo da página. */}
      {release.cover && (
        <Image
          src={release.cover}
          alt=""
          width={600}
          height={600}
          loading="eager"
          className="pointer-events-none absolute -top-24 left-1/2 -z-10 w-[120%] max-w-none -translate-x-1/2 opacity-35 blur-3xl md:left-1/4 md:w-[60%]"
        />
      )}

      <header className="grid gap-8 md:grid-cols-12 md:items-end md:gap-12">
        <div className="relative mx-auto w-full max-w-xs md:col-span-5 md:max-w-none">
          <Cover
            src={release.cover}
            title={release.title}
            slug={release.slug}
            sizes="(min-width: 768px) 40vw, 80vw"
            eager
            className="glow"
          />
          <ReleaseTag
            status={release.status}
            className="absolute top-3 right-3"
          />
        </div>
        <div className="flex flex-col gap-4 md:col-span-7">
          <div className="flex flex-col gap-1">
            <h1 className="text-4xl font-extrabold tracking-tight uppercase sm:text-6xl">
              {release.title}
            </h1>
            <Link
              href={`/artistas/${release.artist.slug}`}
              className="w-fit text-lg text-foreground/80 hover:underline"
            >
              {release.artist.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              Disc, {formatYear(release.released_at)}, {release.tracks.length}{" "}
              {release.tracks.length === 1 ? "faixa" : "faixas"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {release.tracks.length > 0 && (
              <PlayTrackButton
                tracks={release.tracks}
                label="Ouvir"
                size="lg"
              />
            )}
            {cheapest && (
              <ButtonLink
                href={
                  onSale.length === 1
                    ? `/discos/${release.slug}/comprar?edicao=${cheapest.id}`
                    : "#edicoes"
                }
                variant="secondary"
                size="lg"
                className="h-auto min-h-11 flex-col gap-0 py-1.5 leading-tight"
              >
                Colecionar
                <span className="text-[0.7rem] text-muted-foreground">
                  {onSale.length > 1 ? "a partir de " : ""}
                  {formatPrice(cheapest.price)}
                </span>
              </ButtonLink>
            )}
            {house && (
              <ButtonLink
                href={`/houses/${house.slug}`}
                variant="outline"
                size="lg"
              >
                <HomeIcon data-icon="inline-start" />
                House
              </ButtonLink>
            )}
          </div>

          {release.my_items.length > 0 && (
            <div className="flex flex-col gap-1.5 rounded-xl bg-brand/10 p-3 ring-1 ring-brand/30">
              <span className="text-sm">
                {release.my_items.length === 1
                  ? "Este exemplar é seu"
                  : "Estes exemplares são seus"}{" "}
                e liberam os conteúdos exclusivos.
              </span>
              <div className="flex flex-wrap gap-x-4">
                {release.my_items.map((item) => (
                  <EditionNumber
                    key={`${item.edition}-${item.serial_number}`}
                    serial={item.serial_number}
                    total={item.total_supply}
                    label={item.edition}
                  />
                ))}
              </div>
            </div>
          )}

          {release.description && (
            <p className="max-w-prose text-foreground/80">
              {release.description}
            </p>
          )}
        </div>
      </header>

      <div className="grid gap-12 md:grid-cols-12">
        <div className="flex flex-col gap-12 md:col-span-7 md:col-start-6">
          {release.tracks.length > 0 && (
            <section
              aria-labelledby="tracks-title"
              className="flex flex-col gap-3"
            >
              <SectionTitle id="tracks-title">Faixas</SectionTitle>
              <TrackList tracks={release.tracks} />
            </section>
          )}

          {release.story && (
            <section
              aria-labelledby="story-title"
              className="flex flex-col gap-3"
            >
              <SectionTitle id="story-title">A história</SectionTitle>
              <p className="max-w-prose leading-relaxed whitespace-pre-line text-foreground/80">
                {release.story}
              </p>
            </section>
          )}

          <Timeline release={release} />

          <section
            id="edicoes"
            aria-labelledby="editions-title"
            className="flex scroll-mt-24 flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <SectionTitle id="editions-title">
                {release.editions.length === 1 ? "Edição" : "Edições"}
              </SectionTitle>
              {release.editions.some((e) => e.is_demo) && (
                <p className="text-sm text-muted-foreground">
                  Pré-venda demonstrativa: os preços são de teste e nenhuma
                  cobrança é feita. O número do exemplar vai para a sua coleção.
                </p>
              )}
              {release.status === "upcoming" && (
                <p className="text-sm text-muted-foreground">
                  A pré-venda abre em {formatDate(release.presale_starts_at)}.
                  Os números saem por ordem de compra.
                </p>
              )}
            </div>
            {release.editions.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {release.editions.map((edition) => (
                  <EditionCard
                    key={edition.id}
                    release={release}
                    edition={edition}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">
                As edições deste disco ainda não foram anunciadas.
              </p>
            )}
          </section>

          {release.extras.length > 0 && (
            <section
              aria-labelledby="extras-title"
              className="flex flex-col gap-3"
            >
              <SectionTitle id="extras-title">Conteúdos do Disc</SectionTitle>
              <Extras extras={release.extras} releaseSlug={release.slug} />
            </section>
          )}
        </div>
      </div>
    </article>
  )
}
