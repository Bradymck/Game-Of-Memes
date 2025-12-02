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
    <div
      className={cn("relative flex flex-col items-center", isTargetable && "cursor-pointer")}
      onClick={onClick}
      data-hero-target={isTargetable ? "true" : undefined}
      data-player-hero={isPlayer ? "true" : undefined}
    >
      {/* Hero Frame - Bigger! */}
      <div
        className={cn(
          "relative w-32 h-32 rounded-full overflow-hidden", // Bigger (was w-20 h-20)
          "border-4 border-amber-600",
          "shadow-xl shadow-black/50",
          isTargetable && "ring-4 ring-red-500 ring-opacity-75 animate-pulse cursor-pointer",
        )}
      >
        {/* Inner gold ring */}
        <div className="absolute inset-1 rounded-full border-2 border-amber-400/50" />

        {/* Hero Image - ENS Avatar or mystical ghost */}
        <div className="absolute inset-2 rounded-full overflow-hidden bg-gradient-to-b from-purple-900 to-purple-950">
          {image ? (
            <img
              src={image}
              alt={isPlayer ? "Your Hero" : "Opponent"}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hide broken image, show mystical ghost instead
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : null}
          {/* Mystical ghost hero fallback - always rendered, shown when no image */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br from-purple-800/60 via-indigo-900/50 to-violet-950/60",
            image && "hidden" // Hide if image is provided (will show if image fails to load)
          )}>
            {/* Swirly ethereal effect */}
            <div className="absolute inset-0 opacity-40">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-purple-400/30 blur-2xl animate-pulse" />
              <div className="absolute top-1/4 left-1/4 w-16 h-16 rounded-full bg-indigo-300/20 blur-xl animate-pulse" style={{ animationDelay: '0.7s' }} />
            </div>
            {/* Hero ghost */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-5xl opacity-30">
                {isPlayer ? "🧙" : "👤"}
              </div>
            </div>
          </div>
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
