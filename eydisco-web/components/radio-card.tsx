import Image from "next/image"
import Link from "next/link"
import { RadioIcon } from "lucide-react"

import { LiveTag } from "@/components/badges"
import type { Radio } from "@/lib/types"

// Atalho para a Eydisco Radio com o que está tocando.
export function RadioCard({ radio }: { radio: Radio }) {
  const track = radio.playback?.track
  return (
    <Link
      href="/radio"
      className="group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-card p-4 ring-1 ring-white/10 hover:ring-brand/50"
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-surface">
        {track?.release.cover ? (
          <Image
            src={track.release.cover}
            alt=""
            fill
            sizes="4rem"
            className="object-cover"
          />
        ) : (
          <RadioIcon
            className="m-auto size-6 h-full text-muted-foreground"
            aria-hidden
          />
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Eydisco Radio</span>
          {radio.show && <LiveTag />}
        </div>
        <span className="truncate text-sm text-muted-foreground">
          {radio.show && track
            ? `${radio.show.title} com ${radio.show.host_name}. Tocando ${track.title}, de ${track.artist.name}.`
            : "Fora do ar agora. Veja a programação."}
        </span>
      </div>
    </Link>
  )
}
