'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import HeroPortrait from '@/components/HeroPortrait';
import { generateStarterDeck } from '@/lib/cards';
import { GameState, Player, BoardCard } from '@/lib/types';

function createInitialPlayer(id: string): Player {
  const deck = generateStarterDeck();
  const hand = deck.slice(0, 3);
  const remainingDeck = deck.slice(3);

  return {
    id,
    health: 30,
    maxHealth: 30,
    mana: 1,
    maxMana: 1,
    deck: remainingDeck,
    hand,
    board: [],
    graveyard: [],
  };
}

type AttackState = {
  attackerId: string | null;
  mode: 'idle' | 'selecting_target';
};

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [attackState, setAttackState] = useState<AttackState>({
    attackerId: null,
    mode: 'idle',
  });

  // Initialize game state on client only to avoid hydration mismatch
  useEffect(() => {
    const initialState = {
      player1: createInitialPlayer('player1'),
      player2: createInitialPlayer('player2'),
      turn: 'player1' as const,
      turnNumber: 1,
      phase: 'main' as const,
    };
    setGameState(initialState);
  }, []); // Only run once on mount

  // Don't render until state is initialized
  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading Game of Memes...</div>
      </div>
    );
  }

  const currentPlayer = gameState[gameState.turn];
  const opponent = gameState.turn === 'player1' ? gameState.player2 : gameState.player1;
  const currentPlayerId = gameState.turn;
  const opponentId = gameState.turn === 'player1' ? 'player2' : 'player1';

  const handlePlayCard = (cardId: string) => {
    const card = currentPlayer.hand.find(c => c.id === cardId);
    if (!card || card.cost > currentPlayer.mana) return;

    setGameState(prev => {
      if (!prev) return prev;

      const newPlayer = { ...currentPlayer };
      newPlayer.hand = newPlayer.hand.filter(c => c.id !== cardId);
      newPlayer.board.push({
        ...card,
        currentHealth: card.health,
        currentAttack: card.attack,
        canAttack: false,
        summoningSickness: true,
      });
      newPlayer.mana -= card.cost;

      return {
        ...prev,
        [prev.turn]: newPlayer,
      } as GameState;
    });
  };

  const handleSelectAttacker = (cardId: string) => {
    setAttackState({
      attackerId: cardId,
      mode: 'selecting_target',
    });
  };

  const handleAttackMinion = (targetId: string) => {
    if (!attackState.attackerId) return;

    setGameState(prev => {
      if (!prev) return prev;

      const newState = { ...prev };
      const attackingPlayer = newState[currentPlayerId];
      const defendingPlayer = newState[opponentId];

      const attacker = attackingPlayer.board.find(c => c.id === attackState.attackerId);
      const defender = defendingPlayer.board.find(c => c.id === targetId);

      if (!attacker || !defender) return prev;

      // Skip if already attacked (prevent double-click)
      if (!attacker.canAttack) return prev;

      // Deal damage
      attacker.currentHealth -= defender.currentAttack;
      defender.currentHealth -= attacker.currentAttack;

      // Mark attacker as used
      attacker.canAttack = false;

      // Remove dead minions
      attackingPlayer.board = attackingPlayer.board.filter(c => {
        if (c.currentHealth <= 0) {
          attackingPlayer.graveyard.push(c);
          return false;
        }
        return true;
      });

      defendingPlayer.board = defendingPlayer.board.filter(c => {
        if (c.currentHealth <= 0) {
          defendingPlayer.graveyard.push(c);
          return false;
        }
        return true;
      });

      return newState as GameState;
    });

    setAttackState({ attackerId: null, mode: 'idle' });
  };

  const handleAttackHero = () => {
    if (!attackState.attackerId) return;

    setGameState(prev => {
      if (!prev) return prev;

      const newState = { ...prev };
      const attackingPlayer = newState[currentPlayerId];
      const defendingPlayer = newState[opponentId];

      const attacker = attackingPlayer.board.find(c => c.id === attackState.attackerId);
      if (!attacker) return prev;

      // Skip if already attacked (prevent double-click)
      if (!attacker.canAttack) return prev;

      // Deal damage to hero
      defendingPlayer.health -= attacker.currentAttack;

      // Mark attacker as used
      attacker.canAttack = false;

      // Check for winner
      if (defendingPlayer.health <= 0) {
        newState.winner = currentPlayerId;
      }

      return newState as GameState;
    });

    setAttackState({ attackerId: null, mode: 'idle' });
  };

  const handleEndTurn = () => {
    setGameState(prev => {
      if (!prev) return prev;

      const nextTurn = prev.turn === 'player1' ? 'player2' : 'player1';
      const nextPlayer = prev[nextTurn];

      // Draw a card
      const newCard = nextPlayer.deck[0];
      const newHand = newCard ? [...nextPlayer.hand, newCard] : nextPlayer.hand;
      const newDeck = nextPlayer.deck.slice(1);

      // Increase max mana
      const newMaxMana = Math.min(nextPlayer.maxMana + 1, 10);

      // Remove summoning sickness and refresh attacks
      const newBoard = nextPlayer.board.map(c => ({
        ...c,
        summoningSickness: false,
        canAttack: true,
      }));

      return {
        ...prev,
        turn: nextTurn,
        turnNumber: prev.turnNumber + (nextTurn === 'player1' ? 1 : 0),
        [nextTurn]: {
          ...nextPlayer,
          hand: newHand,
          deck: newDeck,
          mana: newMaxMana,
          maxMana: newMaxMana,
          board: newBoard,
        },
      };
    });

    setAttackState({ attackerId: null, mode: 'idle' });
  };

  const handlePlayAgain = () => {
    setGameState({
      player1: createInitialPlayer('player1'),
      player2: createInitialPlayer('player2'),
      turn: 'player1',
      turnNumber: 1,
      phase: 'main',
    });
    setAttackState({ attackerId: null, mode: 'idle' });
  };

  // Win/Lose Screen
  if (gameState.winner) {
    const didWin = gameState.winner === 'player1';
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className={`text-6xl font-bold mb-4 ${didWin ? 'text-green-400' : 'text-red-400'}`}>
            {didWin ? '🎉 VICTORY! 🎉' : '💀 DEFEAT 💀'}
          </h1>
          <p className="text-2xl text-gray-300 mb-8">
            {didWin ? 'You crushed your opponent!' : 'Better luck next time...'}
          </p>
          <button
            onClick={handlePlayAgain}
            className="bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-lg font-bold text-xl transition-colors"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Game of Memes - TEST VERSION 2.0
        </h1>
        <p className="text-center text-gray-400 mt-2">Where Losers Balance the Meta</p>
      </div>

      <div className="max-w-7xl mx-auto space-y-6 mt-24">
        {/* Opponent Area */}
        <div className="bg-red-900/20 rounded-xl p-4 border-2 border-red-700/50 relative">
          {/* Opponent Hero - Centered at top */}
          <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 z-10">
            <HeroPortrait
              health={opponent.health}
              maxHealth={opponent.maxHealth}
              isOpponent={true}
              isTargetable={attackState.mode === 'selecting_target'}
              onClick={handleAttackHero}
            />
          </div>

          {/* Opponent Stats - Top Right */}
          <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
            <div className="text-lg text-gray-300">
              💎 <span className="font-bold text-blue-400">{opponent.mana}/{opponent.maxMana}</span>
            </div>
            <div className="text-sm text-gray-400">
              📚 {opponent.deck.length} | 🃏 {opponent.hand.length}
            </div>
          </div>

          {/* Opponent Board */}
          <div className="flex gap-2 justify-center min-h-[200px] items-center pt-8">
            {opponent.board.length === 0 ? (
              <p className="text-gray-500">Opponent's board is empty</p>
            ) : (
              opponent.board.map((card) => (
                <div
                  key={card.id}
                  onClick={() => attackState.mode === 'selecting_target' && handleAttackMinion(card.id)}
                  className={attackState.mode === 'selecting_target' ? 'cursor-crosshair' : ''}
                >
                  <Card
                    card={card}
                    isPlayable={attackState.mode === 'selecting_target'}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Turn Indicator */}
        <div className="text-center py-4">
          <div className="inline-block bg-purple-600 px-6 py-2 rounded-full">
            <span className="font-bold">
              {gameState.turn === 'player1' ? '👤 Your Turn' : '🤖 Opponent Turn'}
            </span>
            <span className="ml-4 text-sm opacity-80">Turn {gameState.turnNumber}</span>
          </div>
          {attackState.mode === 'selecting_target' ? (
            <div className="mt-2 space-y-1">
              <div className="text-yellow-400 animate-pulse font-bold">
                ⚔️ Select a target to attack!
              </div>
              <div className="text-xs text-gray-400">
                Click enemy minion to trade • Click enemy hero (pulsing red) to go face
              </div>
            </div>
          ) : (
            <div className="mt-2 text-xs text-gray-400">
              {currentPlayer.board.some(c => c.canAttack && !c.summoningSickness) ? (
                <span className="text-green-400">✓ You have minions ready to attack! Click them to select.</span>
              ) : currentPlayer.board.length > 0 ? (
                <span className="text-orange-400">⏳ Your minions have summoning sickness. End turn to wake them up.</span>
              ) : (
                <span>Play cards from your hand to summon minions</span>
              )}
            </div>
          )}
        </div>

        {/* Player Area */}
        <div className="bg-blue-900/20 rounded-xl p-4 border-2 border-blue-700/50 relative pb-24">
          {/* Player Board */}
          <div className="flex gap-2 justify-center min-h-[200px] items-center mb-4">
            {currentPlayer.board.length === 0 ? (
              <p className="text-gray-500">Your board is empty</p>
            ) : (
              currentPlayer.board.map((card) => (
                <div
                  key={card.id}
                  onClick={() => handleSelectAttacker(card.id)}
                  className="cursor-pointer"
                >
                  <Card
                    card={card}
                    isPlayable={card.canAttack && !card.summoningSickness}
                    isSelected={attackState.attackerId === card.id}
                  />
                </div>
              ))
            )}
          </div>

          {/* Player Hero - Centered at bottom */}
          <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 z-10">
            <HeroPortrait
              health={currentPlayer.health}
              maxHealth={currentPlayer.maxHealth}
              isOpponent={false}
            />
          </div>

          {/* End Turn Button - Bottom Right */}
          <div className="absolute bottom-4 right-4">
            <button
              onClick={handleEndTurn}
              className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-lg font-bold text-lg transition-colors shadow-lg hover:shadow-xl"
            >
              End Turn →
            </button>
          </div>

          {/* Player Stats - Bottom Left */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-2">
            <div className="text-lg text-gray-300">
              💎 <span className="font-bold text-blue-400">{currentPlayer.mana}/{currentPlayer.maxMana}</span>
            </div>
          </div>

          {/* Player Hand - Fanned out */}
          <div className="flex justify-center items-end mt-4 relative h-56">
            {currentPlayer.hand.map((card, index) => {
              const totalCards = currentPlayer.hand.length;
              const middleIndex = (totalCards - 1) / 2;
              const offsetFromCenter = index - middleIndex;

              // Fan effect: rotate and translate based on position
              const rotation = offsetFromCenter * 5; // degrees
              const yOffset = Math.abs(offsetFromCenter) * 8; // lower cards at edges
              const xSpacing = 40; // horizontal spacing

              return (
                <div
                  key={card.id}
                  className="absolute"
                  style={{
                    transform: `translateX(${offsetFromCenter * xSpacing}px) translateY(${yOffset}px) rotate(${rotation}deg)`,
                    zIndex: index,
                    transition: 'transform 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = `translateX(${offsetFromCenter * xSpacing}px) translateY(-20px) rotate(0deg)`;
                    e.currentTarget.style.zIndex = '100';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = `translateX(${offsetFromCenter * xSpacing}px) translateY(${yOffset}px) rotate(${rotation}deg)`;
                    e.currentTarget.style.zIndex = String(index);
                  }}
                >
                  <Card
                    card={card}
                    onClick={() => handlePlayCard(card.id)}
                    isPlayable={card.cost <= currentPlayer.mana}
                    isInHand={true}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="max-w-7xl mx-auto mt-8 text-center space-y-2">
        <div className="text-sm text-gray-400">
          <span className="text-blue-400 font-bold">💎 Mana:</span> Play cards that cost ≤ your mana
          <span className="mx-3">•</span>
          <span className="text-green-400 font-bold">⚔️ Attack:</span> Click your minion → Click enemy target
          <span className="mx-3">•</span>
          <span className="text-orange-400 font-bold">😴 Summoning Sickness:</span> Wait 1 turn after playing
        </div>
        <div className="text-xs text-gray-500">
          Tip: Minions that already attacked are dimmed and can't be selected again
        </div>
      </div>
    </div>
  );
}
