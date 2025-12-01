"use client"

import { cn } from "@/lib/utils"

interface HeroPortraitProps {
  health: number
  mana?: number
  maxMana?: number
  isPlayer?: boolean
  isTargetable?: boolean
  onClick?: () => void
  image?: string
}

export function HeroPortrait({
  health,
  mana,
  maxMana,
  isPlayer = false,
  isTargetable = false,
  onClick,
  image,
}: HeroPortraitProps) {
  return (
    <div className={cn("relative flex flex-col items-center", isTargetable && "cursor-pointer")} onClick={onClick}>
      {/* Hero Frame */}
      <div
        className={cn(
          "relative w-20 h-20 rounded-full overflow-hidden",
          "border-4 border-amber-600",
          "shadow-lg shadow-black/40",
          isTargetable && "ring-4 ring-red-500 ring-opacity-75 animate-pulse cursor-pointer",
        )}
      >
        {/* Inner gold ring */}
        <div className="absolute inset-1 rounded-full border-2 border-amber-400/50" />

        {/* Hero Image */}
        <div className="absolute inset-2 rounded-full overflow-hidden bg-gradient-to-b from-amber-900 to-amber-950">
          <img
            src={
              image ||
              `/placeholder.svg?height=80&width=80&query=${isPlayer ? "crypto trader hero diamond hands" : "evil bear market villain"}`
            }
            alt={isPlayer ? "Your Hero" : "Opponent"}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Health Shield */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
        <div className="relative">
          {/* Shield shape */}
          <div className="w-10 h-12 bg-gradient-to-b from-red-600 to-red-800 rounded-b-full border-2 border-red-400 shadow-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg drop-shadow-md">{health}</span>
          </div>
        </div>
      </div>

      {/* Mana Display (only for player) */}
      {isPlayer && mana !== undefined && maxMana !== undefined && (
        <div className="absolute -bottom-2 -right-8">
          <div className="w-10 h-10 rounded-full bg-gradient-to-b from-blue-500 to-blue-700 border-2 border-blue-300 shadow-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {mana}/{maxMana}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
