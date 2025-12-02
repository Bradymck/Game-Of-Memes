"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface DamageNumberProps {
  damage: number
  onComplete?: () => void
}

export function DamageNumber({ damage, onComplete }: DamageNumberProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Hide and trigger completion after animation
    const timer = setTimeout(() => {
      setIsVisible(false)
      onComplete?.()
    }, 1000) // Match animation duration

    return () => clearTimeout(timer)
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none z-50 animate-damage-float">
      <div className={cn(
        "text-3xl font-black drop-shadow-lg",
        damage > 0 ? "text-red-500" : "text-green-500"
      )}>
        {damage > 0 ? `-${damage}` : `+${Math.abs(damage)}`}
      </div>
    </div>
  )
}
