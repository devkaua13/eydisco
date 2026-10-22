import Link from "next/link"

import { ArtistAvatar } from "@/components/artist-avatar"
import { Cover } from "@/components/cover"
import { PlayTrackButton } from "@/components/player/play-buttons"
import type { DropItem } from "@/lib/types"

function target(item: DropItem) {
  if (item.track) {
    return {
      href: `/faixas/${item.track.slug}`,
      title: item.track.title,
      subtitle: `Faixa de ${item.track.artist.name}`,
      media: (
        <Cover
          src={item.track.release.cover}
          title={item.track.release.title}
          slug={item.track.release.slug}
          sizes="10rem"
        />
      ),
    }
  }
  if (item.release) {
    return {
      href: `/discos/${item.release.slug}`,
      title: item.release.title,
      subtitle: `Disc de ${item.release_artist?.name ?? ""}`,
      media: (
        <Cover
          src={item.release.cover}
          title={item.release.title}
          slug={item.release.slug}
          sizes="10rem"
        />
      ),
    }
  }
  const artist = item.artist!
  return {
    href: `/artistas/${artist.slug}`,
    title: artist.name,
    subtitle: "Artista",
    media: <ArtistAvatar artist={artist} className="size-full text-4xl" />,
  }
}

// As descobertas de um Drop, com o texto de por que ouvir cada uma.
export function DropItems({ items }: { items: DropItem[] }) {
  return (
    <ol className="grid gap-x-10 gap-y-10 md:grid-cols-2">
      {items.map((item, index) => {
        const t = target(item)
        return (
          <li
            key={item.id}
            className="grid grid-cols-[6rem_1fr] gap-5 sm:grid-cols-[8rem_1fr]"
          >
            <div className="relative aspect-square">{t.media}</div>
            <div className="flex min-w-0 flex-col gap-2">
              <span className="text-sm text-muted-foreground">
                {index + 1}. {t.subtitle}
              </span>
              <Link
                href={t.href}
                className="text-2xl leading-none font-semibold underline-offset-4 hover:underline"
              >
                {t.title}
              </Link>
              <p className="text-sm/relaxed">{item.blurb}</p>
              {item.track && (
                <div>
                  <PlayTrackButton
                    tracks={[item.track]}
                    label="Ouvir"
                    variant="outline"
                  />
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
