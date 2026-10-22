import { cn } from "@/lib/utils"
import type { HouseSummary, ReleaseStatus } from "@/lib/types"

// Selo roxo de "ao vivo" e de situação, como os das referências.
export function Tag({
  children,
  tone = "brand",
  className,
}: {
  children: React.ReactNode
  tone?: "brand" | "muted"
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-md px-1.5 text-[0.65rem] font-bold tracking-[0.12em] uppercase",
        tone === "brand"
          ? "bg-brand text-brand-foreground"
          : "bg-black/50 text-foreground backdrop-blur",
        className
      )}
    >
      {children}
    </span>
  )
}

export function LiveTag({ className }: { className?: string }) {
  return <Tag className={className}>Ao vivo</Tag>
}

export function ReleaseTag({
  status,
  className,
}: {
  status: ReleaseStatus
  className?: string
}) {
  if (status === "presale") return <Tag className={className}>Pré-venda</Tag>
  if (status === "upcoming")
    return (
      <Tag tone="muted" className={className}>
        Em breve
      </Tag>
    )
  return null
}

export const visibilityLabel: Record<HouseSummary["visibility"], string> = {
  public: "Pública",
  private: "Privada",
  collector: "Collector",
  artist: "Artista",
}

// "1,2 mil dentro"
export function formatCount(count: number) {
  if (count < 1000) return String(count)
  return `${(count / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`
}
