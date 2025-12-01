'use client';

import { motion } from 'framer-motion';

interface HeroPortraitProps {
  health: number;
  maxHealth: number;
  isOpponent?: boolean;
  isTargetable?: boolean;
  onClick?: () => void;
}

export default function HeroPortrait({
  health,
  maxHealth,
  isOpponent = false,
  isTargetable = false,
  onClick
}: HeroPortraitProps) {
  const healthPercent = (health / maxHealth) * 100;
  const isDamaged = health < maxHealth;
  const isCritical = health <= maxHealth * 0.3;

  return (
    <motion.div
      whileHover={isTargetable ? { scale: 1.05 } : {}}
      onClick={isTargetable ? onClick : undefined}
      className={`relative ${isTargetable ? 'cursor-pointer' : ''}`}
    >
      <div
        className={`
          relative w-32 h-40 rounded-2xl overflow-hidden
          bg-gradient-to-br ${isOpponent ? 'from-red-900 to-red-950' : 'from-blue-900 to-blue-950'}
          border-4 ${isOpponent ? 'border-red-600' : 'border-blue-600'}
          shadow-2xl
          ${isTargetable && 'ring-8 ring-red-500 ring-opacity-50 animate-pulse'}
        `}
      >
        {/* Hero Portrait/Avatar */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl">
            {isOpponent ? '🤖' : '👤'}
          </div>
        </div>

        {/* Health Bar Background */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-black/60 backdrop-blur-sm">
          {/* Health Bar Fill */}
          <div
            className={`h-full transition-all duration-300 ${
              isCritical
                ? 'bg-gradient-to-r from-red-600 to-red-500 animate-pulse'
                : isDamaged
                ? 'bg-gradient-to-r from-yellow-600 to-orange-500'
                : 'bg-gradient-to-r from-green-600 to-green-500'
            }`}
            style={{ width: `${healthPercent}%` }}
          />

          {/* Health Number */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Background glow for readability */}
              <div className="absolute inset-0 bg-black rounded-full blur-md opacity-50" />

              {/* Health text */}
              <div className="relative text-3xl font-bold text-white drop-shadow-lg">
                {health}
              </div>
            </div>
          </div>
        </div>

        {/* Armor/Shield indicator (future feature) */}
        {/* <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white border-2 border-gray-500">
          0
        </div> */}

        {/* Target indicator when attackable */}
        {isTargetable && (
          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
            <div className="text-white font-bold text-xl animate-bounce">
              ⚔️
            </div>
          </div>
        )}

        {/* Damage flash effect */}
        {isDamaged && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-red-600"
          />
        )}
      </div>

      {/* Hero name/class */}
      <div className="absolute -bottom-6 left-0 right-0 text-center">
        <div className="text-xs font-bold text-gray-400">
          {isOpponent ? 'OPPONENT' : 'YOU'}
        </div>
      </div>
    </motion.div>
  );
}
