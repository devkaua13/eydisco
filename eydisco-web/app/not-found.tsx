import { ButtonLink } from "@/components/button-link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-4xl font-bold tracking-tight">
        Essa página não existe
      </h1>
      <p className="max-w-prose text-muted-foreground">
        O endereço pode estar errado ou o disco foi retirado do catálogo.
      </p>
      <ButtonLink href="/">Voltar para o início</ButtonLink>
    </div>
  )
}
