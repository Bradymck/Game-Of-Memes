"use client"

import { useGame } from "@/lib/game-context"
import { HeroPortrait } from "@/components/hero-portrait"
import { MinionPortrait } from "@/components/minion-portrait"
import { HandCard } from "@/components/hand-card"
import { cn } from "@/lib/utils"

export function GameBoard() {
  const {
    playerHand,
    playerField,
    opponentField,
    playerMana,
    maxPlayerMana,
    opponentMana,
    maxOpponentMana,
    playerHealth,
    opponentHealth,
    selectedCard,
    selectedAttacker,
    isPlayerTurn,
    selectCard,
    selectAttacker,
    attackTarget,
    attackHero,
    playCard,
    endTurn,
  } = useGame()

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Parchment Background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at center, 
              oklch(0.78 0.04 70) 0%, 
              oklch(0.68 0.05 65) 50%, 
              oklch(0.55 0.06 55) 100%
            )
          `,
        }}
      />

      {/* Subtle texture overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ornate Border Frame */}
      <div className="absolute inset-2 border-4 border-amber-700/60 rounded-lg pointer-events-none" />
      <div className="absolute inset-3 border-2 border-amber-600/40 rounded-lg pointer-events-none" />

      {/* Game Content - Using CSS Grid for precise Hearthstone layout */}
      <div className="relative h-full grid grid-rows-[1fr_auto_1fr] grid-cols-[80px_1fr_120px]">
        {/* ========== TOP ROW: Opponent Area ========== */}

        <div className="row-start-1 col-start-1 flex items-start justify-center pt-6">
          <div className="relative">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute w-10 h-14 rounded bg-gradient-to-b from-amber-800 to-amber-950 border-2 border-amber-600"
                style={{ top: i * -2, left: i * 1, zIndex: 5 - i }}
              />
            ))}
          </div>
        </div>

        {/* Opponent battlefield + hero area */}
        <div className="row-start-1 col-start-2 flex flex-col items-center justify-center gap-4">
          {/* Opponent Hero */}
          <HeroPortrait
            health={opponentHealth}
            isPlayer={false}
            isTargetable={!!selectedAttacker && opponentField.length === 0}
            onClick={() => selectedAttacker && opponentField.length === 0 && attackHero()}
          />

          {/* Opponent Minions */}
          <div className="flex items-center justify-center gap-2 min-h-[80px]">
            {opponentField.length === 0 ? (
              <div className="text-amber-800/40 text-sm italic">No minions</div>
            ) : (
              opponentField.map((card) => (
                <MinionPortrait
                  key={card.id}
                  card={card}
                  isTargetable={!!selectedAttacker}
                  onClick={() => selectedAttacker && attackTarget(card.id)}
                />
              ))
            )}
          </div>
        </div>

        <div className="row-start-1 col-start-3 flex items-start justify-center pt-6">
          <div className="flex flex-col items-center gap-1">
            <span className="text-amber-900 font-bold text-xs">
              {opponentMana}/{maxOpponentMana}
            </span>
            <div className="flex flex-wrap justify-center gap-0.5 w-12">
              {[...Array(maxOpponentMana)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-3 h-3 rounded-full border",
                    i < opponentMana
                      ? "bg-gradient-to-b from-blue-400 to-blue-600 border-blue-300"
                      : "bg-stone-600 border-stone-500",
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ========== MIDDLE ROW: Divider + End Turn ========== */}

        <div className="row-start-2 col-span-3 h-12 flex items-center justify-center relative px-4">
          {/* Divider line */}
          <div className="absolute inset-x-20 h-0.5 bg-gradient-to-r from-transparent via-amber-700/60 to-transparent" />

          {/* Center emblem */}
          <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-b from-amber-600 to-amber-800 border-2 border-amber-400 flex items-center justify-center shadow-lg">
            <span className="text-amber-200 text-base">⚔</span>
          </div>

          <div className="absolute right-4">
            <button
              onClick={endTurn}
              disabled={!isPlayerTurn}
              className={cn(
                "relative px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all",
                "border-2 shadow-lg",
                isPlayerTurn
                  ? "bg-gradient-to-b from-green-500 to-green-700 border-green-400 text-white hover:from-green-400 hover:to-green-600 active:scale-95"
                  : "bg-gradient-to-b from-stone-600 to-stone-800 border-stone-500 text-stone-400",
              )}
            >
              {isPlayerTurn ? "End Turn" : "Enemy Turn"}
            </button>
          </div>
        </div>

        {/* ========== BOTTOM ROW: Player Area ========== */}

        <div className="row-start-3 col-start-1 flex items-end justify-center pb-6">
          <div className="relative">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-10 h-14 rounded bg-gradient-to-b from-amber-700 to-amber-900 border-2 border-amber-500"
                style={{ bottom: i * 2, left: i * 1, zIndex: 8 - i }}
              />
            ))}
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-amber-900 font-bold text-xs">18</div>
          </div>
        </div>

        {/* Player battlefield + hero area */}
        <div className="row-start-3 col-start-2 flex flex-col items-center justify-center gap-4">
          {/* Player Minions */}
          <div className="flex items-center justify-center gap-2 min-h-[80px]">
            {playerField.length === 0 ? (
              <div className="text-amber-800/40 text-sm italic">
                {selectedCard ? "Drop here to play" : "No minions"}
              </div>
            ) : (
              playerField.map((card) => (
                <MinionPortrait
                  key={card.id}
                  card={card}
                  isSelected={selectedAttacker === card.id}
                  canAttack={card.canAttack && isPlayerTurn}
                  onClick={() => {
                    if (card.canAttack && isPlayerTurn) {
                      selectAttacker(selectedAttacker === card.id ? null : card.id)
                    }
                  }}
                />
              ))
            )}
          </div>

          {/* Player Hero */}
          <HeroPortrait health={playerHealth} mana={playerMana} maxMana={maxPlayerMana} isPlayer />
        </div>

        <div className="row-start-3 col-start-3 flex flex-col items-center justify-end pb-4 gap-2">
          {/* Mana display */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex flex-wrap justify-center gap-0.5 w-14">
              {[...Array(maxPlayerMana)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-3.5 h-3.5 rounded-full border",
                    i < playerMana
                      ? "bg-gradient-to-b from-blue-400 to-blue-600 border-blue-300 shadow-sm shadow-blue-400/50"
                      : "bg-stone-600 border-stone-500",
                  )}
                />
              ))}
            </div>
            <span className="text-amber-900 font-bold text-sm">
              {playerMana}/{maxPlayerMana}
            </span>
          </div>

          <div className="relative w-32 h-40">
            {playerHand.map((card, index) => {
              const totalCards = playerHand.length
              const centerIndex = (totalCards - 1) / 2
              const offsetFromCenter = index - centerIndex
              // Smoother fan: tighter angle, gentler arc
              const fanAngle = offsetFromCenter * (35 / Math.max(totalCards, 1))
              const fanOffsetY = Math.pow(Math.abs(offsetFromCenter), 1.5) * 6

              return (
                <HandCard
                  key={card.id}
                  card={card}
                  index={index}
                  totalCards={totalCards}
                  isSelected={selectedCard === card.id}
                  isPlayable={card.mana <= playerMana && isPlayerTurn}
                  fanAngle={fanAngle}
                  fanOffsetY={fanOffsetY}
                  onSelect={() => selectCard(card.id)}
                  onPlay={() => playCard(card.id)}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Attack Mode Indicator */}
      {selectedAttacker && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
          <div className="bg-red-900/90 text-red-100 px-4 py-2 rounded-lg border border-red-500 font-bold text-sm animate-pulse">
            Select a target to attack
          </div>
        </div>
      )}
    </div>
  )
}
