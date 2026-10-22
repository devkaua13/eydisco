"use server"

import { redirect } from "next/navigation"

import { ApiError, apiFetch, apiUpload } from "@/lib/api"
import { clearToken, getToken, safeNext, setToken } from "@/lib/session"
import type { FieldErrors, Order, User } from "@/lib/types"

export type FormState = {
  errors: FieldErrors
  values: Record<string, string>
}

function valuesOf(formData: FormData, fields: string[]) {
  return Object.fromEntries(
    fields.map((field) => [field, String(formData.get(field) ?? "")])
  )
}

function failure(error: unknown, values: Record<string, string>): FormState {
  if (error instanceof ApiError && error.status === 400) {
    return { errors: error.fieldErrors, values }
  }
  return {
    errors: {
      non_field_errors: [
        "Não foi possível falar com o servidor. Tente de novo em instantes.",
      ],
    },
    values,
  }
}

export async function login(_: FormState, formData: FormData) {
  const values = valuesOf(formData, ["username", "password"])
  try {
    const { token } = await apiFetch<{ token: string }>("/api/auth/token/", {
      method: "POST",
      body: values,
    })
    await setToken(token)
  } catch (error) {
    // O DRF responde com uma frase genérica; esta diz o que fazer.
    if (
      error instanceof ApiError &&
      error.status === 400 &&
      error.fieldErrors.non_field_errors
    ) {
      return {
        errors: {
          non_field_errors: [
            "Usuário ou senha incorretos. Confira e tente de novo.",
          ],
        },
        values: { ...values, password: "" },
      }
    }
    // A senha não volta para o formulário.
    return failure(error, { ...values, password: "" })
  }
  redirect(safeNext(formData.get("next")))
}

export async function register(_: FormState, formData: FormData) {
  const values = valuesOf(formData, ["username", "email", "password"])
  try {
    const { token } = await apiFetch<{ token: string; user: User }>(
      "/api/auth/register/",
      { method: "POST", body: values }
    )
    await setToken(token)
  } catch (error) {
    return failure(error, { ...values, password: "" })
  }
  redirect(safeNext(formData.get("next")))
}

export async function logout() {
  await clearToken()
  redirect("/")
}

const SHIPPING_FIELDS = [
  "recipient_name",
  "postal_code",
  "street",
  "number",
  "complement",
  "neighborhood",
  "city",
  "state",
]

export async function placeOrder(_: FormState, formData: FormData) {
  const values = valuesOf(formData, ["edition", ...SHIPPING_FIELDS])
  const token = await getToken()
  if (!token) redirect("/entrar")

  let order: Order
  try {
    order = await apiFetch<Order>("/api/orders/", {
      method: "POST",
      body: values,
      token,
    })
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/entrar")
    return failure(error, values)
  }
  redirect(`/pedidos?novo=${order.id}`)
}

// Ações sem formulário: devolvem o resultado ou um erro curto para a interface mostrar.
type ActionResult<T> =
  { ok: true; data: T } | { ok: false; error: string; needsLogin?: boolean }

async function run<T>(request: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await request() }
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return {
        ok: false,
        error: "Entre na sua conta para fazer isso.",
        needsLogin: true,
      }
    }
    if (error instanceof ApiError) {
      const message = Object.values(error.fieldErrors).flat()[0]
      return { ok: false, error: message ?? "Não deu certo. Tente de novo." }
    }
    return { ok: false, error: "Não foi possível falar com o servidor." }
  }
}

export async function setFollowing(slug: string, follow: boolean) {
  return run(() =>
    apiFetch<{ is_following: boolean; followers_count: number }>(
      `/api/artists/${slug}/follow/`,
      { method: follow ? "POST" : "DELETE" }
    )
  )
}

// `code` é o convite de uma House privada; com ele, a pessoa passa a ser da sala.
export async function markPresence(slug: string, code?: string) {
  return run(() =>
    apiFetch<void>(`/api/houses/${slug}/presence/`, {
      method: "POST",
      query: { code },
    })
  )
}

export async function startHouse(slug: string) {
  return run(() =>
    apiFetch<unknown>(`/api/houses/${slug}/start/`, { method: "POST" })
  )
}

export async function react(slug: string, emoji: string) {
  return run(() =>
    apiFetch<unknown>(`/api/houses/${slug}/reactions/`, {
      method: "POST",
      body: { emoji },
    })
  )
}

export async function sendMessage(slug: string, text: string) {
  return run(() =>
    apiFetch<unknown>(`/api/houses/${slug}/messages/`, {
      method: "POST",
      body: { text },
    })
  )
}

export async function createHouse(_: FormState, formData: FormData) {
  const values = valuesOf(formData, [
    "title",
    "description",
    "visibility",
    "release",
    "when",
    "starts_at",
  ])
  const form = new FormData()
  for (const field of ["title", "description", "visibility", "release"]) {
    form.set(field, values[field])
  }
  // datetime-local vem sem fuso; a API interpreta no horário de São Paulo.
  if (values.when === "later" && values.starts_at)
    form.set("starts_at", values.starts_at)
  const cover = formData.get("cover")
  if (cover instanceof File && cover.size > 0) form.set("cover", cover)

  let house: { slug: string }
  try {
    house = await apiUpload<{ slug: string }>("/api/houses/", form)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401)
      redirect("/entrar?next=/houses/criar")
    return failure(error, values)
  }
  redirect(`/houses/${house.slug}`)
}
