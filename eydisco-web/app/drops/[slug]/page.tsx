import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { DropItems } from "@/components/drop-items"
import { getDrop, getDrops } from "@/lib/api"
import { formatDate } from "@/lib/format"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const drop = await getDrop((await params).slug)
  return drop ? { title: drop.title, description: drop.intro || undefined } : {}
}

export default async function DropPage({ params }: Props) {
  const { slug } = await params
  const [drop, drops] = await Promise.all([getDrop(slug), getDrops()])
  if (!drop) notFound()
  const others = drops.results.filter((d) => d.slug !== slug)

  return (
    <div className="flex flex-col gap-14">
      <header className="flex flex-col gap-4">
        <p className="text-muted-foreground">
          Discovery Drop de {formatDate(drop.published_at)}
        </p>
        <h1 className="max-w-4xl text-4xl leading-[0.9] font-bold tracking-tight text-balance sm:text-5xl">
          {drop.title}
        </h1>
        {drop.intro && (
          <p className="max-w-prose text-lg/relaxed">{drop.intro}</p>
        )}
      </header>

      <DropItems items={drop.items} />

      {others.length > 0 && (
        <section
          aria-labelledby="others-title"
          className="flex flex-col gap-4 border-t pt-8"
        >
          <h2 id="others-title" className="text-2xl font-semibold">
            Drops anteriores
          </h2>
          <ul className="flex flex-col gap-2">
            {others.map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/drops/${other.slug}`}
                  className="underline-offset-4 hover:underline"
                >
                  {other.title}
                </Link>{" "}
                <span className="text-sm text-muted-foreground">
                  {formatDate(other.published_at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
