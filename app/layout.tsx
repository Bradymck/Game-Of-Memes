import type React from "react"
import type { Metadata } from "next"
import { Cinzel, Geist_Mono } from "next/font/google"
import { Providers } from "@/components/providers"
import "./globals.css"

const _cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Game of Memes | Where Losers Balance the Meta",
  description:
    "The only card game where losers vote on nerfs. Own your cards. Trade freely. Community-driven balance.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
