"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import type { MemeCardData } from "@/lib/game-context"

interface MinionPortraitProps {
  card: MemeCardData
  isSelected?: boolean
  isTargetable?: boolean
  canAttack?: boolean
  onClick?: () => void
  onDragAttack?: (targetId: string | null) => void // Called when dragged to a target
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
  onDragAttack,
}: MinionPortraitProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isOverTarget, setIsOverTarget] = useState(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPosRef.current.x;
      const deltaY = e.clientY - startPosRef.current.y;
      setDragOffset({ x: deltaX, y: deltaY });

      // Check if hovering over a valid target
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const targetCard = target?.closest('[data-minion-id]');
      const targetHero = target?.closest('[data-hero-target]');

      setIsOverTarget(!!(targetCard || targetHero));

      // Highlight all valid targets
      document.querySelectorAll('[data-minion-id]').forEach(el => {
        if (el.getAttribute('data-minion-id') !== card.id) {
          el.classList.add('ring-4', 'ring-green-400', 'ring-opacity-70');
        }
      });
      document.querySelectorAll('[data-hero-target]').forEach(el => {
        el.classList.add('ring-4', 'ring-green-400', 'ring-opacity-70');
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Clear all highlights
      document.querySelectorAll('[data-minion-id], [data-hero-target]').forEach(el => {
        el.classList.remove('ring-4', 'ring-green-400', 'ring-opacity-70');
      });

      // Check if we're over an enemy target (with forgiving hit detection)
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const targetCard = target?.closest('[data-minion-id]');
      const targetHero = target?.closest('[data-hero-target]');

      if (onDragAttack) {
        if (targetCard) {
          const targetId = targetCard.getAttribute('data-minion-id');
          onDragAttack(targetId);
        } else if (targetHero) {
          onDragAttack(null); // null = attack hero
        }
      }

      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });
      setIsOverTarget(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onDragAttack, card.id]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canAttack) {
      onClick?.();
      return;
    }
    e.preventDefault();
    startPosRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  };

  return (
    <div
      className={cn(
        "relative transition-all duration-200 group",
        canAttack && !isDragging && "cursor-grab hover:scale-110",
        isDragging && "cursor-grabbing scale-125",
        isSelected && "scale-110",
        !canAttack && "cursor-pointer",
      )}
      style={{
        transform: isDragging ? `translate(${dragOffset.x}px, ${dragOffset.y}px)` : undefined,
        transition: isDragging ? 'none' : 'transform 0.2s',
        zIndex: isDragging ? 100 : 'auto',
      }}
      onClick={!canAttack ? onClick : undefined}
      onMouseDown={canAttack ? handleMouseDown : undefined}
      data-minion-id={card.id}
    >
      {/* Drag indicator arrow */}
      {isDragging && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className={cn(
            "px-3 py-1 rounded-full text-xs font-bold",
            isOverTarget
              ? "bg-green-500 text-white"
              : "bg-amber-500 text-white animate-pulse"
          )}>
            {isOverTarget ? "Release to attack!" : "Drag to target"}
          </div>
        </div>
      )}
      {/* Card Frame (rectangular like trading cards) */}
      <div
        className={cn(
          "relative w-24 h-34 rounded-lg overflow-hidden", // Sized to fit layout
          "border-2 shadow-lg",
          rarityBorder[card.rarity],
          rarityGlow[card.rarity] && `shadow-xl ${rarityGlow[card.rarity]}`,
          isSelected && "ring-4 ring-green-400 ring-opacity-80",
          isTargetable && "ring-4 ring-red-500 ring-opacity-75 animate-pulse",
          canAttack && !isSelected && "ring-2 ring-green-500/50",
          card.rarity === "legendary" && "animate-glow-pulse",
        )}
      >
        {/* Inner frame */}
        <div className="absolute inset-0.5 rounded-lg border border-amber-500/20" />

        {/* Portrait Image */}
        {card.image && card.image !== '/placeholder.jpg' ? (
          <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
        ) : (
          // Mystical ghost card fallback
          <div className="w-full h-full bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-violet-950/40 relative overflow-hidden">
            {/* Swirly ethereal effect */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-purple-500/20 blur-2xl animate-pulse" />
              <div className="absolute top-1/3 left-1/3 w-24 h-24 rounded-full bg-indigo-400/15 blur-xl animate-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="absolute bottom-1/3 right-1/3 w-20 h-20 rounded-full bg-violet-500/15 blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            {/* Ghost silhouette */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl opacity-20">👻</div>
            </div>
            {/* Mystical sparkles */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-purple-500/5 to-transparent animate-pulse" />
          </div>
        )}

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
