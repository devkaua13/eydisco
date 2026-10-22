"use client"

import { useActionState, useState } from "react"
import {
  CameraIcon,
  CheckIcon,
  GemIcon,
  GlobeIcon,
  LockIcon,
  StarIcon,
} from "lucide-react"

import { createHouse, type FormState } from "@/app/actions"
import { FormAlert } from "@/components/form-fields"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const initialState: FormState = { errors: {}, values: {} }
const TITLE_MAX = 50

const types = [
  {
    value: "public",
    label: "Pública",
    description: "Qualquer pessoa pode entrar",
    icon: GlobeIcon,
  },
  {
    value: "private",
    label: "Privada",
    description: "Apenas convidados, pelo link",
    icon: LockIcon,
  },
  {
    value: "collector",
    label: "Collector",
    description: "Acesso para quem tem o Disc na coleção",
    icon: GemIcon,
  },
  {
    value: "artist",
    label: "Artista",
    description: "Criada por quem gerencia o artista",
    icon: StarIcon,
  },
]

function errorsOf(messages?: string[]) {
  return messages?.map((message) => ({ message }))
}

export function CreateHouseForm({
  discs,
  managedArtists,
}: {
  discs: { slug: string; title: string; artist: string }[]
  managedArtists: { name: string; slug: string }[]
}) {
  const [state, formAction, pending] = useActionState(createHouse, initialState)
  const { errors, values } = state
  const [preview, setPreview] = useState<string | null>(null)
  const [title, setTitle] = useState(values.title ?? "")
  const [when, setWhen] = useState(values.when || "now")

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <FormAlert
        errors={[...(errors.non_field_errors ?? []), ...(errors.detail ?? [])]}
      />

      {/* Foto da House: a área inteira é o seletor de arquivo. */}
      <label className="group relative grid aspect-[16/9] cursor-pointer place-items-center overflow-hidden rounded-2xl bg-card ring-1 ring-white/10 focus-within:ring-2 focus-within:ring-ring hover:ring-brand/50">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- prévia local do arquivo escolhido
          <img
            src={preview}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgb(139_92_246/0.45),transparent_65%)]" />
        )}
        <span className="relative flex flex-col items-center gap-2 text-sm text-foreground/80">
          <span className="grid size-12 place-items-center rounded-full bg-black/50 backdrop-blur">
            <CameraIcon className="size-5" aria-hidden />
          </span>
          {preview ? "Trocar foto" : "Escolher foto de capa"}
        </span>
        <input
          type="file"
          name="cover"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            setPreview(file ? URL.createObjectURL(file) : null)
          }}
        />
      </label>

      <FieldGroup>
        <Field data-invalid={errors.title ? true : undefined}>
          <FieldLabel htmlFor="title">Nome da House</FieldLabel>
          <Input
            id="title"
            name="title"
            placeholder="Ex.: Sexta 23h, só pedrada"
            maxLength={TITLE_MAX}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            aria-invalid={errors.title ? true : undefined}
            required
          />
          <FieldDescription className="text-right">
            {title.length}/{TITLE_MAX}
          </FieldDescription>
          <FieldError errors={errorsOf(errors.title)} />
        </Field>

        <Field data-invalid={errors.description ? true : undefined}>
          <FieldLabel htmlFor="description">
            Mensagem da House (opcional)
          </FieldLabel>
          <Textarea
            id="description"
            name="description"
            placeholder="Conte o clima da sessão para quem chegar."
            defaultValue={values.description}
            rows={3}
          />
          <FieldError errors={errorsOf(errors.description)} />
        </Field>

        <FieldSet>
          <FieldLegend>Tipo de House</FieldLegend>
          <div className="flex flex-col gap-2">
            {types.map((type) => {
              const disabled =
                type.value === "artist" && managedArtists.length === 0
              return (
                <label
                  key={type.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-4 rounded-xl bg-card p-4 ring-1 ring-white/10 has-checked:bg-brand/10 has-checked:ring-brand has-focus-visible:ring-2 has-focus-visible:ring-ring",
                    disabled && "cursor-not-allowed opacity-50"
                  )}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={type.value}
                    defaultChecked={
                      (values.visibility || "public") === type.value
                    }
                    disabled={disabled}
                    className="peer sr-only"
                  />
                  <type.icon
                    className="size-5 shrink-0 text-muted-foreground peer-checked:text-brand"
                    aria-hidden
                  />
                  <span className="flex flex-1 flex-col">
                    <span className="font-medium peer-checked:text-brand">
                      {type.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {disabled
                        ? "Disponível para contas de artista"
                        : type.description}
                    </span>
                  </span>
                  <CheckIcon
                    className="size-5 shrink-0 rounded-full bg-brand p-1 text-white opacity-0 peer-checked:opacity-100"
                    aria-hidden
                  />
                </label>
              )
            })}
          </div>
          <FieldError errors={errorsOf(errors.visibility)} />
        </FieldSet>

        <Field data-invalid={errors.release ? true : undefined}>
          <FieldLabel htmlFor="release">O que vai tocar</FieldLabel>
          <NativeSelect
            id="release"
            name="release"
            className="w-full"
            defaultValue={values.release ?? ""}
            required
          >
            <NativeSelectOption value="" disabled>
              Escolha um Disc
            </NativeSelectOption>
            {discs.map((disc) => (
              <NativeSelectOption key={disc.slug} value={disc.slug}>
                {disc.title}, de {disc.artist}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldDescription>
            A House toca o Disc inteiro, em ordem. Numa House Collector, quem
            tem este Disc pode entrar.
          </FieldDescription>
          <FieldError errors={errorsOf(errors.release)} />
        </Field>

        <FieldSet>
          <FieldLegend>Quando</FieldLegend>
          <div className="flex gap-2">
            {[
              { value: "now", label: "Começar agora" },
              { value: "later", label: "Programar" },
            ].map((option) => (
              <label
                key={option.value}
                className="cursor-pointer rounded-full bg-card px-4 py-2 text-sm ring-1 ring-white/10 has-checked:bg-secondary has-checked:ring-brand has-focus-visible:ring-2"
              >
                <input
                  type="radio"
                  name="when"
                  value={option.value}
                  checked={when === option.value}
                  onChange={() => setWhen(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
          {when === "later" && (
            <Field data-invalid={errors.starts_at ? true : undefined}>
              <FieldLabel htmlFor="starts_at" className="sr-only">
                Data e hora
              </FieldLabel>
              <Input
                id="starts_at"
                name="starts_at"
                type="datetime-local"
                defaultValue={values.starts_at}
                required
              />
              <FieldError errors={errorsOf(errors.starts_at)} />
            </Field>
          )}
        </FieldSet>
      </FieldGroup>

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending && <Spinner data-icon="inline-start" />}
        Criar House
      </Button>
    </form>
  )
}
