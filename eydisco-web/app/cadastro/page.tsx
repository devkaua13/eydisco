import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AuthForm } from "@/app/entrar/auth-form"
import { getCurrentUser } from "@/lib/api"
import { safeNext } from "@/lib/session"

export const metadata: Metadata = { title: "Criar conta" }

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const next = safeNext((await searchParams).next, "")
  if (await getCurrentUser()) redirect(next || "/")

  const loginHref = next
    ? `/entrar?next=${encodeURIComponent(next)}`
    : "/entrar"

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">Criar conta</h1>
        <p className="text-muted-foreground">
          Com uma conta você coleciona Discs numerados, entra em Houses e
          conversa com quem está ouvindo junto.
        </p>
      </div>
      <AuthForm mode="register" next={next || undefined} />
      <p className="text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link
          href={loginHref}
          className="text-foreground underline underline-offset-4"
        >
          Entrar
        </Link>
      </p>
    </div>
  )
}
