import Image from "next/image"

import { cn } from "@/lib/utils"

function hueOf(text: string) {
  let hash = 0
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) % 360
  return hash
}

// Capa do disco. Sem imagem, um brilho na cor tirada do slug com o título.
export function Cover({
  src,
  title,
  slug,
  sizes,
  eager,
  className,
}: {
  src: string | null
  title: string
  slug: string
  sizes: string
  // Capa acima da dobra: carrega já, com prioridade alta.
  eager?: boolean
  className?: string
}) {
  const hue = hueOf(slug)
  return (
    <div
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-xl bg-surface",
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={`Capa de ${title}`}
          fill
          sizes={sizes}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : undefined}
          className="object-cover"
        />
      ) : (
        <div
          role="img"
          aria-label={`Capa de ${title}`}
          className="absolute inset-0 flex items-end p-[8%]"
          style={{
            background: `radial-gradient(circle at 40% 45%, oklch(0.62 0.2 ${hue}) 0%, oklch(0.3 0.15 ${hue + 40}) 35%, #07060d 75%)`,
          }}
        >
          <span className="line-clamp-2 text-[0.7rem] font-semibold title-spaced">
            {title}
          </span>
        </div>
      )}
    </div>
  )
}
