'use client';

import { useState } from 'react';
import Card from '@/components/Card';
import { generateStarterDeck } from '@/lib/cards';
import { GameState, Player } from '@/lib/types';

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

export default function Home() {
  const [gameState, setGameState] = useState<GameState>({
    player1: createInitialPlayer('player1'),
    player2: createInitialPlayer('player2'),
    turn: 'player1',
    turnNumber: 1,
    phase: 'main',
  });

  const currentPlayer = gameState[gameState.turn];
  const opponent = gameState.turn === 'player1' ? gameState.player2 : gameState.player1;

  const handlePlayCard = (cardId: string) => {
    const card = currentPlayer.hand.find(c => c.id === cardId);
    if (!card || card.cost > currentPlayer.mana) return;

    // Play the card
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

      // Remove summoning sickness
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
  };

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
              <div className="text-2xl font-bold">
                ❤️ {opponent.health}/{opponent.maxHealth}
              </div>
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
                <Card key={card.id} card={card} />
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
        </div>

        {/* Player Area */}
        <div className="bg-blue-900/20 rounded-xl p-4 border-2 border-blue-700/50">
          {/* Player Board */}
          <div className="flex gap-2 justify-center min-h-[200px] items-center mb-4">
            {currentPlayer.board.length === 0 ? (
              <p className="text-gray-500">No cards on board</p>
            ) : (
              currentPlayer.board.map((card) => (
                <Card key={card.id} card={card} />
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
        <p>Click cards to play them • Click "End Turn" when ready • First prototype - more features coming!</p>
      </div>
    </div>
  );
}
