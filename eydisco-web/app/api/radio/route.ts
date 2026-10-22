import { NextResponse } from "next/server"

import { getRadio } from "@/lib/api"

// O player consulta aqui de tempos em tempos para saber o que está no ar.
export async function GET() {
  return NextResponse.json(await getRadio())
}
