import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { ArtistSummary } from "@/lib/types"
import { cn } from "@/lib/utils"

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}

export function ArtistAvatar({
  artist,
  className,
}: {
  artist: ArtistSummary
  className?: string
}) {
  return (
    <Avatar className={cn("size-full", className)}>
      {artist.avatar && <AvatarImage src={artist.avatar} alt="" />}
      <AvatarFallback className="font-bold">
        {initials(artist.name)}
      </AvatarFallback>
    </Avatar>
  )
}
