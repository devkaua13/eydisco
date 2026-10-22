import type { Metadata, Viewport } from "next"
import { Manrope } from "next/font/google"

import "./globals.css"
import { PlayerBar } from "@/components/player/player-bar"
import { PlayerProvider } from "@/components/player/player-provider"
import { SiteHeader } from "@/components/site-header"
import { TabBar } from "@/components/tab-bar"
import { getCurrentUser } from "@/lib/api"
import { cn } from "@/lib/utils"

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: { default: "eydisco", template: "%s | eydisco" },
  description:
    "Descubra artistas, colecione discos e entre em Houses para ouvir junto.",
}

export const viewport: Viewport = { themeColor: "#07060d" }

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await getCurrentUser()
  return (
    <html
      lang="pt-BR"
      className={cn("dark antialiased", "font-sans", manrope.variable)}
    >
      <body className="flex min-h-svh flex-col overflow-x-clip">
        <PlayerProvider>
          <SiteHeader user={user} />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-12 sm:px-6 sm:pt-10">
            {children}
          </main>
          <footer className="hidden border-t md:block">
            <p className="mx-auto max-w-6xl px-6 py-6 text-sm text-muted-foreground">
              Cada Disc sai numerado. O seu número fica na sua coleção.
            </p>
          </footer>
          <PlayerBar />
          <TabBar username={user?.username ?? null} />
        </PlayerProvider>
      </body>
    </html>
  )
}
