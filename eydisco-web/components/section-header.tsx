import Link from "next/link"
import { ChevronRightIcon } from "lucide-react"

// Título de seção com o "Ver tudo" à direita, como nas referências.
export function SectionHeader({
  id,
  title,
  href,
  action = "Ver tudo",
}: {
  id: string
  title: string
  href?: string
  action?: string
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 id={id} className="text-xl font-bold tracking-tight sm:text-2xl">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground"
        >
          {action}
          <ChevronRightIcon className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  )
}
