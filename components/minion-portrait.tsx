"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { AttackEffect, VTTDamageNumber } from "@/components/attack-effects"
import type { MemeCardData } from "@/lib/game-context"

interface MinionPortraitProps {
  card: MemeCardData
  isSelected?: boolean
  isTargetable?: boolean
  canAttack?: boolean
  onClick?: () => void
  onDragAttack?: (targetId: string | null) => void // Called when dragged to a target
  damageTaken?: number | null
  isDying?: boolean
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
  damageTaken,
  isDying = false,
}: MinionPortraitProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isOverTarget, setIsOverTarget] = useState(false);
  const [isAttacking, setIsAttacking] = useState(false);
  const [showDamage, setShowDamage] = useState<number | null>(null);
  const [showImpact, setShowImpact] = useState(false);
  const [showAttackSprite, setShowAttackSprite] = useState(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Determine attack type based on rarity (for when THIS card attacks others)
  const attackType = card.ability ? "ability" : (card.rarity === "common" || card.rarity === "rare" ? "melee" : "spell");

  // Show damage numbers and impact effect when THIS card is damaged
  useEffect(() => {
    console.log(`[Minion ${card.id}] damageTaken changed:`, damageTaken);
    if (damageTaken && damageTaken > 0) {
      console.log(`[Minion ${card.id}] Showing damage:`, damageTaken);
      setShowDamage(damageTaken);
      setShowImpact(true);
      setTimeout(() => setShowImpact(false), 400);
    }
  }, [damageTaken, card.id]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPosRef.current.x;
      const deltaY = e.clientY - startPosRef.current.y;
      setDragOffset({ x: deltaX, y: deltaY });

      // Clear all previous highlights first
      document.querySelectorAll('[data-minion-id], [data-hero-target]').forEach(el => {
        el.classList.remove('ring-4', 'ring-red-500', 'ring-opacity-80', 'animate-pulse');
      });

      // Get the card's current position (including drag offset)
      if (!cardRef.current) return;
      const cardRect = cardRef.current.getBoundingClientRect();
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const cardCenterY = cardRect.top + cardRect.height / 2;

      // Check if the CARD CENTER is hovering over a valid target
      const target = document.elementFromPoint(cardCenterX, cardCenterY);
      const targetCard = target?.closest('[data-minion-id]');
      const targetHero = target?.closest('[data-hero-target]');

      // Only highlight the SPECIFIC card/hero we're hovering over (not this card)
      if (targetCard) {
        const minionId = targetCard.getAttribute('data-minion-id');
        if (minionId !== card.id) {
          targetCard.classList.add('ring-4', 'ring-red-500', 'ring-opacity-80', 'animate-pulse');
          setIsOverTarget(true);
        } else {
          setIsOverTarget(false);
        }
      } else if (targetHero) {
        targetHero.classList.add('ring-4', 'ring-red-500', 'ring-opacity-80', 'animate-pulse');
        setIsOverTarget(true);
      } else {
        setIsOverTarget(false);
      }
    };

    const handleMouseUp = () => {
      // Clear all highlights
      document.querySelectorAll('[data-minion-id], [data-hero-target]').forEach(el => {
        el.classList.remove('ring-4', 'ring-red-500', 'ring-opacity-80', 'animate-pulse');
      });

      // Get the card's current position for drop detection
      if (!cardRef.current) return;
      const cardRect = cardRef.current.getBoundingClientRect();
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const cardCenterY = cardRect.top + cardRect.height / 2;

      // Check if the CARD CENTER is over an enemy target
      const target = document.elementFromPoint(cardCenterX, cardCenterY);
      const targetCard = target?.closest('[data-minion-id]');
      const targetHero = target?.closest('[data-hero-target]');

      // Only attack if canAttack is true!
      if (canAttack && onDragAttack) {
        // Attack animation!
        if (targetCard || targetHero) {
          const targetElement = (targetCard || targetHero) as HTMLElement;

          // Trigger attacker lunge animation + attack sprite
          setIsAttacking(true);
          setShowAttackSprite(true);
          setTimeout(() => {
            setIsAttacking(false);
            setShowAttackSprite(false);
          }, 600);

          // Target shake animation
          targetElement.classList.add('animate-shake');
          setTimeout(() => targetElement.classList.remove('animate-shake'), 300);

          // Execute attack after animation starts
          setTimeout(() => {
            if (targetCard) {
              const targetId = targetCard.getAttribute('data-minion-id');
              onDragAttack(targetId);
            } else if (targetHero) {
              onDragAttack(null); // null = attack hero
            }
          }, 200);
        }
      } else if (!canAttack && (targetCard || targetHero)) {
        // Can't attack - just do click behavior
        onClick?.();
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
    // Only allow drag if card can attack
    if (!canAttack) return;

    e.preventDefault();
    e.stopPropagation();
    startPosRef.current = { x: e.clientX, y: e.clientY };

    // Don't set isDragging yet - wait for movement in handleMouseMove
    // This allows clicks to work without being treated as drags

    const handleInitialMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startPosRef.current.x;
      const dy = moveEvent.clientY - startPosRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 5) {
        // Actual drag detected
        setIsDragging(true);
        document.removeEventListener('mousemove', handleInitialMove);
      }
    };

    const handleInitialUp = () => {
      document.removeEventListener('mousemove', handleInitialMove);
      document.removeEventListener('mouseup', handleInitialUp);
    };

    document.addEventListener('mousemove', handleInitialMove);
    document.addEventListener('mouseup', handleInitialUp);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger click if we're not in the middle of dragging
    if (isDragging) return;
    e.stopPropagation();
    onClick?.();
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative transition-all duration-200 group",
        canAttack && !isDragging && "cursor-grab hover:scale-110",
        isDragging && "cursor-grabbing scale-125 pointer-events-none",
        isSelected && "scale-110",
        !canAttack && "cursor-pointer",
        isAttacking && "animate-attack",
        isDying && "animate-death-dissolve pointer-events-none",
      )}
      style={{
        transform: isDragging ? `translate(${dragOffset.x}px, ${dragOffset.y}px)` : undefined,
        transition: isDragging ? 'none' : 'transform 0.2s',
        zIndex: isDragging ? 100 : 'auto',
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
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
          isTargetable && "ring-4 ring-red-600 ring-opacity-90 animate-pulse", // Brighter red
          canAttack && !isSelected && "ring-2 ring-green-500/50",
          card.rarity === "legendary" && "animate-glow-pulse",
        )}
      >
        {/* Burning overlay when dying */}
        {isDying && (
          <div className="absolute inset-0 z-50 pointer-events-none animate-burn-overlay">
            <div className="absolute inset-0 bg-gradient-radial from-transparent via-orange-600/60 to-red-900/90" />
          </div>
        )}
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

      {/* Attack Sprite when THIS card attacks */}
      {showAttackSprite && (
        <AttackEffect
          type={attackType}
          rarity={card.rarity}
          onComplete={() => setShowAttackSprite(false)}
        />
      )}

      {/* Impact Effect when THIS card is damaged */}
      {showImpact && (
        <AttackEffect
          type="ability"
          rarity={card.rarity}
          onComplete={() => setShowImpact(false)}
        />
      )}

      {/* VTT Damage Number */}
      {showDamage && (
        <VTTDamageNumber
          damage={showDamage}
          isCritical={card.rarity === "legendary"}
          onComplete={() => setShowDamage(null)}
        />
      )}
    </div>
  )
}
