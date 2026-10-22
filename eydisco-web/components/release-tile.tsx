import Image from "next/image"
import Link from "next/link"

import { ReleaseTag } from "@/components/badges"
import { Cover } from "@/components/cover"
import { formatDate, formatYear } from "@/lib/format"
import type { ArtistSummary, ReleaseSummary } from "@/lib/types"
import { cn } from "@/lib/utils"

function statusLine(release: ReleaseSummary) {
  if (release.status === "upcoming")
    return `Pré-venda abre em ${formatDate(release.presale_starts_at)}`
  if (release.status === "presale")
    return `Chega em ${formatDate(release.released_at)}`
  return String(formatYear(release.released_at))
}

// Capa quadrada com título e artista embaixo, para grades de Discs.
export function ReleaseTile({
  release,
  artist,
}: {
  release: ReleaseSummary
  artist?: ArtistSummary
}) {
  return (
    <article className="group relative flex flex-col gap-3">
      <div className="relative">
        <Cover
          src={release.cover}
          title={release.title}
          slug={release.slug}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="transition-transform duration-200 group-hover:-translate-y-1 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
        />
        <ReleaseTag
          status={release.status}
          className="absolute top-2.5 right-2.5"
        />
      </div>
      <div className="flex flex-col gap-0.5">
        <h3 className="font-semibold">
          <Link
            href={`/discos/${release.slug}`}
            className="group-has-[a:focus-visible]:underline after:absolute after:inset-0 focus-visible:outline-none"
          >
            {release.title}
          </Link>
        </h3>
        {artist && (
          <p className="text-sm text-muted-foreground">{artist.name}</p>
        )}
        <p className="text-sm text-muted-foreground">{statusLine(release)}</p>
      </div>
    </article>
  )
}

export function ReleaseGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {children}
    </div>
  )
}

// Card largo com a imagem de fundo e o nome por cima, como o "Featured" das referências.
export function FeatureCard({
  href,
  image,
  title,
  subtitle,
  tag,
  className,
}: {
  href: string
  image: string | null
  title: string
  subtitle: string
  tag?: React.ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative block aspect-[16/10] overflow-hidden rounded-2xl bg-surface ring-1 ring-white/10",
        className
      )}
    >
      {image && (
        <Image
          src={image}
          alt=""
          fill
          sizes="(min-width: 768px) 40vw, 80vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      {tag && <div className="absolute top-3 right-3">{tag}</div>}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-4">
        <span className="text-lg leading-tight font-bold title-spaced">
          {title}
        </span>
        <span className="text-xs title-spaced text-white/70">{subtitle}</span>
      </div>
    </Link>
  )
}

// Fileira com rolagem lateral no celular e grade no desktop.
export function Rail({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 [&>*]:w-[78%] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-auto">
      {children}
    </div>
  )
}
