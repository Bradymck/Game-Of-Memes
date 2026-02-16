"use client";
import { useState, useRef, useEffect } from "react";
import type React from "react";

import { cn } from "@/lib/utils";
import type { MemeCardData } from "@/lib/game-context";

interface HandCardProps {
  card: MemeCardData;
  index: number;
  totalCards: number;
  isSelected?: boolean;
  isPlayable?: boolean;
  fanAngle: number;
  fanOffsetY: number;
  onSelect?: () => void;
  onPlay?: () => void;
}

const rarityColors = {
  common: "from-stone-600 to-stone-800",
  rare: "from-blue-600 to-blue-800",
  epic: "from-purple-600 to-purple-800",
  legendary: "from-amber-500 to-amber-700",
};

const rarityBorder = {
  common: "border-stone-400",
  rare: "border-blue-400",
  epic: "border-purple-400",
  legendary: "border-amber-300",
};

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
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPosRef.current.x;
      const deltaY = e.clientY - startPosRef.current.y;
      setDragOffset({ x: deltaX, y: deltaY });

      // Check if CARD (not cursor) is over play field
      const playField = document.querySelector("[data-play-field]");
      if (playField && cardRef.current) {
        const cardRect = cardRef.current.getBoundingClientRect();
        const fieldRect = playField.getBoundingClientRect();

        // Check if card center overlaps with play field
        const cardCenterY = cardRect.top + cardRect.height / 2;
        const isOverField =
          cardCenterY < fieldRect.bottom && cardCenterY > fieldRect.top;

        if (isOverField && isPlayable) {
          playField.classList.add(
            "ring-4",
            "ring-green-400",
            "ring-opacity-60",
            "bg-green-500/10",
          );
        } else {
          playField.classList.remove(
            "ring-4",
            "ring-green-400",
            "ring-opacity-60",
            "bg-green-500/10",
          );
        }
      }
    };

    const handleMouseUp = () => {
      // Clear highlight
      const playField = document.querySelector("[data-play-field]");
      playField?.classList.remove(
        "ring-4",
        "ring-green-400",
        "ring-opacity-60",
        "bg-green-500/10",
      );

      // Check if card is over play field (not just cursor)
      if (playField && cardRef.current && isPlayable) {
        const cardRect = cardRef.current.getBoundingClientRect();
        const fieldRect = playField.getBoundingClientRect();
        const cardCenterY = cardRect.top + cardRect.height / 2;
        const isOverField =
          cardCenterY < fieldRect.bottom && cardCenterY > fieldRect.top;

        if (isOverField) {
          onPlay?.();
        }
      }

      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset.y, isPlayable, onPlay]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isPlayable) return;

    // Check if board is full (7 card limit like Hearthstone)
    const playField = document.querySelector("[data-play-field]");
    const minions = playField?.querySelectorAll("[data-minion-id]");
    if (minions && minions.length >= 7) {
      // Flash red to show board is full
      playField?.classList.add("ring-4", "ring-red-500", "ring-opacity-70");
      setTimeout(() => {
        playField?.classList.remove(
          "ring-4",
          "ring-red-500",
          "ring-opacity-70",
        );
      }, 500);
      return; // Don't allow drag if board full
    }

    e.preventDefault();
    startPosRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
    onSelect?.();
  };

  const getTransform = () => {
    if (isDragging) {
      return `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(0deg) scale(1.3)`; // Bigger zoom while dragging
    }
    if (isHovered) {
      // On hover: 1.5x angle spread, lift way higher, push out horizontally, scale up
      const hoverAngle = fanAngle * 1.5;
      const hoverX = fanAngle * 3; // Push cards apart horizontally based on their angle
      return `rotate(${hoverAngle}deg) translateY(${fanOffsetY - 50}px) translateX(${hoverX}px) scale(1.15)`; // Scale with purple shadow glow
    }
    return `rotate(${fanAngle}deg) translateY(${fanOffsetY}px)`;
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "absolute rounded-lg overflow-hidden select-none",
        "border-2 shadow-xl",
        rarityBorder[card.rarity],
        !isPlayable && "grayscale cursor-not-allowed brightness-75 saturate-50",
        isPlayable && !isDragging && "cursor-grab",
        isDragging && "cursor-grabbing",
        isHovered && "shadow-lg shadow-purple-500/30",
      )}
      style={{
        width: 100, // Fits layout
        height: 150, // Fits layout
        transition: isDragging
          ? "none"
          : "transform 0.2s ease-out, z-index 0s, box-shadow 0.2s ease-out",
        transform: getTransform(),
        transformOrigin: "center 200px",
        zIndex: isDragging ? 200 : isHovered ? 100 : index,
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => !isDragging && setIsHovered(true)}
      onMouseLeave={() => !isDragging && setIsHovered(false)}
    >
      {/* Card Background */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-b",
          rarityColors[card.rarity],
        )}
      />

      {/* Mana Cost */}
      <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 border-2 border-blue-300 flex items-center justify-center shadow-md">
        <span className="text-white font-bold text-sm">{card.mana}</span>
      </div>

      {/* Card Art - Full card like on board */}
      <div className="absolute inset-0 rounded-lg overflow-hidden">
        {card.image && card.image !== "/placeholder.jpg" ? (
          <img
            src={card.image}
            alt={card.name}
            className="w-full h-full object-cover"
          />
        ) : (
          // Mystical ghost card fallback
          <div className="w-full h-full bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-violet-950/40 relative overflow-hidden">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-purple-500/20 blur-xl animate-pulse" />
              <div
                className="absolute top-1/4 left-1/4 w-16 h-16 rounded-full bg-indigo-400/15 blur-lg animate-pulse"
                style={{ animationDelay: "0.5s" }}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-5xl opacity-20">👻</div>
            </div>
          </div>
        )}
      </div>

      {/* Card Name */}
      <div className="absolute inset-x-0.5 bottom-5 bg-black/70 py-0.5">
        <p className="text-white font-semibold text-center truncate px-1 text-[9px]">
          {card.name}
        </p>
      </div>

      {/* Stats */}
      <div className="absolute inset-x-1 bottom-0.5 flex justify-between">
        <div className="w-5 h-5 rounded-full bg-gradient-to-b from-yellow-400 to-yellow-600 border border-yellow-300 flex items-center justify-center">
          <span className="text-black font-bold text-[10px]">
            {card.attack}
          </span>
        </div>
        <div className="w-5 h-5 rounded-full bg-gradient-to-b from-red-500 to-red-700 border border-red-400 flex items-center justify-center">
          <span className="text-white font-bold text-[10px]">
            {card.health}
          </span>
        </div>
      </div>

      {/* Legendary shine */}
      {card.rarity === "legendary" && (
        <div className="absolute inset-0 legendary-shine pointer-events-none" />
      )}

      {/* Drag indicator */}
      {isDragging && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold bg-black/80 px-2 py-0.5 rounded">
          <span
            className={cn(
              dragOffset.y < -60 ? "text-green-400" : "text-amber-400",
            )}
          >
            {dragOffset.y < -60 ? "Release to play!" : "Drag up to play"}
          </span>
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
  );
}
