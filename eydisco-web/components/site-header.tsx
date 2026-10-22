import Link from "next/link"
import { SearchIcon } from "lucide-react"

import { logout } from "@/app/actions"
import { ButtonLink } from "@/components/button-link"
import { NavLink } from "@/components/nav-link"
import { UserAvatar } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"
import type { User } from "@/lib/types"

const sections = [
  { href: "/", label: "Início" },
  { href: "/descobrir", label: "Descobrir" },
  { href: "/radio", label: "Rádio" },
  { href: "/houses", label: "Houses" },
  { href: "/colecao", label: "Coleção", match: "/estante" },
]

export function Logo() {
  return (
    <Link
      href="/"
      className="text-lg font-semibold tracking-[0.35em] uppercase"
    >
      eydisco
    </Link>
  )
}

export function SiteHeader({ user }: { user: User | null }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6 md:h-16">
        <Logo />
        <nav aria-label="Seções" className="hidden items-center gap-1 md:flex">
          {sections.map((section) => (
            <NavLink
              key={section.href}
              href={section.href}
              match={section.match}
            >
              {section.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <ButtonLink
            href="/busca"
            variant="ghost"
            size="icon"
            aria-label="Buscar"
          >
            <SearchIcon />
          </ButtonLink>
          {user ? (
            <>
              <form action={logout} className="hidden md:block">
                <Button variant="ghost" type="submit">
                  Sair
                </Button>
              </form>
              <Link
                href={`/perfil/${user.username}`}
                aria-label="Meu perfil"
                className="rounded-full"
              >
                <UserAvatar username={user.username} className="size-9" />
              </Link>
            </>
          ) : (
            <>
              <ButtonLink
                href="/cadastro"
                variant="ghost"
                className="hidden sm:inline-flex"
              >
                Criar conta
              </ButtonLink>
              <ButtonLink href="/entrar">Entrar</ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
