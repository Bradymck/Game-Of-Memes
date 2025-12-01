'use client';

import { useState } from 'react';
import Card from '@/components/Card';
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
  const [gameState, setGameState] = useState<GameState>({
    player1: createInitialPlayer('player1'),
    player2: createInitialPlayer('player2'),
    turn: 'player1',
    turnNumber: 1,
    phase: 'main',
  });

  const [attackState, setAttackState] = useState<AttackState>({
    attackerId: null,
    mode: 'idle',
  });

  const currentPlayer = gameState[gameState.turn];
  const opponent = gameState.turn === 'player1' ? gameState.player2 : gameState.player1;
  const currentPlayerId = gameState.turn;
  const opponentId = gameState.turn === 'player1' ? 'player2' : 'player1';

  const handlePlayCard = (cardId: string) => {
    const card = currentPlayer.hand.find(c => c.id === cardId);
    if (!card || card.cost > currentPlayer.mana) return;

    setGameState(prev => {
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
        [gameState.turn]: newPlayer,
      };
    });
  };

  const handleSelectAttacker = (cardId: string) => {
    const attacker = currentPlayer.board.find(c => c.id === cardId);
    if (!attacker || !attacker.canAttack || attacker.summoningSickness) return;

    setAttackState({
      attackerId: cardId,
      mode: 'selecting_target',
    });
  };

  const handleAttackMinion = (targetId: string) => {
    if (!attackState.attackerId) return;

    setGameState(prev => {
      const newState = { ...prev };
      const attackingPlayer = newState[currentPlayerId];
      const defendingPlayer = newState[opponentId];

      const attacker = attackingPlayer.board.find(c => c.id === attackState.attackerId);
      const defender = defendingPlayer.board.find(c => c.id === targetId);

      if (!attacker || !defender) return prev;

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

      return newState;
    });

    setAttackState({ attackerId: null, mode: 'idle' });
  };

  const handleAttackHero = () => {
    if (!attackState.attackerId) return;

    setGameState(prev => {
      const newState = { ...prev };
      const attackingPlayer = newState[currentPlayerId];
      const defendingPlayer = newState[opponentId];

      const attacker = attackingPlayer.board.find(c => c.id === attackState.attackerId);
      if (!attacker) return prev;

      // Deal damage to hero
      defendingPlayer.health -= attacker.currentAttack;

      // Mark attacker as used
      attacker.canAttack = false;

      // Check for winner
      if (defendingPlayer.health <= 0) {
        newState.winner = currentPlayerId;
      }

      return newState;
    });

    setAttackState({ attackerId: null, mode: 'idle' });
  };

  const handleEndTurn = () => {
    setGameState(prev => {
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
          Game of Memes
        </h1>
        <p className="text-center text-gray-400 mt-2">Where Losers Balance the Meta</p>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Opponent Area */}
        <div className="bg-red-900/20 rounded-xl p-4 border-2 border-red-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleAttackHero}
                disabled={attackState.mode !== 'selecting_target'}
                className={`text-2xl font-bold px-4 py-2 rounded-lg transition-all ${
                  attackState.mode === 'selecting_target'
                    ? 'bg-red-600 hover:bg-red-700 cursor-pointer ring-4 ring-red-400 animate-pulse'
                    : 'bg-transparent'
                }`}
              >
                ❤️ {opponent.health}/{opponent.maxHealth}
              </button>
              <div className="text-lg">
                💎 {opponent.mana}/{opponent.maxMana}
              </div>
            </div>
            <div className="text-sm text-gray-400">
              Deck: {opponent.deck.length} | Hand: {opponent.hand.length}
            </div>
          </div>

          {/* Opponent Board */}
          <div className="flex gap-2 justify-center min-h-[200px] items-center">
            {opponent.board.length === 0 ? (
              <p className="text-gray-500">No cards on board</p>
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
          {attackState.mode === 'selecting_target' && (
            <div className="mt-2 text-yellow-400 animate-pulse">
              ⚔️ Select a target to attack!
            </div>
          )}
        </div>

        {/* Player Area */}
        <div className="bg-blue-900/20 rounded-xl p-4 border-2 border-blue-700/50">
          {/* Player Board */}
          <div className="flex gap-2 justify-center min-h-[200px] items-center mb-4">
            {currentPlayer.board.length === 0 ? (
              <p className="text-gray-500">No cards on board</p>
            ) : (
              currentPlayer.board.map((card) => (
                <div
                  key={card.id}
                  onClick={() => handleSelectAttacker(card.id)}
                  className={card.canAttack && !card.summoningSickness ? 'cursor-pointer' : ''}
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

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold">
                ❤️ {currentPlayer.health}/{currentPlayer.maxHealth}
              </div>
              <div className="text-lg">
                💎 {currentPlayer.mana}/{currentPlayer.maxMana}
              </div>
            </div>
            <button
              onClick={handleEndTurn}
              className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-bold transition-colors"
            >
              End Turn →
            </button>
          </div>

          {/* Player Hand */}
          <div className="flex gap-3 justify-center flex-wrap">
            {currentPlayer.hand.map((card) => (
              <Card
                key={card.id}
                card={card}
                onClick={() => handlePlayCard(card.id)}
                isPlayable={card.cost <= currentPlayer.mana}
                isInHand={true}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="max-w-7xl mx-auto mt-8 text-center text-gray-400 text-sm">
        <p>Play cards from hand • Click your minions to attack • Click enemy minions or hero to target • End turn when done</p>
      </div>
    </div>
  );
}
