"use client"

import { cn } from "@/lib/utils"
import type { MemeCardData } from "@/lib/game-context"

interface MinionPortraitProps {
  card: MemeCardData
  isSelected?: boolean
  isTargetable?: boolean
  canAttack?: boolean
  onClick?: () => void
}

const rarityGlow = {
  common: "",
  rare: "shadow-blue-400/40",
  epic: "shadow-purple-400/50",
  legendary: "shadow-amber-400/60",
}

const rarityBorder = {
  common: "border-stone-500",
  rare: "border-blue-400",
  epic: "border-purple-400",
  legendary: "border-amber-400",
}

export function MinionPortrait({
  card,
  isSelected = false,
  isTargetable = false,
  canAttack = false,
  onClick,
}: MinionPortraitProps) {
  return (
    <div
      className={cn(
        "relative cursor-pointer transition-all duration-200 group",
        canAttack && "hover:scale-110",
        isSelected && "scale-110",
      )}
      onClick={onClick}
    >
      {/* Oval Portrait Frame */}
      <div
        className={cn(
          "relative w-16 h-20 rounded-[50%] overflow-hidden",
          "border-3 shadow-lg",
          rarityBorder[card.rarity],
          rarityGlow[card.rarity] && `shadow-xl ${rarityGlow[card.rarity]}`,
          isSelected && "ring-4 ring-green-400 ring-opacity-80",
          isTargetable && "ring-4 ring-red-500 ring-opacity-75 animate-pulse",
          canAttack && !isSelected && "ring-2 ring-green-500/50",
          card.rarity === "legendary" && "animate-glow-pulse",
        )}
      >
        {/* Gold inner frame */}
        <div className="absolute inset-0.5 rounded-[50%] border border-amber-500/30" />

        {/* Portrait Image */}
        <img src={card.image || "/placeholder.svg"} alt={card.name} className="w-full h-full object-cover" />

        {/* Legendary shine overlay */}
        {card.rarity === "legendary" && <div className="absolute inset-0 legendary-shine pointer-events-none" />}
      </div>

      {/* Attack Stat (bottom left) */}
      <div className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full bg-gradient-to-b from-yellow-400 to-yellow-600 border-2 border-yellow-300 flex items-center justify-center shadow-md">
        <span className="text-black font-bold text-sm">{card.attack}</span>
      </div>

      {/* Health Stat (bottom right) */}
      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-b from-red-500 to-red-700 border-2 border-red-400 flex items-center justify-center shadow-md">
        <span className="text-white font-bold text-sm">{card.health}</span>
      </div>

      {/* Ticker tooltip on hover */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-black/90 text-amber-400 text-xs px-2 py-1 rounded whitespace-nowrap font-mono">
          {card.ticker}
        </div>
      </div>
    </div>
  )
}
