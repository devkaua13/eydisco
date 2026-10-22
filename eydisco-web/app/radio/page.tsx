import type { Metadata } from "next"
import Link from "next/link"

import { RadioNow } from "./radio-now"
import { getRadio } from "@/lib/api"
import { formatWhen } from "@/lib/format"

export const metadata: Metadata = { title: "Eydisco Radio" }

export default async function RadioPage() {
  const radio = await getRadio()

  return (
    <div className="flex flex-col gap-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Eydisco Radio
        </h1>
        <p className="max-w-prose text-muted-foreground">
          Programas curados por DJs e artistas. Aperte o play e deixe tocar
          enquanto navega pelo site.
        </p>
      </header>

      <RadioNow initial={radio} />

      <section aria-labelledby="schedule-title" className="flex flex-col gap-4">
        <h2 id="schedule-title" className="text-3xl font-semibold">
          Programação
        </h2>
        {radio.upcoming.length > 0 ? (
          <ol className="flex flex-col divide-y border-y">
            {radio.upcoming.map((show) => (
              <li
                key={show.slug}
                className="grid gap-1 py-4 sm:grid-cols-[16rem_1fr] sm:gap-6"
              >
                <span className="font-semibold first-letter:uppercase">
                  {formatWhen(show.starts_at)}
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-xl font-semibold">{show.title}</span>
                  <span className="text-sm text-muted-foreground">
                    Com{" "}
                    {show.host_artist ? (
                      <Link
                        href={`/artistas/${show.host_artist.slug}`}
                        className="underline underline-offset-4"
                      >
                        {show.host_name}
                      </Link>
                    ) : (
                      show.host_name
                    )}
                    {show.description ? `. ${show.description}` : ""}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-muted-foreground">
            Nenhum programa marcado depois deste.
          </p>
        )}
      </section>
    </div>
  )
}
