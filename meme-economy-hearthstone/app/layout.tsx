import type React from "react"
import type { Metadata } from "next"
import { Cinzel, Geist_Mono } from "next/font/google"
import "./globals.css"

const _cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MemeStone | Trade Memes. Win Crypto.",
  description:
    "The ultimate meme economy trading card game. Battle with legendary memes, stake your crypto, and become the meme lord.",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        {/* Analytics removed for v0 preview compatibility */}
      </body>
    </html>
  )
}
