// Formatos devolvidos pelo eydisco-api.

export type ReleaseStatus = "upcoming" | "presale" | "released"

export type OrderStatus =
  "pending" | "paid" | "shipped" | "delivered" | "canceled"

export type Page<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type ArtistSummary = {
  name: string
  slug: string
  avatar: string | null
}

export type Artist = ArtistSummary & {
  bio: string
  followers_count: number
  is_following: boolean
  releases: ReleaseSummary[]
  tracks: TrackSummary[]
  houses: HouseSummary[]
}

export type ReleaseSummary = {
  title: string
  slug: string
  cover: string | null
  status: ReleaseStatus
  presale_starts_at: string
  released_at: string
}

export type Edition = {
  id: number
  name: string
  price: string
  total_supply: number
  available: number
  includes: string[]
  is_demo: boolean
}

export type ReleaseListItem = ReleaseSummary & {
  description: string
  artist: ArtistSummary
  editions: Edition[]
  tracks_count: number
}

export type Extra = {
  id: number
  kind: "text" | "video" | "image" | "audio" | "link"
  title: string
  body: string
  url: string
  file: string | null
  owners_only: boolean
  locked: boolean
  track: string | null
}

export type Release = ReleaseListItem & {
  story: string
  tracks: TrackSummary[]
  extras: Extra[]
  my_items: { serial_number: number; total_supply: number; edition: string }[]
  houses: HouseSummary[]
}

export type TrackSummary = {
  slug: string
  title: string
  position: number
  duration: number
  audio: string
  release: ReleaseSummary
  artist: ArtistSummary
}

export type Track = TrackSummary & {
  story: string
  inspirations: string
  credits: { role: string; name: string }[]
  extras: Extra[]
  siblings: TrackSummary[]
}

export type Search = {
  q: string
  artists: ArtistSummary[]
  releases: ReleaseSummary[]
  tracks: TrackSummary[]
}

export type DropItem = {
  id: number
  kind: "artist" | "release" | "track"
  blurb: string
  artist: ArtistSummary | null
  release: ReleaseSummary | null
  release_artist: ArtistSummary | null
  track: TrackSummary | null
}

export type DropSummary = {
  title: string
  slug: string
  intro: string
  published_at: string
}

export type Drop = DropSummary & { items: DropItem[] }

export type Route = {
  featured: ReleaseListItem[]
  tracks: TrackSummary[]
  artists: ArtistSummary[]
  drop: Drop | null
}

// Bloco comum à Rádio e à House: a faixa atual e quando ela começou.
export type Playback = {
  track: TrackSummary
  track_started_at: string
  index: number
  next: TrackSummary | null
}

export type ShowSummary = {
  title: string
  slug: string
  description: string
  host_name: string
  host_artist: ArtistSummary | null
  starts_at: string
  ends_at: string
}

export type Show = ShowSummary & { tracks: TrackSummary[] }

export type Radio = {
  server_time: string
  show: Show | null
  playback: Playback | null
  upcoming: ShowSummary[]
}

export type HouseStatus = "scheduled" | "live" | "ended"

export type HouseVisibility = "public" | "private" | "collector" | "artist"

export type HouseSummary = {
  title: string
  slug: string
  description: string
  cover: string | null
  visibility: HouseVisibility
  host: string
  artist: ArtistSummary | null
  release: ReleaseSummary | null
  starts_at: string | null
  ends_at: string | null
  status: HouseStatus
  participants_count: number
  now_playing: { title: string; artist: string; position: number } | null
}

export type House = HouseSummary & {
  tracks: TrackSummary[]
  access: {
    can_enter: boolean
    reason: "private" | "collector" | "login" | null
  }
  is_host: boolean
  invite_code: string | null
}

export type Profile = {
  username: string
  name: string
  date_joined: string
  counts: { discs: number; houses_created: number; houses_joined: number }
  houses: HouseSummary[]
  activity: {
    kind: "collected" | "created_house" | "joined_house"
    at: string
    title: string
    slug: string
  }[]
}

export type HouseReaction = {
  id: number
  emoji: string
  user: string
  created_at: string
}
export type HouseMessage = {
  id: number
  text: string
  user: string
  created_at: string
}

export type HouseLive = {
  server_time: string
  status: HouseStatus
  starts_at: string | null
  playback: Playback | null
  participants: string[]
  reactions: HouseReaction[]
  messages: HouseMessage[]
}

export type Item = {
  id: number
  serial_number: number
  total_supply: number
  edition: string
  release: ReleaseSummary
  artist: ArtistSummary
  status: OrderStatus | null
  is_demo: boolean
  tracks: TrackSummary[]
  acquired_at: string
}

export type ShippingAddress = {
  recipient_name: string
  postal_code: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
}

export type Order = ShippingAddress & {
  id: number
  item: Item
  price: string
  status: OrderStatus
  created_at: string
}

export type User = {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  managed_artists?: { name: string; slug: string }[]
}

// Erros de validação do DRF: { campo: ["mensagem"] }.
export type FieldErrors = Record<string, string[]>
