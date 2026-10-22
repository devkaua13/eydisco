import "server-only"

import { cache } from "react"

import { getToken } from "@/lib/session"
import type {
  Artist,
  Drop,
  DropSummary,
  FieldErrors,
  House,
  HouseSummary,
  Item,
  Order,
  Page,
  Profile,
  Radio,
  Release,
  ReleaseListItem,
  ReleaseStatus,
  Route,
  Search,
  Track,
  User,
} from "@/lib/types"

const API_URL = process.env.API_URL ?? "http://localhost:8000"

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown
  ) {
    super(`A API respondeu ${status}`)
  }

  // Normaliza o corpo de erro do DRF para { campo: [mensagens] }.
  get fieldErrors(): FieldErrors {
    if (!this.body || typeof this.body !== "object") return {}
    const errors: FieldErrors = {}
    for (const [field, value] of Object.entries(this.body)) {
      errors[field] = Array.isArray(value) ? value.map(String) : [String(value)]
    }
    return errors
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  body?: unknown
  // Sem token explícito, usa o da sessão; null força a chamada anônima.
  token?: string | null
  query?: Record<string, string | number | undefined>
}

export async function apiFetch<T>(
  path: string,
  { method = "GET", body, token, query }: RequestOptions = {}
): Promise<T> {
  const url = new URL(path, API_URL)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }

  const auth = token === undefined ? await getToken() : token
  const headers: HeadersInit = { Accept: "application/json" }
  if (body !== undefined) headers["Content-Type"] = "application/json"
  if (auth) headers.Authorization = `Token ${auth}`

  // Estoque e pedidos mudam a cada compra, então nada é cacheado.
  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    throw new ApiError(response.status, errorBody)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

// Envio com arquivo (foto da House): multipart em vez de JSON.
export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  const token = await getToken()
  const response = await fetch(new URL(path, API_URL), {
    method: "POST",
    headers: token
      ? { Authorization: `Token ${token}`, Accept: "application/json" }
      : { Accept: "application/json" },
    body: form,
    cache: "no-store",
  })
  if (!response.ok) {
    throw new ApiError(response.status, await response.json().catch(() => null))
  }
  return response.json() as Promise<T>
}

// Devolve null quando a API responde 404, para a página chamar notFound().
async function orNull<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export function getFeed(status?: ReleaseStatus, page?: number) {
  return apiFetch<Page<ReleaseListItem>>("/api/feed/", {
    query: { status, page },
  })
}

export function getRelease(slug: string) {
  return orNull(apiFetch<Release>(`/api/releases/${slug}/`))
}

export function getArtist(slug: string) {
  return orNull(apiFetch<Artist>(`/api/artists/${slug}/`))
}

export function getTrack(slug: string) {
  return orNull(apiFetch<Track>(`/api/tracks/${slug}/`))
}

export function getRoute() {
  return apiFetch<Route>("/api/route/")
}

export function search(q: string) {
  return apiFetch<Search>("/api/search/", { query: { q } })
}

export function getDrops() {
  return apiFetch<Page<DropSummary>>("/api/drops/")
}

export function getDrop(slug: string) {
  return orNull(apiFetch<Drop>(`/api/drops/${slug}/`))
}

export function getRadio() {
  return apiFetch<Radio>("/api/radio/")
}

export type HouseTab = "live" | "upcoming" | "mine"

export function getHouses(tab?: HouseTab) {
  return apiFetch<HouseSummary[]>("/api/houses/", { query: { tab } })
}

// `code` é o convite de uma House privada.
export function getHouse(slug: string, code?: string) {
  return orNull(apiFetch<House>(`/api/houses/${slug}/`, { query: { code } }))
}

export function getProfile(username: string) {
  return orNull(apiFetch<Profile>(`/api/users/${username}/`))
}

export function getShelf(username: string, page?: number) {
  return orNull(
    apiFetch<Page<Item>>(`/api/users/${username}/shelf/`, { query: { page } })
  )
}

export function getOrders(page?: number) {
  return apiFetch<Page<Order>>("/api/orders/", { query: { page } })
}

// Uma chamada por requisição, mesmo com o cabeçalho e a página pedindo o usuário.
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = await getToken()
  if (!token) return null
  try {
    return await apiFetch<User>("/api/auth/me/", { token })
  } catch (error) {
    // Token revogado ou apagado no admin: trata como deslogado.
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
})

export function pageFromUrl(url: string | null) {
  if (!url) return null
  return Number(new URL(url).searchParams.get("page") ?? 1)
}
