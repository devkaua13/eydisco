import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/api"

// A aba Coleção leva à coleção de quem está logado.
export default async function MyCollectionPage() {
  const user = await getCurrentUser()
  redirect(user ? `/estante/${user.username}` : "/entrar?next=/colecao")
}
