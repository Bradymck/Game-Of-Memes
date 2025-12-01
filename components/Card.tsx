'use client';

import { motion } from 'framer-motion';
import { Card as CardType } from '@/lib/types';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  isPlayable?: boolean;
  isInHand?: boolean;
  isSelected?: boolean;
  position?: number;
}

export default function Card({ card, onClick, isPlayable = false, isInHand = false, isSelected = false, position = 0 }: CardProps) {
  const rarityColors = {
    common: 'from-gray-600 to-gray-800',
    rare: 'from-blue-600 to-blue-800',
    epic: 'from-purple-600 to-purple-800',
    legendary: 'from-orange-600 to-orange-900',
  };

  const rarityGlow = {
    common: 'shadow-gray-500/50',
    rare: 'shadow-blue-500/50',
    epic: 'shadow-purple-500/50',
    legendary: 'shadow-orange-500/50',
  };

  return (
    <motion.div
      initial={isInHand ? { y: 20, opacity: 0 } : { scale: 0 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={isPlayable ? { scale: 1.05, y: -10 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`
        relative w-32 h-48 rounded-xl overflow-hidden cursor-pointer
        bg-gradient-to-br ${rarityColors[card.rarity]}
        shadow-lg ${isPlayable ? `${rarityGlow[card.rarity]} hover:shadow-xl` : ''}
        ${!isPlayable && !isSelected && 'opacity-60 cursor-not-allowed'}
        ${isSelected && 'ring-4 ring-yellow-400 scale-105'}
      `}
      onClick={isPlayable ? onClick : undefined}
    >
      {/* Cost Badge */}
      <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white shadow-md z-10">
        {card.cost}
      </div>

      {/* Card Image Placeholder */}
      <div className="w-full h-24 bg-gradient-to-b from-black/40 to-transparent flex items-center justify-center">
        <span className="text-4xl">🃏</span>
      </div>

      {/* Card Name */}
      <div className="px-2 py-1 bg-black/70">
        <h3 className="text-xs font-bold text-white truncate text-center">{card.name}</h3>
      </div>

      {/* Stats */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-between px-3">
        {/* Attack */}
        <div className="w-7 h-7 rounded bg-red-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
          ⚔️{'currentAttack' in card ? card.currentAttack : card.attack}
        </div>

        {/* Health */}
        <div className={`w-7 h-7 rounded flex items-center justify-center font-bold text-white text-sm shadow-md ${
          'currentHealth' in card && card.currentHealth < card.health ? 'bg-red-600' : 'bg-green-600'
        }`}>
          ❤️{'currentHealth' in card ? card.currentHealth : card.health}
        </div>
      </div>

      {/* Description (if exists) */}
      {card.description && (
        <div className="absolute inset-x-0 bottom-10 px-2">
          <p className="text-[8px] text-white/80 text-center line-clamp-2 bg-black/50 rounded px-1 py-0.5">
            {card.description}
          </p>
        </div>
      )}

      {/* Rarity indicator */}
      <div className="absolute top-2 right-2">
        <div className={`w-2 h-2 rounded-full ${
          card.rarity === 'legendary' ? 'bg-orange-400' :
          card.rarity === 'epic' ? 'bg-purple-400' :
          card.rarity === 'rare' ? 'bg-blue-400' :
          'bg-gray-400'
        }`} />
      </div>
    </motion.div>
  );
}
