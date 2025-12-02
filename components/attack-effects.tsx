"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

type AttackType = "melee" | "spell" | "ability"
type Rarity = "common" | "rare" | "epic" | "legendary"

interface AttackEffectProps {
  type: AttackType
  rarity: Rarity
  onComplete?: () => void
}

// Color schemes based on rarity
const rarityColors = {
  common: "stroke-gray-400 fill-gray-400",
  rare: "stroke-blue-400 fill-blue-400",
  epic: "stroke-purple-500 fill-purple-500",
  legendary: "stroke-amber-400 fill-amber-400",
}

const rarityGlow = {
  common: "drop-shadow-[0_0_4px_rgba(156,163,175,0.5)]",
  rare: "drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]",
  epic: "drop-shadow-[0_0_12px_rgba(168,85,247,0.9)]",
  legendary: "drop-shadow-[0_0_16px_rgba(251,191,36,1)]",
}

export function AttackEffect({ type, rarity, onComplete }: AttackEffectProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onComplete?.()
    }, 600)
    return () => clearTimeout(timer)
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
      {type === "melee" && (
        <svg
          viewBox="0 0 100 100"
          className={cn(
            "w-24 h-24 animate-slash",
            rarityColors[rarity],
            rarityGlow[rarity]
          )}
        >
          {/* Sword slash arc */}
          <path
            d="M 20,80 Q 50,20 80,20"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            opacity="0.9"
          />
          <path
            d="M 25,75 Q 50,25 75,25"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />
        </svg>
      )}

      {type === "spell" && (
        <svg
          viewBox="0 0 100 100"
          className={cn(
            "w-32 h-32 animate-magic-burst",
            rarityColors[rarity],
            rarityGlow[rarity]
          )}
        >
          {/* Magic circle */}
          <circle cx="50" cy="50" r="30" strokeWidth="3" fill="none" opacity="0.8" />
          <circle cx="50" cy="50" r="20" strokeWidth="2" fill="none" opacity="0.6" />
          {/* Glyphs/runes */}
          <circle cx="50" cy="20" r="3" opacity="0.9" />
          <circle cx="80" cy="50" r="3" opacity="0.9" />
          <circle cx="50" cy="80" r="3" opacity="0.9" />
          <circle cx="20" cy="50" r="3" opacity="0.9" />
        </svg>
      )}

      {type === "ability" && (
        <svg
          viewBox="0 0 100 100"
          className={cn(
            "w-28 h-28 animate-impact",
            rarityColors[rarity],
            rarityGlow[rarity]
          )}
        >
          {/* Star burst */}
          <polygon
            points="50,10 60,40 90,40 65,60 75,90 50,70 25,90 35,60 10,40 40,40"
            strokeWidth="2"
            opacity="0.9"
          />
          {/* Inner explosion lines */}
          <line x1="50" y1="30" x2="50" y2="70" strokeWidth="3" opacity="0.7" />
          <line x1="30" y1="50" x2="70" y2="50" strokeWidth="3" opacity="0.7" />
          <line x1="35" y1="35" x2="65" y2="65" strokeWidth="2" opacity="0.5" />
          <line x1="65" y1="35" x2="35" y2="65" strokeWidth="2" opacity="0.5" />
        </svg>
      )}
    </div>
  )
}

// Simple damage number component - VTT style
interface DamageNumberProps {
  damage: number
  isCritical?: boolean
  onComplete?: () => void
}

export function VTTDamageNumber({ damage, isCritical = false, onComplete }: DamageNumberProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onComplete?.()
    }, 800)
    return () => clearTimeout(timer)
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
      <div
        className={cn(
          "font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-bounce-fade",
          isCritical
            ? "text-5xl text-yellow-400 animate-pulse"
            : "text-3xl text-red-500"
        )}
      >
        {damage > 0 ? `-${damage}` : `+${Math.abs(damage)}`}
      </div>
      {isCritical && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-300 text-xs font-bold animate-pulse">
          CRITICAL!
        </div>
      )}
    </div>
  )
}
