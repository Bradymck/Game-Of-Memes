"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import type { MemeCardData } from "@/lib/game-context"

interface DraggableCardProps {
  card: MemeCardData;
  isPlayable: boolean;
  onPlay: () => void;
}

function DraggableCard({ card, isPlayable, onPlay }: DraggableCardProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });
  const cardPosRef = useRef({ x: 0, y: 0 });
  const originalPosRef = useRef({ x: 0, y: 0 }); // Store original position for snap-back

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPosRef.current.x;
      const deltaY = e.clientY - startPosRef.current.y;
      setDragOffset({ x: deltaX, y: deltaY });

      // Highlight play field when dragging up
      const playField = document.querySelector('[data-play-field]');
      if (deltaY < -120 && isPlayable) {
        playField?.classList.add('ring-4', 'ring-green-400', 'ring-opacity-60', 'bg-green-500/10');
      } else {
        playField?.classList.remove('ring-4', 'ring-green-400', 'ring-opacity-60', 'bg-green-500/10');
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const playField = document.querySelector('[data-play-field]');
      playField?.classList.remove('ring-4', 'ring-green-400', 'ring-opacity-60', 'bg-green-500/10');

      const finalDeltaY = e.clientY - startPosRef.current.y;
      const finalDeltaX = e.clientX - startPosRef.current.x;

      // If dragged up to play field, play the card!
      if (finalDeltaY < -120 && isPlayable) {
        onPlay();
        setDragOffset({ x: 0, y: 0 });
        setIsDragging(false);
        return;
      }

      // Update position - check if covering important UI
      const newX = cardPosRef.current.x + finalDeltaX;
      const newY = cardPosRef.current.y + finalDeltaY;

      // Check if card would overlap important UI elements
      const fieldElement = document.querySelector('[data-play-field]');
      const heroElement = document.querySelector('[data-player-hero]');

      // Get approximate card position
      const cardScreenX = e.clientX;
      const cardScreenY = e.clientY;

      // Check overlaps
      let coversImportantUI = false;

      if (fieldElement) {
        const fieldRect = fieldElement.getBoundingClientRect();
        if (
          cardScreenX > fieldRect.left &&
          cardScreenX < fieldRect.right &&
          cardScreenY > fieldRect.top &&
          cardScreenY < fieldRect.bottom
        ) {
          coversImportantUI = true;
        }
      }

      if (heroElement && !coversImportantUI) {
        const heroRect = heroElement.getBoundingClientRect();
        if (
          cardScreenX > heroRect.left &&
          cardScreenX < heroRect.right &&
          cardScreenY > heroRect.top &&
          cardScreenY < heroRect.bottom
        ) {
          coversImportantUI = true;
        }
      }

      // Snap back if covering UI or way off screen
      if (coversImportantUI || newY > 200 || newY < -200 || newX < -300 || newX > 600) {
        setPosition(originalPosRef.current);
        cardPosRef.current = originalPosRef.current;
      } else {
        // Move freely!
        setPosition({ x: newX, y: newY });
        cardPosRef.current = { x: newX, y: newY };
      }

      setDragOffset({ x: 0, y: 0 });
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, isPlayable, onPlay]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Can always drag to rearrange, even if not playable!
    e.preventDefault();
    startPosRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  };

  return (
    <div
      className={cn(
        "absolute w-28 h-40 rounded-lg border-2 shadow-xl cursor-grab transition-all",
        !isPlayable && "grayscale brightness-75 saturate-50",
        isDragging && "cursor-grabbing scale-110",
        card.rarity === "common" && "border-stone-500",
        card.rarity === "rare" && "border-blue-400",
        card.rarity === "epic" && "border-purple-400",
        card.rarity === "legendary" && "border-amber-400",
      )}
      style={{
        left: position.x + dragOffset.x,
        top: position.y + dragOffset.y,
        transition: isDragging ? 'none' : 'all 0.3s ease-out',
        zIndex: isDragging ? 9999 : 10, // Always on top!
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Card image */}
      {card.image && card.image !== '/placeholder.jpg' ? (
        <img src={card.image} alt={card.name} className="w-full h-full object-cover rounded-lg" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-violet-950/40 rounded-lg flex items-center justify-center">
          <div className="text-5xl opacity-20">👻</div>
        </div>
      )}

      {/* Mana cost */}
      <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 border-2 border-blue-300 flex items-center justify-center">
        <span className="text-white font-bold text-xs">{card.mana}</span>
      </div>

      {/* Stats */}
      <div className="absolute bottom-1 left-1 w-6 h-6 rounded-full bg-gradient-to-b from-yellow-400 to-yellow-600 border border-yellow-300 flex items-center justify-center">
        <span className="text-black font-bold text-[10px]">{card.attack}</span>
      </div>
      <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-gradient-to-b from-red-500 to-red-700 border border-red-400 flex items-center justify-center">
        <span className="text-white font-bold text-[10px]">{card.health}</span>
      </div>

      {/* Name - Hidden to keep cards clean */}

      {/* Drag hint */}
      {isDragging && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold bg-black/90 px-2 py-1 rounded">
          <span className={dragOffset.y < -100 ? "text-green-400" : "text-amber-400"}>
            {dragOffset.y < -100 ? "Release to play!" : "Drag to play or arrange"}
          </span>
        </div>
      )}
    </div>
  );
}

interface DraggableHandProps {
  cards: MemeCardData[];
  playerMana: number;
  isPlayerTurn: boolean;
  onPlayCard: (cardId: string) => void;
}

export function DraggableHand({ cards, playerMana, isPlayerTurn, onPlayCard }: DraggableHandProps) {
  return (
    <div className="relative w-full h-full">
      {/* Horizontal Hand Zone - Compact bottom strip */}
      <div className="absolute inset-0 bg-slate-900/80 rounded-lg border-2 border-amber-800/50 backdrop-blur-sm shadow-2xl">
        <div className="absolute -top-4 left-2 text-amber-200/40 text-[9px] italic">
          Drag to rearrange • Drag up to play
        </div>
      </div>

      {/* Cards (freely draggable within zone!) */}
      {cards.map((card, index) => {
        // Initialize cards in horizontal row with slight offset
        const initialX = 10 + index * 32;
        const initialY = 8;

        return (
          <div
            key={card.id}
            style={{
              position: 'absolute',
              left: initialX,
              top: initialY,
            }}
          >
            <DraggableCard
              card={card}
              isPlayable={card.mana <= playerMana && isPlayerTurn}
              onPlay={() => onPlayCard(card.id)}
            />
          </div>
        );
      })}
    </div>
  );
}
