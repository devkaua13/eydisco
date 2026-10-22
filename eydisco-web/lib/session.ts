import "server-only"

import { cookies } from "next/headers"

// O token do DRF fica num cookie httpOnly; o navegador nunca o lê,
// só o servidor do Next, que repassa para a API.
const COOKIE = "eydisco_token"
const THIRTY_DAYS = 60 * 60 * 24 * 30

export async function getToken() {
  return (await cookies()).get(COOKIE)?.value
}

export async function setToken(token: string) {
  ;(await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
  })
}

export async function clearToken() {
  ;(await cookies()).delete(COOKIE)
}

// Aceita só caminhos internos em ?next=, para o login não virar redirecionamento aberto.
export function safeNext(next: unknown, fallback = "/") {
  if (typeof next !== "string") return fallback
  if (!next.startsWith("/") || next.startsWith("//")) return fallback
  return next
}
