"use client"

import { useActionState, useState } from "react"

import { placeOrder, type FormState } from "@/app/actions"
import { FormAlert, TextField } from "@/components/form-fields"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"

const STATES = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
]

type Address = {
  street: string
  neighborhood: string
  city: string
  state: string
}

const initialState: FormState = { errors: {}, values: {} }

export function CheckoutForm({
  editionId,
  price,
  isDemo,
  defaultName,
}: {
  editionId: number
  price: string
  isDemo: boolean
  defaultName: string
}) {
  const [state, formAction, pending] = useActionState(placeOrder, initialState)
  const values = state.values
  const errors = state.errors

  // Campos que o CEP preenche ficam controlados; o resto é lido do FormData.
  const [address, setAddress] = useState<Address>({
    street: values.street ?? "",
    neighborhood: values.neighborhood ?? "",
    city: values.city ?? "",
    state: values.state ?? "",
  })
  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "notfound">(
    "idle"
  )

  async function lookupCep(cep: string) {
    const digits = cep.replace(/\D/g, "")
    if (digits.length !== 8) return
    setCepStatus("loading")
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await response.json()
      if (data.erro) {
        setCepStatus("notfound")
        return
      }
      setAddress({
        street: data.logradouro || address.street,
        neighborhood: data.bairro || address.neighborhood,
        city: data.localidade || address.city,
        state: data.uf || address.state,
      })
      setCepStatus("idle")
    } catch {
      // Sem resposta do ViaCEP a pessoa só preenche à mão.
      setCepStatus("idle")
    }
  }

  function change(field: keyof Address) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setAddress((current) => ({ ...current, [field]: event.target.value }))
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="edition" value={editionId} />
      <FormAlert
        errors={[
          ...(errors.non_field_errors ?? []),
          ...(errors.edition ?? []),
          ...(errors.detail ?? []),
        ]}
      />

      <FieldSet>
        <FieldLegend className="sr-only">Endereço de entrega</FieldLegend>
        <FieldGroup>
          <TextField
            name="recipient_name"
            label="Nome de quem recebe"
            autoComplete="name"
            defaultValue={values.recipient_name ?? defaultName}
            errors={errors.recipient_name}
            required
          />
          <TextField
            name="postal_code"
            label="CEP"
            autoComplete="postal-code"
            inputMode="numeric"
            maxLength={9}
            placeholder="00000-000"
            className="sm:max-w-40"
            defaultValue={values.postal_code}
            errors={
              errors.postal_code ??
              (cepStatus === "notfound"
                ? [
                    "Não achamos esse CEP. Confira os números ou preencha o endereço à mão.",
                  ]
                : undefined)
            }
            description={
              cepStatus === "loading" ? "Buscando endereço..." : undefined
            }
            onBlur={(event) => lookupCep(event.target.value)}
            required
          />
          <TextField
            name="street"
            label="Rua"
            autoComplete="address-line1"
            value={address.street}
            onChange={change("street")}
            errors={errors.street}
            required
          />
          <div className="grid gap-5 sm:grid-cols-[10rem_1fr]">
            <TextField
              name="number"
              label="Número"
              autoComplete="address-line2"
              defaultValue={values.number}
              errors={errors.number}
              required
            />
            <TextField
              name="complement"
              label="Complemento (opcional)"
              defaultValue={values.complement}
              errors={errors.complement}
            />
          </div>
          <TextField
            name="neighborhood"
            label="Bairro"
            value={address.neighborhood}
            onChange={change("neighborhood")}
            errors={errors.neighborhood}
            required
          />
          <div className="grid gap-5 sm:grid-cols-[1fr_8rem]">
            <TextField
              name="city"
              label="Cidade"
              autoComplete="address-level2"
              value={address.city}
              onChange={change("city")}
              errors={errors.city}
              required
            />
            <Field data-invalid={errors.state ? true : undefined}>
              <FieldLabel htmlFor="state">Estado</FieldLabel>
              <NativeSelect
                id="state"
                name="state"
                autoComplete="address-level1"
                className="w-full"
                value={address.state}
                onChange={change("state")}
                aria-invalid={errors.state ? true : undefined}
                required
              >
                <NativeSelectOption value="" disabled>
                  UF
                </NativeSelectOption>
                {STATES.map((uf) => (
                  <NativeSelectOption key={uf} value={uf}>
                    {uf}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError
                errors={errors.state?.map((message) => ({ message }))}
              />
            </Field>
          </div>
        </FieldGroup>
      </FieldSet>

      <div className="flex flex-col gap-2 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {isDemo
            ? "Pré-venda demonstrativa: o preço é de teste e nada é cobrado."
            : "O pedido fica aguardando pagamento até ser confirmado."}
        </p>
        <Button type="submit" size="lg" disabled={pending}>
          {pending && <Spinner data-icon="inline-start" />}
          Colecionar por {price}
        </Button>
      </div>
    </form>
  )
}
