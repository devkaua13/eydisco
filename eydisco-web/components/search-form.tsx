import { SearchIcon } from "lucide-react"

// Busca em pílula, como nas referências. Um GET para /busca, funciona sem JavaScript.
export function SearchForm({
  defaultValue,
  autoFocus,
  placeholder = "Artista, Disc ou faixa",
}: {
  defaultValue?: string
  autoFocus?: boolean
  placeholder?: string
}) {
  return (
    <form action="/busca" role="search" className="w-full max-w-xl">
      <label className="flex h-12 items-center gap-3 rounded-full bg-white/8 px-5 ring-1 ring-white/10 backdrop-blur focus-within:ring-2 focus-within:ring-ring">
        <SearchIcon
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <span className="sr-only">Buscar</span>
        <input
          name="q"
          type="search"
          placeholder={placeholder}
          defaultValue={defaultValue}
          autoFocus={autoFocus}
          minLength={2}
          required
          className="h-full w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>
    </form>
  )
}
