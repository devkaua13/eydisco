import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { Cover } from "@/components/cover"
import { PageLinks } from "@/components/page-links"
import { EditionNumber } from "@/components/edition-number"
import { Badge } from "@/components/ui/badge"
import { ButtonLink } from "@/components/button-link"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { getCurrentUser, getOrders, pageFromUrl } from "@/lib/api"
import { formatDate, formatPrice, orderStatusLabel } from "@/lib/format"
import type { Order } from "@/lib/types"

export const metadata: Metadata = { title: "Pedidos" }

function Confirmation({ order }: { order: Order }) {
  const { item } = order
  return (
    <section
      aria-labelledby="confirmation-title"
      className="flex flex-col gap-6 rounded-3xl bg-card p-6 glow sm:flex-row sm:items-center sm:gap-10 sm:p-10"
    >
      <EditionNumber
        serial={item.serial_number}
        total={item.total_supply}
        size="lg"
        label={null}
        className="shrink-0 self-start motion-safe:animate-in motion-safe:duration-500 motion-safe:fade-in motion-safe:zoom-in-125"
      />
      <div className="flex flex-col gap-3">
        <h1 id="confirmation-title" className="text-4xl leading-none font-bold">
          Disc colecionado. Esse número é seu.
        </h1>
        <p className="max-w-prose">
          {item.release.title}, {item.edition.toLowerCase()}. O disco já está na
          sua coleção.{" "}
          {item.is_demo
            ? "Esta é uma pré-venda demonstrativa: nada foi cobrado e nenhum disco será enviado."
            : `O pedido aguarda a confirmação do pagamento. Vamos enviar para ${order.street}, ${order.number}, ${order.city}/${order.state}.`}
        </p>
      </div>
    </section>
  )
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ novo?: string; page?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/entrar?next=/pedidos")

  const { novo, page } = await searchParams
  const orders = await getOrders(Number(page) || undefined)
  const justPlaced = orders.results.find((o) => String(o.id) === novo)

  return (
    <div className="flex flex-col gap-12">
      {justPlaced && <Confirmation order={justPlaced} />}

      <section aria-labelledby="orders-title" className="flex flex-col gap-6">
        <h2 id="orders-title" className="text-4xl font-bold tracking-tight">
          Pedidos
        </h2>

        {orders.results.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>Você ainda não comprou nenhum disco</EmptyTitle>
              <EmptyDescription>
                Quando garantir um exemplar numerado, o pedido aparece aqui.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <ButtonLink href="/?status=presale">
                Ver pré-vendas abertas
              </ButtonLink>
            </EmptyContent>
          </Empty>
        ) : (
          <ul className="flex flex-col divide-y border-y">
            {orders.results.map((order) => (
              <li
                key={order.id}
                className="grid grid-cols-[4rem_1fr] items-center gap-4 py-4 sm:grid-cols-[5rem_1fr_11rem_11rem] sm:gap-6"
              >
                <Cover
                  src={order.item.release.cover}
                  title={order.item.release.title}
                  slug={order.item.release.slug}
                  sizes="5rem"
                />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <Link
                    href={`/discos/${order.item.release.slug}`}
                    className="truncate text-lg font-semibold underline-offset-4 hover:underline"
                  >
                    {order.item.release.title}
                  </Link>
                  <span className="truncate text-sm">
                    {order.item.artist.name}, {order.item.edition.toLowerCase()}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Pedido {order.id}, feito em {formatDate(order.created_at)}
                  </span>
                </div>
                <div className="col-start-2 flex items-center gap-3 sm:col-start-auto sm:justify-end">
                  <EditionNumber
                    serial={order.item.serial_number}
                    total={order.item.total_supply}
                    label={null}
                  />
                  <span className="font-semibold">
                    {formatPrice(order.price)}
                  </span>
                </div>
                <Badge
                  variant={
                    order.status === "canceled"
                      ? "destructive"
                      : order.status === "pending"
                        ? "outline"
                        : "secondary"
                  }
                  className="col-start-2 sm:col-start-auto sm:justify-self-end"
                >
                  {orderStatusLabel[order.status]}
                </Badge>
              </li>
            ))}
          </ul>
        )}

        <PageLinks
          hrefFor={(p) => `/pedidos?page=${p}`}
          previous={pageFromUrl(orders.previous)}
          next={pageFromUrl(orders.next)}
        />
      </section>
    </div>
  )
}
