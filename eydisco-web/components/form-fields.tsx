import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

// Input com rótulo e os erros que o DRF devolve para o campo.
export function TextField({
  name,
  label,
  errors,
  description,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "name"> & {
  name: string
  label: string
  errors?: string[]
  description?: string
}) {
  const invalid = errors && errors.length > 0
  return (
    <Field data-invalid={invalid || undefined} className={className}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input
        id={name}
        name={name}
        aria-invalid={invalid || undefined}
        {...props}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      <FieldError errors={errors?.map((message) => ({ message }))} />
    </Field>
  )
}

// Erros que não são de um campo só, como credenciais erradas ou edição esgotada.
export function FormAlert({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null
  return (
    <Alert variant="destructive">
      <AlertDescription>
        {errors.map((message) => (
          <p key={message}>{message}</p>
        ))}
      </AlertDescription>
    </Alert>
  )
}
