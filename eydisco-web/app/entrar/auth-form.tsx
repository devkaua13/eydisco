"use client"

import { useActionState } from "react"

import { login, register, type FormState } from "@/app/actions"
import { FormAlert, TextField } from "@/components/form-fields"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

const initialState: FormState = { errors: {}, values: {} }

export function AuthForm({
  mode,
  next,
}: {
  mode: "login" | "register"
  next?: string
}) {
  const [state, formAction, pending] = useActionState(
    mode === "login" ? login : register,
    initialState
  )
  const { errors, values } = state

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {next && <input type="hidden" name="next" value={next} />}
      <FormAlert
        errors={[...(errors.non_field_errors ?? []), ...(errors.detail ?? [])]}
      />
      <FieldGroup>
        <TextField
          name="username"
          label="Nome de usuário"
          autoComplete="username"
          autoCapitalize="none"
          defaultValue={values.username}
          errors={errors.username}
          description={
            mode === "register"
              ? "Aparece no endereço do seu perfil e da sua coleção."
              : undefined
          }
          required
        />
        {mode === "register" && (
          <TextField
            name="email"
            type="email"
            label="E-mail"
            autoComplete="email"
            defaultValue={values.email}
            errors={errors.email}
            required
          />
        )}
        <TextField
          name="password"
          type="password"
          label="Senha"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          errors={errors.password}
          required
        />
      </FieldGroup>
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Spinner data-icon="inline-start" />}
        {mode === "login" ? "Entrar" : "Criar conta"}
      </Button>
    </form>
  )
}
