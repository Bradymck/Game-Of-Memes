"use client";

import { useMemo, useEffect } from "react";
import { useGame } from "@/lib/game-context";
import { usePrivy } from "@privy-io/react-auth";
import { HeroPortrait } from "@/components/hero-portrait";
import { MinionPortrait } from "@/components/minion-portrait";
import { DraggableHand } from "@/components/draggable-hand";
import { GameOverScreen } from "@/components/game-over-screen";
import { ChatMenu } from "@/components/chat-menu";
import { ArcadeWalletButton } from "@/components/arcade-wallet-button";
import MemeBackground from "@/components/meme-background";
import { cn } from "@/lib/utils";

export function GameBoard() {
  const { user } = usePrivy();

  // Stable random positions for deck piles (don't regenerate on every render!)
  const deckPositions = useMemo(
    () =>
      Array.from({ length: 12 }, () => ({
        rotation: (Math.random() - 0.5) * 8,
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 4,
      })),
    [],
  );
  const {
    playerHand,
    playerField,
    playerDeck,
    playerGraveyard,
    opponentHand,
    opponentField,
    opponentDeck,
    opponentGraveyard,
    playerMana,
    maxPlayerMana,
    opponentMana,
    maxOpponentMana,
    playerHealth,
    opponentHealth,
    selectedCard,
    selectedAttacker,
    isPlayerTurn,
    gameOver,
    playerWon,
    cardsPlayed,
    damageDealt,
    lastDamage,
    dyingMinions,
    difficulty,
    selectCard,
    selectAttacker,
    attackTarget,
    attackHero,
    playCard,
    endTurn,
    resetGame,
    setDifficulty,
  } = useGame();

  // Debug logging for lastDamage
  useEffect(() => {
    if (lastDamage) {
      console.log("[GameBoard] lastDamage changed:", lastDamage);
    }
  }, [lastDamage]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Epic 3D Meme Background! */}
      <MemeBackground />

      {/* INSET Game Board - Pulled in from edges, room for decorations! */}
      <div className="absolute inset-0 pt-8 pb-8 px-16 z-10">
        {/* Game Table Surface */}
        <div className="relative h-full max-w-7xl mx-auto rounded-3xl border-4 border-amber-900/40 bg-gradient-to-b from-emerald-950/30 to-slate-900/50 shadow-2xl backdrop-blur-sm overflow-hidden">
          {/* Content Grid */}
          <div className="relative h-full grid grid-rows-[1fr_auto_1fr] grid-cols-[140px_1fr_140px] gap-4 p-8 z-20">
            {/* ========== TOP ROW: Opponent Area ========== */}

            {/* Opponent Deck & Graveyard (Top Left) */}
            <div className="row-start-1 col-start-1 flex flex-col items-center justify-start pt-4 gap-4">
              {/* Opponent Deck */}
              <div className="relative w-20 h-28">
                {deckPositions.map((pos, i) => (
                  <div
                    key={i}
                    className="absolute w-20 h-28 rounded-lg overflow-hidden border border-red-600/60 shadow-lg"
                    style={{
                      bottom: i * 1.5 + pos.y,
                      left: i * 0.5 + pos.x,
                      rotate: `${pos.rotation}deg`,
                      zIndex: 12 - i,
                    }}
                  >
                    <img
                      src="/vibe.png"
                      alt="card back"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>

              {/* Opponent Graveyard */}
              <div className="w-20 h-28 rounded-lg border border-dashed border-purple-500/30 bg-purple-950/10 flex items-center justify-center shadow-lg">
                {opponentGraveyard.length > 0 &&
                opponentGraveyard[opponentGraveyard.length - 1].image ? (
                  <img
                    src={opponentGraveyard[opponentGraveyard.length - 1].image}
                    alt="top graveyard card"
                    className="w-full h-full object-cover rounded-lg opacity-60"
                  />
                ) : (
                  <span className="text-purple-400/30 text-3xl">💀</span>
                )}
              </div>
            </div>

            {/* Opponent Center (Hero + Minions) */}
            <div className="row-start-1 col-start-2 flex flex-col items-center justify-start gap-6 pt-4">
              {/* Opponent Hero */}
              <HeroPortrait
                health={opponentHealth}
                mana={opponentMana}
                maxMana={maxOpponentMana}
                isPlayer={false}
                isTargetable={!!selectedAttacker}
                onClick={() => selectedAttacker && attackHero()}
                damageTaken={
                  lastDamage?.targetId === null ? lastDamage.amount : null
                }
              />

              {/* Opponent Minions */}
              <div className="flex items-center justify-center gap-3 min-h-[120px]">
                {opponentField.length === 0 ? (
                  <div className="text-amber-100/30 text-sm italic">
                    No minions
                  </div>
                ) : (
                  opponentField.map((card) => (
                    <MinionPortrait
                      key={card.id}
                      card={card}
                      isTargetable={!!selectedAttacker}
                      onClick={() => selectedAttacker && attackTarget(card.id)}
                      damageTaken={
                        lastDamage?.targetId === card.id
                          ? lastDamage.amount
                          : null
                      }
                      isDying={dyingMinions.includes(card.id)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Opponent Hand (Top Right) - MIRRORED TO LEFT! */}
            <div className="row-start-1 col-start-3 flex items-start justify-center pt-8">
              <div className="relative h-32 w-24">
                {[...Array(opponentHand.length)].map((_, i) => {
                  // Fan out to the LEFT (mirror of player hand)
                  const mid = (opponentHand.length - 1) / 2;
                  const rotation = (mid - i) * 12; // Reversed fan
                  const xOffset = (mid - i) * -8;
                  return (
                    <div
                      key={i}
                      className="absolute w-20 h-28 rounded-lg border-2 border-red-600/60 overflow-hidden shadow-lg"
                      style={{
                        transform: `translateX(${xOffset}px) rotate(${rotation}deg)`,
                        transformOrigin: "bottom center",
                        zIndex: 4 - i,
                        top: i * 3,
                      }}
                    >
                      <img
                        src="/vibe.png"
                        alt="opponent card"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ========== MIDDLE ROW: Battle Line ========== */}

            <div className="row-start-2 col-span-3 h-16 flex items-center justify-center relative">
              {/* Epic battle line */}
              <div className="absolute inset-x-12 h-1 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent shadow-lg shadow-amber-500/30" />

              {/* Center gem */}
              <div className="relative z-10 w-14 h-14 rounded-full bg-gradient-to-b from-amber-500 to-amber-800 border-3 border-amber-300 flex items-center justify-center shadow-xl">
                <span className="text-white text-2xl drop-shadow-lg">⚔️</span>
              </div>

              {/* Difficulty Selector (Left Side) */}
              <div className="absolute left-8 flex flex-col items-start gap-1">
                <span className="text-amber-200/60 text-xs uppercase tracking-wide font-bold">
                  AI Difficulty
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDifficulty("easy")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                      "border-2 shadow-lg",
                      difficulty === "easy"
                        ? "bg-gradient-to-b from-blue-500 to-blue-700 border-blue-400 text-white scale-105"
                        : "bg-gradient-to-b from-stone-600 to-stone-800 border-stone-500 text-stone-300 hover:scale-105 active:scale-95",
                    )}
                  >
                    Easy
                  </button>
                  <button
                    onClick={() => setDifficulty("normal")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                      "border-2 shadow-lg",
                      difficulty === "normal"
                        ? "bg-gradient-to-b from-yellow-500 to-yellow-700 border-yellow-400 text-white scale-105"
                        : "bg-gradient-to-b from-stone-600 to-stone-800 border-stone-500 text-stone-300 hover:scale-105 active:scale-95",
                    )}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => setDifficulty("hard")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                      "border-2 shadow-lg",
                      difficulty === "hard"
                        ? "bg-gradient-to-b from-red-500 to-red-700 border-red-400 text-white scale-105"
                        : "bg-gradient-to-b from-stone-600 to-stone-800 border-stone-500 text-stone-300 hover:scale-105 active:scale-95",
                    )}
                  >
                    Hard
                  </button>
                </div>
              </div>

              {/* End Turn Button */}
              <div className="absolute right-8">
                <button
                  onClick={endTurn}
                  disabled={!isPlayerTurn}
                  className={cn(
                    "px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all",
                    "border-3 shadow-xl",
                    isPlayerTurn
                      ? "bg-gradient-to-b from-green-500 to-green-700 border-green-400 text-white hover:from-green-400 hover:to-green-600 hover:scale-105 active:scale-95"
                      : "bg-gradient-to-b from-stone-700 to-stone-900 border-stone-600 text-stone-500 cursor-not-allowed",
                  )}
                >
                  {isPlayerTurn ? "End Turn" : "Enemy Turn..."}
                </button>
              </div>
            </div>

            {/* ========== BOTTOM ROW: Player Area ========== */}

            {/* Player Deck & Graveyard (Bottom Left) */}
            <div className="row-start-3 col-start-1 flex flex-col items-center justify-end pb-4 gap-4">
              {/* Player Graveyard */}
              <div className="w-20 h-28 rounded-lg border border-dashed border-purple-500/30 bg-purple-950/10 flex items-center justify-center shadow-lg">
                {playerGraveyard.length > 0 &&
                playerGraveyard[playerGraveyard.length - 1].image ? (
                  <img
                    src={playerGraveyard[playerGraveyard.length - 1].image}
                    alt="top graveyard card"
                    className="w-full h-full object-cover rounded-lg opacity-60"
                  />
                ) : (
                  <span className="text-purple-400/30 text-3xl">💀</span>
                )}
              </div>

              {/* Player Deck */}
              <div className="relative w-20 h-28">
                {deckPositions.map((pos, i) => (
                  <div
                    key={i}
                    className="absolute w-20 h-28 rounded-lg overflow-hidden border border-red-600/60 shadow-lg"
                    style={{
                      bottom: i * 1.5 + pos.y,
                      left: i * 0.5 + pos.x,
                      rotate: `${pos.rotation}deg`,
                      zIndex: 12 - i,
                    }}
                  >
                    <img
                      src="/vibe.png"
                      alt="card back"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Player Center (Minions + Hero) */}
            <div className="row-start-3 col-start-2 flex flex-col items-center justify-end gap-6 pb-4">
              {/* Player Minions - FULL WIDTH DROP ZONE */}
              <div
                className="flex items-center justify-center gap-3 min-h-[120px] w-full px-4 py-6 rounded-xl transition-all border-2 border-dashed border-transparent"
                data-play-field="true"
              >
                {playerField.length === 0 ? (
                  <div className="text-amber-100/30 text-sm italic">
                    {selectedCard ? "Drop here to play" : "No minions"}
                  </div>
                ) : playerField.length >= 7 ? (
                  <>
                    {playerField.map((card) => (
                      <MinionPortrait
                        key={card.id}
                        card={card}
                        isSelected={selectedAttacker === card.id}
                        canAttack={card.canAttack && isPlayerTurn}
                        onClick={() => {
                          if (card.canAttack && isPlayerTurn) {
                            selectAttacker(
                              selectedAttacker === card.id ? null : card.id,
                            );
                          }
                        }}
                        onDragAttack={(targetId) => {
                          if (card.canAttack && isPlayerTurn) {
                            selectAttacker(card.id);
                            if (targetId) {
                              attackTarget(targetId);
                            } else {
                              attackHero();
                            }
                          }
                        }}
                        isDying={dyingMinions.includes(card.id)}
                      />
                    ))}
                    <div className="absolute -top-6 text-red-400/70 text-xs font-bold">
                      Board Full! (7/7)
                    </div>
                  </>
                ) : (
                  playerField.map((card) => (
                    <MinionPortrait
                      key={card.id}
                      card={card}
                      isSelected={selectedAttacker === card.id}
                      canAttack={card.canAttack && isPlayerTurn}
                      onClick={() => {
                        if (card.canAttack && isPlayerTurn) {
                          selectAttacker(
                            selectedAttacker === card.id ? null : card.id,
                          );
                        }
                      }}
                      onDragAttack={(targetId) => {
                        if (card.canAttack && isPlayerTurn) {
                          selectAttacker(card.id);
                          if (targetId) {
                            attackTarget(targetId);
                          } else {
                            attackHero(); // Dragged to empty space = attack hero
                          }
                        }
                      }}
                      isDying={dyingMinions.includes(card.id)}
                    />
                  ))
                )}
              </div>

              {/* Player Hero */}
              <HeroPortrait
                health={playerHealth}
                mana={playerMana}
                maxMana={maxPlayerMana}
                isPlayer
                image={
                  user?.wallet?.address
                    ? `https://metadata.ens.domains/mainnet/avatar/${user.wallet.address.toLowerCase()}`
                    : undefined
                }
              />
            </div>
          </div>

          {/* Player Hand Zone - OUTSIDE GRID, Bottom Right Corner */}
          <div className="absolute bottom-12 right-2 w-96 h-28 z-[100]">
            <DraggableHand
              cards={playerHand}
              playerMana={playerMana}
              isPlayerTurn={isPlayerTurn}
              onPlayCard={playCard}
            />
          </div>
        </div>
      </div>

      {/* Attack Mode Indicator */}
      {selectedAttacker && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
          <div className="bg-red-900/95 text-red-100 px-6 py-3 rounded-xl border-2 border-red-500 font-bold text-base animate-pulse shadow-2xl">
            Drag to target or click enemy to attack
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameOver && playerWon !== null && (
        <GameOverScreen
          playerWon={playerWon}
          playerHealth={playerHealth}
          opponentHealth={opponentHealth}
          cardsPlayed={cardsPlayed}
          damageDealt={damageDealt}
          onPlayAgain={resetGame}
        />
      )}

      {/* Chat/Social Menu - Bottom Left */}
      <ChatMenu />

      {/* Arcade Wallet Button - Bottom Right */}
      <ArcadeWalletButton />
    </div>
  );
}
