import Link from "next/link"
import { LockIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { Extra } from "@/lib/types"

const kindLabel: Record<Extra["kind"], string> = {
  text: "Texto",
  video: "Vídeo",
  image: "Imagem",
  audio: "Áudio",
  link: "Link",
}

// Conteúdos extras. Os exclusivos aparecem trancados para quem não tem o Disc.
export function Extras({
  extras,
  releaseSlug,
}: {
  extras: Extra[]
  releaseSlug: string
}) {
  return (
    <ul className="flex flex-col divide-y border-y">
      {extras.map((extra) => (
        <li key={extra.id} className="flex flex-col gap-2 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold">{extra.title}</h3>
            <Badge variant="outline">{kindLabel[extra.kind]}</Badge>
            {extra.owners_only && (
              <Badge variant="secondary">Para quem tem o Disc</Badge>
            )}
          </div>
          {extra.locked ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <LockIcon className="size-4" aria-hidden />
              <span>
                Libera quando você tiver um exemplar.{" "}
                <Link
                  href={`/discos/${releaseSlug}`}
                  className="text-foreground underline underline-offset-4"
                >
                  Ver edições
                </Link>
              </span>
            </p>
          ) : (
            <>
              {extra.body && <p className="max-w-prose">{extra.body}</p>}
              {extra.kind === "image" && extra.file && (
                // eslint-disable-next-line @next/next/no-img-element -- tamanho do arquivo é desconhecido
                <img
                  src={extra.file}
                  alt={extra.title}
                  className="max-h-96 w-auto rounded-xs"
                />
              )}
              {extra.kind === "audio" && extra.file && (
                <audio controls src={extra.file} className="w-full max-w-md" />
              )}
              {extra.kind === "video" && extra.file && (
                <video
                  controls
                  src={extra.file}
                  className="w-full max-w-2xl rounded-xs"
                />
              )}
              {extra.url && (
                <a
                  href={extra.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-fit text-sm underline underline-offset-4"
                >
                  Abrir {kindLabel[extra.kind].toLowerCase()} em outra aba
                </a>
              )}
            </>
          )}
        </li>
      ))}
    </ul>
  )
}
