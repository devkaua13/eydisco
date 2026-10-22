"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CompassIcon,
  GalleryVerticalEndIcon,
  HomeIcon,
  UserRoundIcon,
  UsersRoundIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

// Barra de abas do celular, como a das referências.
export function TabBar({ username }: { username: string | null }) {
  const pathname = usePathname()
  const tabs = [
    { href: "/", label: "Início", icon: HomeIcon, active: pathname === "/" },
    {
      href: "/descobrir",
      label: "Descobrir",
      icon: CompassIcon,
      active: [
        "/descobrir",
        "/busca",
        "/drops",
        "/radio",
        "/discos",
        "/faixas",
        "/artistas",
      ].some((p) => pathname.startsWith(p)),
    },
    {
      href: "/houses",
      label: "Houses",
      icon: UsersRoundIcon,
      active: pathname.startsWith("/houses"),
    },
    {
      href: "/colecao",
      label: "Coleção",
      icon: GalleryVerticalEndIcon,
      active:
        pathname.startsWith("/estante") || pathname.startsWith("/colecao"),
    },
    {
      href: username ? `/perfil/${username}` : "/entrar",
      label: "Perfil",
      icon: UserRoundIcon,
      active: pathname.startsWith("/perfil") || pathname.startsWith("/pedidos"),
    },
  ]
  return (
    <>
      <div aria-hidden className="h-16 md:hidden" />
      <nav
        aria-label="Abas"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
      >
        <ul className="grid h-16 grid-cols-5">
          {tabs.map((tab) => (
            <li key={tab.label}>
              <Link
                href={tab.href}
                aria-current={tab.active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-[0.7rem]",
                  tab.active ? "text-brand" : "text-muted-foreground"
                )}
              >
                <tab.icon className="size-5" aria-hidden />
                {tab.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
