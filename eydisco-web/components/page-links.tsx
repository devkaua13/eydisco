import { ButtonLink } from "@/components/button-link"

// Paginação do DRF: só "anterior" e "próxima", que é o que a API devolve.
export function PageLinks({
  hrefFor,
  previous,
  next,
}: {
  hrefFor: (page: number) => string
  previous: number | null
  next: number | null
}) {
  if (!previous && !next) return null
  return (
    <nav aria-label="Páginas" className="flex justify-between gap-4 pt-12">
      {previous ? (
        <ButtonLink href={hrefFor(previous)} variant="outline">
          Página anterior
        </ButtonLink>
      ) : (
        <span />
      )}
      {next && (
        <ButtonLink href={hrefFor(next)} variant="outline">
          Próxima página
        </ButtonLink>
      )}
    </nav>
  )
}
