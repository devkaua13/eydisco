import type { OrderStatus, ReleaseStatus } from "@/lib/types"

const TIME_ZONE = "America/Sao_Paulo"

const price = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

export function formatPrice(value: string | number) {
  return price.format(Number(value))
}

const day = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  timeZone: TIME_ZONE,
})

const dayWithYear = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TIME_ZONE,
})

// "3 de novembro"; o ano só aparece quando não é o ano corrente.
export function formatDate(iso: string) {
  const date = new Date(iso)
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return (sameYear ? day : dayWithYear).format(date)
}

export function formatYear(iso: string) {
  return new Date(iso).getFullYear()
}

// Nº 007 de 500: o zero à esquerda segue a quantidade de dígitos da tiragem.
export function padSerial(serial: number, total: number) {
  return String(serial).padStart(String(total).length, "0")
}

export const releaseStatusLabel: Record<ReleaseStatus, string> = {
  upcoming: "Em breve",
  presale: "Pré-venda",
  released: "Lançado",
}

export const orderStatusLabel: Record<OrderStatus, string> = {
  pending: "Aguardando pagamento",
  paid: "Pago",
  shipped: "Enviado",
  delivered: "Entregue",
  canceled: "Cancelado",
}

// 3:07
export function formatDuration(seconds: number) {
  const total = Math.max(0, Math.floor(seconds))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}

const time = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
})

export function formatTime(iso: string) {
  return time.format(new Date(iso))
}

const weekday = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  timeZone: TIME_ZONE,
})

function dayKey(date: Date) {
  return date.toLocaleDateString("pt-BR", { timeZone: TIME_ZONE })
}

// "hoje às 21:00", "amanhã às 09:30", "sábado, 3 de novembro, às 20:00"
export function formatWhen(iso: string) {
  const date = new Date(iso)
  const today = new Date()
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
  if (dayKey(date) === dayKey(today)) return `hoje às ${formatTime(iso)}`
  if (dayKey(date) === dayKey(tomorrow)) return `amanhã às ${formatTime(iso)}`
  return `${weekday.format(date)}, ${formatDate(iso)}, às ${formatTime(iso)}`
}

// Tempo desde o evento, curto como nas referências: "agora", "5 min", "2 h", "3 d".
export function formatAgo(iso: string) {
  const minutes = Math.floor((Date.now() - Date.parse(iso)) / 60_000)
  if (minutes < 1) return "agora"
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h`
  return `${Math.floor(hours / 24)} d`
}
