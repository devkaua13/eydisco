import Image from "next/image"

import { ReleaseTag } from "@/components/badges"
import { HouseCard } from "@/components/house-card"
import { RadioCard } from "@/components/radio-card"
import { FeatureCard, Rail } from "@/components/release-tile"
import { SearchForm } from "@/components/search-form"
import { SectionHeader } from "@/components/section-header"
import { getHouses, getRadio, getRoute } from "@/lib/api"

export default async function HomePage() {
  const [route, radio, houses] = await Promise.all([
    getRoute(),
    getRadio(),
    getHouses(),
  ])
  const backdrop = route.featured[0]?.cover
  // Ao vivo primeiro, depois as que vão começar.
  const trending = [...houses].sort(
    (a, b) =>
      Number(b.status === "live") - Number(a.status === "live") ||
      b.participants_count - a.participants_count
  )

  return (
    <div className="flex flex-col gap-12">
      <section
        aria-labelledby="hero-title"
        className="relative -mx-4 -mt-6 overflow-hidden px-4 pt-10 pb-8 sm:-mx-6 sm:-mt-10 sm:px-6 sm:pt-20 sm:pb-14"
      >
        {backdrop && (
          <Image
            src={backdrop}
            alt=""
            fill
            sizes="100vw"
            loading="eager"
            className="-z-10 scale-125 object-cover opacity-50 blur-3xl"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-background/40 to-background" />
        <div className="flex max-w-2xl flex-col gap-5">
          <h1
            id="hero-title"
            className="text-5xl leading-[0.95] font-bold tracking-tight sm:text-7xl"
          >
            A música conecta pessoas.
          </h1>
          <p className="max-w-md text-lg text-foreground/75">
            Descubra artistas, colecione discos e entre em Houses para ouvir
            junto.
          </p>
          <SearchForm placeholder="Buscar artistas, discos, faixas" />
        </div>
      </section>

      {route.featured.length > 0 && (
        <section
          aria-labelledby="featured-title"
          className="flex flex-col gap-4"
        >
          <SectionHeader
            id="featured-title"
            title="Em destaque"
            href="/discos"
          />
          <Rail>
            {route.featured.map((release) => (
              <FeatureCard
                key={release.slug}
                href={`/discos/${release.slug}`}
                image={release.cover}
                title={release.artist.name}
                subtitle={release.title}
                tag={<ReleaseTag status={release.status} />}
              />
            ))}
          </Rail>
        </section>
      )}

      {trending.length > 0 && (
        <section aria-labelledby="houses-title" className="flex flex-col gap-4">
          <SectionHeader
            id="houses-title"
            title="Houses em alta"
            href="/houses"
          />
          <Rail>
            {trending.slice(0, 6).map((house) => (
              <HouseCard key={house.slug} house={house} />
            ))}
          </Rail>
        </section>
      )}

      <section aria-label="Rádio" className="flex flex-col gap-4">
        <RadioCard radio={radio} />
      </section>

      {route.drop && (
        <section aria-labelledby="drop-title" className="flex flex-col gap-4">
          <SectionHeader
            id="drop-title"
            title="Discovery Drop"
            href={`/drops/${route.drop.slug}`}
            action="Abrir"
          />
          <p className="max-w-prose text-muted-foreground">
            {route.drop.title}. {route.drop.intro}
          </p>
        </section>
      )}
    </div>
  )
}
