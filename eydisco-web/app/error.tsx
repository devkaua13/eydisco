"use client"

import { Button } from "@/components/ui/button"

export default function Error({
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-4xl font-bold tracking-tight">
        Não conseguimos carregar esta página
      </h1>
      <p className="max-w-prose text-muted-foreground">
        O servidor do eydisco não respondeu. Tente de novo em alguns segundos.
      </p>
      <Button onClick={() => retry()}>Tentar de novo</Button>
    </div>
  )
}
