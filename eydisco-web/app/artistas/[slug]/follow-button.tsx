"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { setFollowing } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export function FollowButton({
  slug,
  initialFollowing,
  initialCount,
  loggedIn,
}: {
  slug: string
  initialFollowing: boolean
  initialCount: number
  loggedIn: boolean
}) {
  const router = useRouter()
  const [following, setFollowingState] = useState(initialFollowing)
  const [count, setCount] = useState(initialCount)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onClick() {
    if (!loggedIn) {
      router.push(`/entrar?next=${encodeURIComponent(`/artistas/${slug}`)}`)
      return
    }
    startTransition(async () => {
      const result = await setFollowing(slug, !following)
      if (result.ok) {
        setFollowingState(result.data.is_following)
        setCount(result.data.followers_count)
        setError(null)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant={following ? "outline" : "default"}
        onClick={onClick}
        disabled={pending}
        aria-pressed={following}
      >
        {pending && <Spinner data-icon="inline-start" />}
        {following ? "Seguindo" : "Seguir"}
      </Button>
      <span className="text-sm text-muted-foreground" aria-live="polite">
        {count === 1 ? "1 seguidor" : `${count} seguidores`}
      </span>
      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  )
}
