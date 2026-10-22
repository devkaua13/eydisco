"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import {
  CheckIcon,
  LinkIcon,
  LockIcon,
  PauseIcon,
  PlayIcon,
} from "lucide-react"

import { markPresence, react, sendMessage, startHouse } from "@/app/actions"
import { LiveTag, Tag, visibilityLabel } from "@/components/badges"
import { usePlayer, type LiveSource } from "@/components/player/player-provider"
import { TrackList } from "@/components/player/track-list"
import { UserAvatar } from "@/components/user-avatar"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Message, MessageContent, MessageHeader } from "@/components/ui/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDuration, formatTime, formatWhen } from "@/lib/format"
import type { House, HouseLive, HouseMessage, HouseReaction } from "@/lib/types"

const POLL_MS = 3_000
const PRESENCE_MS = 20_000
const EMOJIS = ["🔥", "❤️", "💃", "😮", "👏"]

type Floating = HouseReaction & { left: number }

// Segundos desde o início da faixa atual, pelo relógio do servidor, atualizado a cada segundo.
function useLivePosition(startedAt: string | undefined, skew: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  if (!startedAt) return 0
  return Math.max(0, (now + skew - Date.parse(startedAt)) / 1000)
}

export function HouseRoom({
  house,
  username,
  code,
}: {
  house: House
  username: string | null
  code?: string
}) {
  const router = useRouter()
  const query = code ? `?code=${encodeURIComponent(code)}` : ""
  const source: LiveSource = {
    kind: "house",
    id: `house:${house.slug}`,
    title: house.title,
    href: `/houses/${house.slug}`,
    endpoint: `/api/houses/${house.slug}/live${query}`,
  }
  const { live: playerLive, playing, playLive, toggle } = usePlayer()
  const joined = playerLive?.id === source.id

  const [state, setState] = useState<HouseLive | null>(null)
  const [skew, setSkew] = useState(0)
  const [messages, setMessages] = useState<HouseMessage[]>([])
  const [floating, setFloating] = useState<Floating[]>([])
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [pending, startTransition] = useTransition()
  const cursors = useRef({ reaction: 0, message: 0, loaded: false })
  const position = useLivePosition(state?.playback?.track_started_at, skew)

  const poll = useCallback(async () => {
    const params = new URLSearchParams(code ? { code } : {})
    if (cursors.current.loaded) {
      params.set("after_reaction", String(cursors.current.reaction))
      params.set("after_message", String(cursors.current.message))
    }
    let data: HouseLive
    try {
      const response = await fetch(`/api/houses/${house.slug}/live?${params}`, {
        cache: "no-store",
      })
      if (!response.ok) return
      data = await response.json()
    } catch {
      return
    }
    const firstLoad = !cursors.current.loaded
    cursors.current.loaded = true
    const lastReaction = data.reactions.at(-1)
    const lastMessage = data.messages.at(-1)
    if (lastReaction) cursors.current.reaction = lastReaction.id
    if (lastMessage) cursors.current.message = lastMessage.id

    setSkew(Date.parse(data.server_time) - Date.now())
    setState(data)
    if (data.messages.length) {
      setMessages((current) => {
        const seen = new Set(current.map((m) => m.id))
        return [...current, ...data.messages.filter((m) => !seen.has(m.id))]
      })
    }
    // Reações antigas não sobem na tela; só as que chegam com a sala aberta.
    if (!firstLoad && data.reactions.length) {
      const fresh = data.reactions.map((r) => ({
        ...r,
        left: 10 + Math.random() * 80,
      }))
      setFloating((current) => [...current, ...fresh].slice(-20))
    }
  }, [house.slug, code])

  useEffect(() => {
    const first = window.setTimeout(poll, 0)
    const timer = window.setInterval(poll, POLL_MS)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(timer)
    }
  }, [poll])

  // Quem está ouvindo e logado aparece na lista de participantes.
  useEffect(() => {
    if (!joined || !username) return
    markPresence(house.slug, code)
    const timer = window.setInterval(
      () => markPresence(house.slug, code),
      PRESENCE_MS
    )
    return () => window.clearInterval(timer)
  }, [joined, username, house.slug, code])

  const status = state?.status ?? house.status
  const playback = state?.playback
  const participants = state?.participants ?? []
  const loginHref = `/entrar?next=${encodeURIComponent(
    `/houses/${house.slug}${code ? `?convite=${code}` : ""}`
  )}`

  function act(action: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await action()
      setError(result.ok ? null : (result.error ?? null))
      if (result.ok) await poll()
    })
  }

  function onStart() {
    act(async () => {
      const result = await startHouse(house.slug)
      if (result.ok) router.refresh()
      return result
    })
  }

  function onSend(formData: FormData) {
    const text = String(formData.get("text") ?? "").trim()
    if (!text) return
    act(() => sendMessage(house.slug, text))
  }

  async function copyInvite() {
    const url = `${window.location.origin}/houses/${house.slug}?convite=${house.invite_code}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      <div className="flex flex-col gap-5 lg:col-span-7">
        {/* Foto da House com o título por cima; as reações sobem por ela. */}
        <section
          aria-labelledby="house-title"
          className="relative -mx-4 -mt-6 overflow-hidden sm:mx-0 sm:mt-0 sm:rounded-3xl"
        >
          <div className="relative aspect-[4/3] sm:aspect-[16/9]">
            {house.cover && (
              <Image
                src={house.cover}
                alt=""
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                loading="eager"
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden"
            >
              {floating.map((reaction) => (
                <span
                  key={reaction.id}
                  className="absolute bottom-10 animate-[float-up_2.4s_ease-out_forwards] text-4xl motion-reduce:hidden"
                  style={{ left: `${reaction.left}%` }}
                  onAnimationEnd={() =>
                    setFloating((current) =>
                      current.filter((r) => r.id !== reaction.id)
                    )
                  }
                >
                  {reaction.emoji}
                </span>
              ))}
            </div>
            <div className="absolute top-4 right-4">
              {status === "live" ? (
                <LiveTag />
              ) : (
                <Tag tone="muted">
                  {status === "ended" ? "Encerrada" : "Em breve"}
                </Tag>
              )}
            </div>
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4 sm:p-6">
              <h1
                id="house-title"
                className="text-2xl font-bold tracking-wide uppercase sm:text-4xl"
              >
                {house.title}
              </h1>
              <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-foreground/80">
                {status === "live" &&
                  `${participants.length} ${participants.length === 1 ? "pessoa" : "pessoas"} dentro, `}
                {visibilityLabel[house.visibility]}
                {house.visibility !== "public" && (
                  <LockIcon className="size-3.5 text-brand" aria-hidden />
                )}
                <span className="text-muted-foreground">
                  com {house.host}
                  {house.artist && (
                    <>
                      , ouvindo{" "}
                      <Link
                        href={`/artistas/${house.artist.slug}`}
                        className="underline underline-offset-4"
                      >
                        {house.artist.name}
                      </Link>
                    </>
                  )}
                </span>
              </p>
              {participants.length > 0 && (
                <div className="flex items-center -space-x-2">
                  {participants.slice(0, 5).map((name) => (
                    <UserAvatar key={name} username={name} className="size-8" />
                  ))}
                  {participants.length > 5 && (
                    <span className="grid size-8 place-items-center rounded-full bg-secondary text-xs ring-2 ring-background">
                      +{participants.length - 5}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <section
          aria-label="Tocando agora"
          className="flex flex-col gap-4 rounded-2xl bg-card p-4 ring-1 ring-white/5 sm:p-5"
        >
          {status === "live" && playback ? (
            <>
              <p className="text-[0.7rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                Tocando agora
              </p>
              <div className="flex items-center gap-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-surface">
                  {playback.track.release.cover && (
                    <Image
                      src={playback.track.release.cover}
                      alt=""
                      fill
                      sizes="3.5rem"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link
                    href={`/faixas/${playback.track.slug}`}
                    className="truncate font-semibold hover:underline"
                  >
                    {playback.track.title}
                  </Link>
                  <span className="truncate text-sm text-muted-foreground">
                    {playback.track.artist.name}, faixa{" "}
                    {playback.track.position} de {playback.track.release.title}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-foreground"
                    style={{
                      width: `${Math.min(100, (position / Math.max(1, playback.track.duration)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {formatDuration(
                      Math.min(position, playback.track.duration)
                    )}
                  </span>
                  <span>{formatDuration(playback.track.duration)}</span>
                </div>
              </div>
              <div className="flex items-center justify-center">
                {joined ? (
                  <Button
                    size="icon-lg"
                    onClick={toggle}
                    aria-label={playing ? "Pausar" : "Voltar a ouvir"}
                    className="size-14"
                  >
                    {playing ? <PauseIcon /> : <PlayIcon />}
                  </Button>
                ) : (
                  <Button size="lg" onClick={() => playLive(source)}>
                    <PlayIcon data-icon="inline-start" />
                    Entrar na sessão
                  </Button>
                )}
              </div>
            </>
          ) : status === "scheduled" ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-lg font-semibold first-letter:uppercase">
                {house.starts_at
                  ? `Começa ${formatWhen(house.starts_at)}`
                  : "Horário a definir"}
              </p>
              <p className="text-sm text-muted-foreground">
                Deixe esta página aberta: quando começar, é só entrar na sessão.
              </p>
              {house.is_host && (
                <Button onClick={onStart} disabled={pending}>
                  {pending && <Spinner data-icon="inline-start" />}
                  Começar agora
                </Button>
              )}
            </div>
          ) : (
            <p className="font-semibold">Esta sessão já terminou.</p>
          )}
        </section>

        <section aria-label="Reações" className="flex flex-col gap-2">
          <div className="flex justify-between gap-2 sm:justify-start">
            {EMOJIS.map((emoji) => (
              <Button
                key={emoji}
                variant="secondary"
                className="size-14 text-2xl"
                disabled={status !== "live" || !username || pending}
                onClick={() => act(() => react(house.slug, emoji))}
                aria-label={`Reagir com ${emoji}`}
              >
                {emoji}
              </Button>
            ))}
          </div>
          {!username && (
            <p className="text-sm text-muted-foreground">
              <Link
                href={loginHref}
                className="text-foreground underline underline-offset-4"
              >
                Entre
              </Link>{" "}
              para reagir e conversar.
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </section>

        {(house.description || house.invite_code) && (
          <section
            aria-label="Mensagem da House"
            className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-white/5 sm:p-5"
          >
            {house.description && (
              <>
                <h2 className="font-semibold">Mensagem da House</h2>
                <p className="text-sm leading-relaxed text-foreground/80">
                  {house.description}
                </p>
              </>
            )}
            {house.invite_code && (
              <Button
                variant="secondary"
                onClick={copyInvite}
                className="w-fit"
              >
                {copied ? (
                  <CheckIcon data-icon="inline-start" />
                ) : (
                  <LinkIcon data-icon="inline-start" />
                )}
                {copied ? "Link copiado" : "Copiar link de convite"}
              </Button>
            )}
          </section>
        )}
      </div>

      <Tabs defaultValue="chat" className="flex flex-col gap-3 lg:col-span-5">
        <TabsList className="w-full">
          <TabsTrigger value="chat">Conversa</TabsTrigger>
          <TabsTrigger value="people">
            Pessoas ({participants.length})
          </TabsTrigger>
          <TabsTrigger value="tracks">Faixas</TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <section
            aria-label="Conversa"
            className="flex h-[30rem] flex-col rounded-2xl bg-card ring-1 ring-white/5"
          >
            <MessageScrollerProvider autoScroll>
              <MessageScroller className="flex-1">
                <MessageScrollerViewport>
                  <MessageScrollerContent className="gap-3 p-4">
                    {messages.length === 0 && (
                      <p className="m-auto text-center text-sm text-muted-foreground">
                        Nenhuma mensagem ainda. Diga oi para a sala.
                      </p>
                    )}
                    {messages.map((message) => {
                      const mine = message.user === username
                      return (
                        <MessageScrollerItem
                          key={message.id}
                          messageId={String(message.id)}
                          scrollAnchor={mine}
                        >
                          <Message align={mine ? "end" : "start"}>
                            {!mine && (
                              <UserAvatar
                                username={message.user}
                                className="size-7 ring-0"
                              />
                            )}
                            <MessageContent>
                              {!mine && (
                                <MessageHeader>
                                  {message.user}
                                  <span className="ml-2 font-normal">
                                    {formatTime(message.created_at)}
                                  </span>
                                </MessageHeader>
                              )}
                              <Bubble
                                align={mine ? "end" : "start"}
                                variant={mine ? "default" : "secondary"}
                              >
                                <BubbleContent>{message.text}</BubbleContent>
                              </Bubble>
                            </MessageContent>
                          </Message>
                        </MessageScrollerItem>
                      )
                    })}
                  </MessageScrollerContent>
                </MessageScrollerViewport>
                <MessageScrollerButton />
              </MessageScroller>
            </MessageScrollerProvider>
            {username && status !== "ended" ? (
              // O React limpa o formulário depois da action, então o campo esvazia sozinho.
              <form action={onSend} className="flex gap-2 border-t p-3">
                <Input
                  name="text"
                  aria-label="Mensagem"
                  placeholder="Digite uma mensagem..."
                  maxLength={500}
                  autoComplete="off"
                  required
                  className="rounded-full"
                />
                <Button type="submit" disabled={pending}>
                  Enviar
                </Button>
              </form>
            ) : (
              <p className="border-t p-3 text-sm text-muted-foreground">
                {status === "ended" ? (
                  "A conversa fechou junto com a sessão."
                ) : (
                  <>
                    <Link
                      href={loginHref}
                      className="text-foreground underline underline-offset-4"
                    >
                      Entre
                    </Link>{" "}
                    para conversar com a sala.
                  </>
                )}
              </p>
            )}
          </section>
        </TabsContent>

        <TabsContent value="people">
          <ul className="flex flex-col gap-1 rounded-2xl bg-card p-2 ring-1 ring-white/5">
            {participants.length === 0 && (
              <li className="p-3 text-sm text-muted-foreground">
                Ninguém na sala ainda.
              </li>
            )}
            {participants.map((name) => (
              <li key={name}>
                <Link
                  href={`/perfil/${name}`}
                  className="flex items-center gap-3 rounded-xl p-2 hover:bg-secondary"
                >
                  <UserAvatar username={name} className="size-9 ring-0" />
                  <span className="text-sm font-medium">{name}</span>
                  {name === house.host && (
                    <Tag tone="muted" className="ml-auto">
                      Anfitrião
                    </Tag>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="tracks">
          <TrackList
            tracks={house.tracks}
            showArtist
            playable={false}
            highlight={playback?.track.slug ?? ""}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
