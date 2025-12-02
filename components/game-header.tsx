"use client"

import { WalletButton } from "@/components/wallet-button"
import { SoulCounter } from "@/components/soul-counter"

export function GameHeader() {
  return (
    <div className="absolute top-0 left-0 right-0 z-50 px-8 py-4 bg-gradient-to-b from-black/60 to-transparent backdrop-blur-sm border-b border-purple-500/20">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo/Title */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Game of Memes
          </h1>
          <span className="text-xs text-purple-400/60 italic">Where Losers Balance the Meta</span>
        </div>

        {/* Right: Souls + Wallet */}
        <div className="flex items-center gap-4">
          <SoulCounter />
          <WalletButton />
        </div>
      </div>
    </div>
  )
}
