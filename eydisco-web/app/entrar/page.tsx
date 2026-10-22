import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AuthForm } from "./auth-form"
import { getCurrentUser } from "@/lib/api"
import { safeNext } from "@/lib/session"

export const metadata: Metadata = { title: "Entrar" }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const next = safeNext((await searchParams).next, "")
  if (await getCurrentUser()) redirect(next || "/")

  const registerHref = next
    ? `/cadastro?next=${encodeURIComponent(next)}`
    : "/cadastro"

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
      <h1 className="text-4xl font-bold tracking-tight">Entrar</h1>
      <AuthForm mode="login" next={next || undefined} />
      <p className="text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link
          href={registerHref}
          className="text-foreground underline underline-offset-4"
        >
          Criar conta
        </Link>
      </p>
    </div>
  )
}
