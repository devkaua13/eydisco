import { NextResponse, type NextRequest } from "next/server"

import { ApiError, apiFetch } from "@/lib/api"
import type { HouseLive } from "@/lib/types"

// Estado da sala: tocando agora, participantes, reações e chat novos.
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/houses/[slug]/live">
) {
  const { slug } = await ctx.params
  const params = request.nextUrl.searchParams
  try {
    const live = await apiFetch<HouseLive>(`/api/houses/${slug}/live/`, {
      query: {
        after_reaction: params.get("after_reaction") ?? undefined,
        after_message: params.get("after_message") ?? undefined,
        code: params.get("code") ?? undefined,
      },
    })
    return NextResponse.json(live)
  } catch (error) {
    if (error instanceof ApiError)
      return NextResponse.json(error.body, { status: error.status })
    throw error
  }
}
