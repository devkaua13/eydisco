import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { CreateHouseForm } from "./create-house-form"
import { apiFetch, getCurrentUser } from "@/lib/api"
import type { Page, ReleaseListItem, User } from "@/lib/types"

export const metadata: Metadata = { title: "Criar House" }

export default async function CreateHousePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/entrar?next=/houses/criar")

  const [me, feed] = await Promise.all([
    apiFetch<User>("/api/auth/me/"),
    apiFetch<Page<ReleaseListItem>>("/api/feed/"),
  ])
  // Só dá para tocar Disc que já tem faixa.
  const discs = feed.results
    .filter((release) => release.tracks_count > 0)
    .map((release) => ({
      slug: release.slug,
      title: release.title,
      artist: release.artist.name,
    }))

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Criar House
        </h1>
        <p className="text-muted-foreground">
          Transforme sua audição em uma festa.
        </p>
      </header>
      <CreateHouseForm
        discs={discs}
        managedArtists={me.managed_artists ?? []}
      />
    </div>
  )
}
