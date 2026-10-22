import { padSerial } from "@/lib/format"
import { cn } from "@/lib/utils"

// Número do exemplar, como na contracapa: EDIÇÃO #127 / 500.
export function EditionNumber({
  serial,
  total,
  label = "Edição",
  size = "sm",
  className,
}: {
  serial: number
  total: number
  label?: string | null
  size?: "sm" | "lg"
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-2 font-medium title-spaced text-foreground/80",
        size === "sm" ? "text-[0.7rem]" : "text-sm",
        className
      )}
      aria-label={`Exemplar ${serial} de ${total}`}
    >
      {label && <span aria-hidden>{label}</span>}
      <span
        aria-hidden
        className={cn(
          size === "lg" &&
            "text-5xl font-light tracking-[0.08em] text-foreground sm:text-6xl"
        )}
      >
        #{padSerial(serial, total)}
        <span className={cn(size === "lg" && "text-2xl text-muted-foreground")}>
          {" "}
          / {total}
        </span>
      </span>
    </span>
  )
}
