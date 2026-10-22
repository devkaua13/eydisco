import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

function hueOf(text: string) {
  let hash = 0
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) % 360
  return hash
}

// Avatar de quem usa o site: iniciais sobre um degradê com a cor do nome.
export function UserAvatar({
  username,
  className,
}: {
  username: string
  className?: string
}) {
  const hue = hueOf(username)
  return (
    <Avatar className={cn("size-8 ring-2 ring-background", className)}>
      <AvatarFallback
        className="text-[0.7rem] font-bold text-white uppercase"
        style={{
          background: `linear-gradient(135deg, oklch(0.55 0.2 ${hue}), oklch(0.35 0.15 ${hue + 60}))`,
        }}
      >
        {username.slice(0, 2)}
      </AvatarFallback>
    </Avatar>
  )
}
