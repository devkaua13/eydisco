import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { CheckoutForm } from "./checkout-form"
import { Cover } from "@/components/cover"
import { EditionNumber } from "@/components/edition-number"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ButtonLink } from "@/components/button-link"
import { getCurrentUser, getRelease } from "@/lib/api"
import { formatDate, formatPrice } from "@/lib/format"

export const metadata: Metadata = { title: "Comprar" }

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ edicao?: string }>
}

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { edicao } = await searchParams

  const user = await getCurrentUser()
  if (!user) {
    const back = `/discos/${slug}/comprar?edicao=${edicao ?? ""}`
    redirect(`/entrar?next=${encodeURIComponent(back)}`)
  }

  const release = await getRelease(slug)
  const edition = release?.editions.find((e) => String(e.id) === edicao)
  if (!release || !edition) notFound()

  const unavailable =
    release.status === "upcoming"
      ? `A pré-venda abre em ${formatDate(release.presale_starts_at)}.`
      : edition.available === 0
        ? "Todos os exemplares desta edição já foram vendidos."
        : null

  const nextSerial = edition.total_supply - edition.available + 1

  return (
    <div className="grid gap-10 md:grid-cols-12 md:gap-12">
      <aside className="flex flex-col gap-5 md:col-span-4">
        <Cover
          src={release.cover}
          title={release.title}
          slug={release.slug}
          sizes="(min-width: 768px) 30vw, 100vw"
          className="max-w-xs"
          eager
        />
        <div className="flex flex-col gap-1">
          <p>{release.artist.name}</p>
          <p className="text-3xl leading-none font-bold">{release.title}</p>
          <p className="pt-1">{edition.name}</p>
          <p className="text-2xl font-semibold">{formatPrice(edition.price)}</p>
        </div>
        {!unavailable && (
          <div className="flex items-center gap-4">
            <EditionNumber
              serial={nextSerial}
              total={edition.total_supply}
              label={null}
              className="shrink-0"
            />
            <p className="text-sm text-muted-foreground">
              Número que deve ser seu. Se alguém comprar antes, você recebe o
              seguinte.
            </p>
          </div>
        )}
      </aside>

      <section
        aria-labelledby="checkout-title"
        className="flex flex-col gap-6 md:col-span-8 md:max-w-xl"
      >
        <h1 id="checkout-title" className="text-4xl font-bold tracking-tight">
          Para onde mandamos o disco?
        </h1>
        {unavailable ? (
          <Alert>
            <AlertTitle>Esta edição não está à venda agora</AlertTitle>
            <AlertDescription>{unavailable}</AlertDescription>
            <ButtonLink
              href={`/discos/${release.slug}`}
              variant="outline"
              className="mt-3 w-fit"
            >
              Voltar para o disco
            </ButtonLink>
          </Alert>
        ) : (
          <CheckoutForm
            editionId={edition.id}
            price={formatPrice(edition.price)}
            isDemo={edition.is_demo}
            defaultName={[user.first_name, user.last_name].join(" ").trim()}
          />
        )}
      </section>
    </div>
  )
}
