"use client";

import { useState, useEffect, useCallback } from "react";
import type { PackCard } from "@/lib/pack-opening-types";
import { RARITY_CONFIG } from "@/lib/pack-opening-types";

interface CardFlipRevealProps {
  card: PackCard;
  index: number;
  isActive: boolean;
  onFlipComplete: () => void;
  packImage?: string;
}

export function CardFlipReveal({
  card,
  index,
  isActive,
  onFlipComplete,
  packImage,
}: CardFlipRevealProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const [imgError, setImgError] = useState(false);
  const config = RARITY_CONFIG[card.rarity];

  useEffect(() => {
    if (isActive && !isFlipped) {
      // Delay flip based on card index for staggered reveal
      const flipDelay = 300;
      const timer = setTimeout(() => {
        setIsFlipped(true);
        setShowGlow(true);

        // Notify parent after flip animation completes
        setTimeout(() => {
          onFlipComplete();
        }, 600);

        // Hide glow after celebration
        setTimeout(() => {
          setShowGlow(false);
        }, config.celebrationDuration);
      }, flipDelay);

      return () => clearTimeout(timer);
    }
  }, [isActive, isFlipped, config.celebrationDuration, onFlipComplete]);

  return (
    <div
      className="relative perspective-1000"
      style={{
        transform: `translateY(${isActive ? 0 : 20}px)`,
        opacity: isActive || isFlipped ? 1 : 0.5,
        transition: "transform 0.3s ease-out, opacity 0.3s ease-out",
      }}
    >
      {/* Glow effect for rarity */}
      {showGlow && (
        <div
          className="absolute inset-0 rounded-xl blur-xl animate-pulse"
          style={{
            background: config.glowColor,
            transform: "scale(1.2)",
          }}
        />
      )}

      {/* Card container with 3D flip */}
      <div
        className="relative w-32 h-44 md:w-40 md:h-56 cursor-pointer preserve-3d transition-transform duration-500"
        style={{
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
        onClick={() => !isFlipped && isActive && setIsFlipped(true)}
      >
        {/* Card Back */}
        <div
          className="absolute inset-0 rounded-xl backface-hidden overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)",
            border: "2px solid #4c1d95",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          }}
        >
          {packImage ? (
            <img
              src={packImage}
              alt="Card back"
              className="w-full h-full object-cover scale-120"
            />
          ) : (
            <>
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-4xl">🎴</div>
              </div>
              <div className="absolute inset-2 border border-purple-500/30 rounded-lg" />
              <div className="absolute inset-4 border border-purple-500/20 rounded-lg" />
            </>
          )}
        </div>

        {/* Card Front */}
        <div
          className="absolute inset-0 rounded-xl backface-hidden overflow-hidden"
          style={{
            transform: "rotateY(180deg)",
            border: `2px solid ${config.color}`,
            boxShadow: showGlow
              ? `0 0 30px ${config.glowColor}, 0 10px 30px rgba(0,0,0,0.5)`
              : "0 10px 30px rgba(0,0,0,0.5)",
          }}
        >
          {/* Card Image */}
          <div className="relative w-full h-3/4 overflow-hidden bg-slate-900">
            {card.image && !imgError ? (
              <img
                src={card.image}
                alt={card.name}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${config.glowColor} 0%, rgba(15,23,42,0.95) 50%, ${config.glowColor} 100%)`,
                }}
              >
                <span
                  className="text-3xl font-bold uppercase tracking-wider"
                  style={{ color: config.color }}
                >
                  {card.rarity}
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  Image loading...
                </span>
              </div>
            )}

            {/* Rarity badge */}
            <div
              className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-bold uppercase"
              style={{ backgroundColor: config.color }}
            >
              {card.rarity}
            </div>
          </div>

          {/* Card Info */}
          <div className="h-1/4 bg-slate-950 p-2 flex flex-col items-center justify-center">
            {card.ticker ? (
              <p className="text-sm md:text-base font-bold text-white">
                {card.ticker}
              </p>
            ) : (
              <p
                className="text-xs font-bold uppercase"
                style={{ color: config.color }}
              >
                {card.rarity}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Confetti for rare+ cards */}
      {showGlow && config.confettiCount > 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {Array.from({ length: Math.min(config.confettiCount, 30) }).map(
            (_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-confetti"
                style={
                  {
                    backgroundColor: [
                      "#F59E0B",
                      "#8B5CF6",
                      "#3B82F6",
                      "#10B981",
                    ][i % 4],
                    left: "50%",
                    top: "50%",
                    animationDelay: `${i * 30}ms`,
                    "--x": `${(Math.random() - 0.5) * 200}px`,
                    "--y": `${-100 - Math.random() * 100}px`,
                  } as React.CSSProperties
                }
              />
            ),
          )}
        </div>
      )}

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        @keyframes confetti {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(var(--x), var(--y)) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
