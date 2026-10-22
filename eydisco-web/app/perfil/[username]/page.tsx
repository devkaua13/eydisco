import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { logout } from "@/app/actions"
import { ButtonLink } from "@/components/button-link"
import { HouseCard } from "@/components/house-card"
import { Rail } from "@/components/release-tile"
import { SectionHeader } from "@/components/section-header"
import { UserAvatar } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"
import { getCurrentUser, getProfile } from "@/lib/api"
import { formatAgo } from "@/lib/format"
import type { Profile } from "@/lib/types"

type Props = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: (await params).username }
}

function activityText(event: Profile["activity"][number], isSelf: boolean) {
  if (event.kind === "collected")
    return isSelf
      ? `Você coletou o álbum ${event.title}`
      : `Coletou o álbum ${event.title}`
  if (event.kind === "created_house")
    return isSelf
      ? `Você criou a House ${event.title}`
      : `Criou a House ${event.title}`
  return isSelf
    ? `Você entrou na House ${event.title}`
    : `Entrou na House ${event.title}`
}

function activityHref(event: Profile["activity"][number]) {
  return event.kind === "collected"
    ? `/discos/${event.slug}`
    : `/houses/${event.slug}`
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params
  const [profile, user] = await Promise.all([
    getProfile(username),
    getCurrentUser(),
  ])
  if (!profile) notFound()
  const isSelf = user?.username === username
  const role = profile.counts.discs > 0 ? "Colecionador" : "Ouvinte"

  const stats = [
    {
      value: profile.counts.discs,
      label: "Discs",
      href: `/estante/${username}`,
    },
    {
      value: profile.counts.houses_created,
      label: "Houses criadas",
      href: `/estante/${username}?aba=houses`,
    },
    {
      value: profile.counts.houses_joined,
      label: "Houses que entrou",
      href: `/estante/${username}?aba=houses`,
    },
  ]

  return (
    <div className="flex flex-col gap-10">
      <header className="flex items-center gap-4">
        <UserAvatar username={username} className="size-20 text-xl ring-0" />
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">{username}</h1>
          <p className="text-sm text-muted-foreground">
            {role},{" "}
            {profile.counts.houses_created + profile.counts.houses_joined}{" "}
            Houses
          </p>
        </div>
      </header>

      <dl className="grid grid-cols-3 gap-2 text-center">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="flex flex-col-reverse gap-1 rounded-2xl bg-card p-4 ring-1 ring-white/5 hover:ring-brand/40"
          >
            <dt className="text-xs text-muted-foreground">{stat.label}</dt>
            <dd className="text-2xl font-bold">{stat.value}</dd>
          </Link>
        ))}
      </dl>

      <section aria-labelledby="houses-title" className="flex flex-col gap-4">
        <SectionHeader
          id="houses-title"
          title={isSelf ? "Minhas Houses" : "Houses"}
          href={isSelf ? "/houses?aba=mine" : undefined}
          action="Ver todas"
        />
        {profile.houses.length > 0 ? (
          <Rail>
            {profile.houses.map((house) => (
              <HouseCard key={house.slug} house={house} />
            ))}
          </Rail>
        ) : (
          <p className="text-sm text-muted-foreground">
            {isSelf
              ? "Você ainda não criou nenhuma House."
              : `${username} ainda não criou nenhuma House pública.`}{" "}
            {isSelf && (
              <Link
                href="/houses/criar"
                className="text-foreground underline underline-offset-4"
              >
                Criar House
              </Link>
            )}
          </p>
        )}
      </section>

      <section aria-labelledby="activity-title" className="flex flex-col gap-4">
        <SectionHeader id="activity-title" title="Atividade" />
        {profile.activity.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {profile.activity.map((event) => (
              <li key={`${event.kind}-${event.slug}-${event.at}`}>
                <Link
                  href={activityHref(event)}
                  className="flex items-center gap-3 rounded-xl p-2 hover:bg-card"
                >
                  <UserAvatar username={username} className="size-8 ring-0" />
                  <span className="flex-1 text-sm">
                    {activityText(event, isSelf)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatAgo(event.at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nada por aqui ainda.</p>
        )}
      </section>

      {isSelf && (
        <section
          aria-label="Conta"
          className="flex flex-wrap gap-2 border-t pt-6"
        >
          <ButtonLink href="/pedidos" variant="secondary">
            Meus pedidos
          </ButtonLink>
          <form action={logout}>
            <Button type="submit" variant="ghost">
              Sair
            </Button>
          </form>
        </section>
      )}
    </div>
  )
}
