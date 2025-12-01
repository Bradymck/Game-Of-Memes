"use client"
import { useState, useRef, useEffect } from "react"
import type React from "react"

import { cn } from "@/lib/utils"
import type { MemeCardData } from "@/lib/game-context"

interface HandCardProps {
  card: MemeCardData
  index: number
  totalCards: number
  isSelected?: boolean
  isPlayable?: boolean
  fanAngle: number
  fanOffsetY: number
  onSelect?: () => void
  onPlay?: () => void
}

const rarityColors = {
  common: "from-stone-600 to-stone-800",
  rare: "from-blue-600 to-blue-800",
  epic: "from-purple-600 to-purple-800",
  legendary: "from-amber-500 to-amber-700",
}

const rarityBorder = {
  common: "border-stone-400",
  rare: "border-blue-400",
  epic: "border-purple-400",
  legendary: "border-amber-300",
}

export function HandCard({
  card,
  index,
  totalCards,
  isSelected = false,
  isPlayable = true,
  fanAngle,
  fanOffsetY,
  onSelect,
  onPlay,
}: HandCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const startPosRef = useRef({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPosRef.current.x
      const deltaY = e.clientY - startPosRef.current.y
      setDragOffset({ x: deltaX, y: deltaY })
    }

    const handleMouseUp = () => {
      if (dragOffset.y < -80 && isPlayable) {
        onPlay?.()
      }
      setIsDragging(false)
      setDragOffset({ x: 0, y: 0 })
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragOffset.y, isPlayable, onPlay])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isPlayable) return
    e.preventDefault()
    startPosRef.current = { x: e.clientX, y: e.clientY }
    setIsDragging(true)
    onSelect?.()
  }

  const getTransform = () => {
    if (isDragging) {
      return `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(0deg) scale(1.1)`
    }
    if (isHovered) {
      return `rotate(${fanAngle}deg) translateY(${fanOffsetY - 20}px) scale(1.08)`
    }
    return `rotate(${fanAngle}deg) translateY(${fanOffsetY}px)`
  }

  return (
    <div
      ref={cardRef}
      className={cn(
        "absolute rounded-lg overflow-hidden select-none",
        "border-2 shadow-xl",
        rarityBorder[card.rarity],
        !isPlayable && "opacity-50 grayscale cursor-not-allowed",
        isPlayable && !isDragging && "cursor-grab",
        isDragging && "cursor-grabbing",
      )}
      style={{
        width: 80,
        height: 120,
        transition: isDragging ? "none" : "transform 0.2s ease-out, z-index 0s",
        transform: getTransform(),
        transformOrigin: "center 200px",
        zIndex: isDragging ? 200 : isHovered ? 100 : index,
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => !isDragging && setIsHovered(true)}
      onMouseLeave={() => !isDragging && setIsHovered(false)}
    >
      {/* Card Background */}
      <div className={cn("absolute inset-0 bg-gradient-to-b", rarityColors[card.rarity])} />

      {/* Mana Cost */}
      <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 border-2 border-blue-300 flex items-center justify-center shadow-md">
        <span className="text-white font-bold text-sm">{card.mana}</span>
      </div>

      {/* Card Art */}
      <div className="absolute inset-x-1.5 top-8 bottom-10 rounded overflow-hidden border border-black/30">
        <img src={card.image || "/placeholder.svg"} alt={card.name} className="w-full h-full object-cover" />
      </div>

      {/* Card Name */}
      <div className="absolute inset-x-0.5 bottom-5 bg-black/70 py-0.5">
        <p className="text-white font-semibold text-center truncate px-1 text-[9px]">{card.name}</p>
      </div>

      {/* Stats */}
      <div className="absolute inset-x-1 bottom-0.5 flex justify-between">
        <div className="w-5 h-5 rounded-full bg-gradient-to-b from-yellow-400 to-yellow-600 border border-yellow-300 flex items-center justify-center">
          <span className="text-black font-bold text-[10px]">{card.attack}</span>
        </div>
        <div className="w-5 h-5 rounded-full bg-gradient-to-b from-red-500 to-red-700 border border-red-400 flex items-center justify-center">
          <span className="text-white font-bold text-[10px]">{card.health}</span>
        </div>
      </div>

      {/* Legendary shine */}
      {card.rarity === "legendary" && <div className="absolute inset-0 legendary-shine pointer-events-none" />}

      {/* Drag indicator */}
      {isDragging && dragOffset.y < -30 && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-green-400 bg-black/80 px-2 py-0.5 rounded">
          Release to play!
        </div>
      )}

      {/* Simpler glow */}
      {isDragging && isPlayable && (
        <div
          className={cn(
            "absolute -inset-1 rounded-lg -z-10 blur-sm",
            dragOffset.y < -30 ? "bg-green-400/40" : "bg-amber-400/30",
          )}
        />
      )}
    </div>
  )
}
