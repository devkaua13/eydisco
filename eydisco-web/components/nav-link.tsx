"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Link da navegação que marca a seção atual. `match` cobre seções com mais de um endereço.
export function NavLink({
  href,
  match,
  children,
}: {
  href: string
  match?: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const active =
    href === "/"
      ? pathname === "/"
      : pathname.startsWith(href) ||
        (match ? pathname.startsWith(match) : false)
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        buttonVariants({ variant: "ghost" }),
        active ? "text-foreground" : "text-muted-foreground"
      )}
    >
      {children}
    </Link>
  )
}
