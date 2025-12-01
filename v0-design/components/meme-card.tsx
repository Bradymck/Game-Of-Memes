"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Flame, Shield, Zap } from "lucide-react"

export interface MemeCardData {
  id: string
  name: string
  image: string
  rarity: "common" | "rare" | "epic" | "legendary"
  attack: number
  defense: number
  mana: number
  marketCap: string
  change24h: number
  ability?: string
}

interface MemeCardProps {
  card: MemeCardData
  isPlayable?: boolean
  isSelected?: boolean
  onClick?: () => void
  size?: "sm" | "md" | "lg"
}

const rarityColors = {
  common: "from-zinc-600 to-zinc-800",
  rare: "from-blue-600 to-blue-900",
  epic: "from-purple-600 to-purple-900",
  legendary: "from-amber-500 to-orange-700",
}

const rarityBorders = {
  common: "border-zinc-500",
  rare: "border-blue-500",
  epic: "border-purple-500",
  legendary: "border-amber-400",
}

const rarityGlow = {
  common: "",
  rare: "shadow-blue-500/20",
  epic: "shadow-purple-500/30",
  legendary: "shadow-amber-400/40 animate-pulse",
}

export function MemeCard({ card, isPlayable = true, isSelected, onClick, size = "md" }: MemeCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const sizeClasses = {
    sm: "w-24 h-36",
    md: "w-32 h-48",
    lg: "w-40 h-60",
  }

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border-2",
        sizeClasses[size],
        rarityBorders[card.rarity],
        isPlayable ? "hover:scale-110 hover:-translate-y-2" : "opacity-60 grayscale",
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105",
        isHovered && `shadow-xl ${rarityGlow[card.rarity]}`,
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Background */}
      <div className={cn("absolute inset-0 bg-gradient-to-b", rarityColors[card.rarity])} />

      {/* Mana Cost */}
      <div className="absolute top-1 left-1 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
        {card.mana}
      </div>

      {/* Market Trend */}
      <div
        className={cn(
          "absolute top-1 right-1 px-1.5 py-0.5 rounded text-xs font-mono flex items-center gap-0.5",
          card.change24h >= 0 ? "bg-green-500/80 text-white" : "bg-red-500/80 text-white",
        )}
      >
        {card.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(card.change24h)}%
      </div>

      {/* Card Image */}
      <div className="absolute inset-x-2 top-9 bottom-14 rounded-lg overflow-hidden bg-black/20">
        <img src={card.image || "/placeholder.svg"} alt={card.name} className="w-full h-full object-cover" />
      </div>

      {/* Card Name */}
      <div className="absolute bottom-8 inset-x-0 text-center">
        <h3 className="text-xs font-bold text-white px-1 truncate">{card.name}</h3>
        <p className="text-[10px] text-white/60 font-mono">{card.marketCap}</p>
      </div>

      {/* Stats */}
      <div className="absolute bottom-1 inset-x-1 flex justify-between px-1">
        <div className="flex items-center gap-0.5 bg-red-500 rounded px-1.5 py-0.5">
          <Flame className="w-3 h-3 text-white" />
          <span className="text-xs font-bold text-white">{card.attack}</span>
        </div>
        <div className="flex items-center gap-0.5 bg-blue-500 rounded px-1.5 py-0.5">
          <Shield className="w-3 h-3 text-white" />
          <span className="text-xs font-bold text-white">{card.defense}</span>
        </div>
      </div>

      {/* Legendary Effect */}
      {card.rarity === "legendary" && (
        <div className="absolute inset-0 bg-gradient-to-t from-amber-400/20 via-transparent to-amber-400/10 pointer-events-none" />
      )}

      {/* Ability Indicator */}
      {card.ability && (
        <div className="absolute top-9 left-1 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
          <Zap className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  )
}
