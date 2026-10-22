import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { LockIcon } from "lucide-react"

import { HouseRoom } from "./house-room"
import { ButtonLink } from "@/components/button-link"
import { getCurrentUser, getHouse } from "@/lib/api"
import type { House } from "@/lib/types"

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ convite?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const house = await getHouse((await params).slug)
  return house ? { title: house.title } : {}
}

// Quem não pode entrar vê a House e o caminho para entrar.
function Locked({ house, slug }: { house: House; slug: string }) {
  const reason = house.access.reason
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-10 text-center">
      <div className="relative aspect-square w-48 overflow-hidden rounded-2xl bg-card ring-1 ring-white/10">
        {house.cover && (
          <Image
            src={house.cover}
            alt=""
            fill
            sizes="12rem"
            className="object-cover opacity-60 blur-sm"
          />
        )}
        <LockIcon
          className="absolute inset-0 m-auto size-8 text-foreground"
          aria-hidden
        />
      </div>
      <h1 className="text-2xl font-bold tracking-wide uppercase">
        {house.title}
      </h1>
      <p className="text-muted-foreground">
        {reason === "private" &&
          "Esta House é privada. Peça o link de convite para quem criou."}
        {reason === "collector" &&
          `Esta House é só para quem tem ${house.release?.title ?? "o Disc"} na coleção.`}
        {reason === "login" &&
          "Esta House é para colecionadores. Entre na sua conta para ver se você tem acesso."}
      </p>
      {reason === "collector" && house.release && (
        <ButtonLink href={`/discos/${house.release.slug}`}>
          Ver o Disc
        </ButtonLink>
      )}
      {reason === "login" && (
        <ButtonLink
          href={`/entrar?next=${encodeURIComponent(`/houses/${slug}`)}`}
        >
          Entrar
        </ButtonLink>
      )}
    </div>
  )
}

export default async function HousePage({ params, searchParams }: Props) {
  const { slug } = await params
  const { convite } = await searchParams
  const [house, user] = await Promise.all([
    getHouse(slug, convite),
    getCurrentUser(),
  ])
  if (!house) notFound()
  if (!house.access.can_enter) return <Locked house={house} slug={slug} />

  return (
    <HouseRoom house={house} username={user?.username ?? null} code={convite} />
  )
}
