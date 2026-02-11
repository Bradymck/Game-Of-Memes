'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '@/components/Card';
import HeroPortrait from '@/components/HeroPortrait';
import { generateStarterDeck } from '@/lib/cards';
import { GameState, Player, BoardCard } from '@/lib/types';
import { planAITurn, AIAction } from '@/lib/ai';
import { executeBattlecry, executeDeathrattle, EffectResult } from '@/lib/effects';

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
    fatigueCounter: 0,
  };
}

type AttackState = {
  attackerId: string | null;
  mode: 'idle' | 'selecting_target';
};

type BurnNotification = {
  id: string;
  cardName: string;
  player: string;
};

type EffectNotification = {
  id: string;
  message: string;
  type: 'battlecry' | 'deathrattle';
};

const HAND_LIMIT = 10;

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [attackState, setAttackState] = useState<AttackState>({
    attackerId: null,
    mode: 'idle',
  });
  const [burnNotification, setBurnNotification] = useState<BurnNotification | null>(null);
  const [effectNotification, setEffectNotification] = useState<EffectNotification | null>(null);

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

  // Clear burn notification after 3 seconds
  useEffect(() => {
    if (burnNotification) {
      const timer = setTimeout(() => {
        setBurnNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [burnNotification]);

  // Clear effect notification after 3 seconds
  useEffect(() => {
    if (effectNotification) {
      const timer = setTimeout(() => {
        setEffectNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [effectNotification]);

  // AI Turn Logic - Execute when it's player2's turn
  useEffect(() => {
    if (!gameState || gameState.turn !== 'player2' || gameState.winner) return;

    const executeAITurn = async () => {
      // Small delay before AI starts (feels more natural)
      await new Promise(resolve => setTimeout(resolve, 800));

      const actions = planAITurn(gameState.player2, gameState.player1);

      // Execute each action with a delay for visual feedback
      for (const action of actions) {
        await new Promise(resolve => setTimeout(resolve, 600));

        if (action.type === 'PLAY_CARD') {
          const card = gameState.player2.hand.find(c => c.id === action.cardId);
          if (card && card.cost <= gameState.player2.mana && gameState.player2.board.length < 7) {
            setGameState(prev => {
              if (!prev) return prev;
              const newPlayer = { ...prev.player2 };
              const opponentPlayer = { ...prev.player1 };

              newPlayer.hand = newPlayer.hand.filter(c => c.id === action.cardId);

              // Check if card has Charge effect
              const hasCharge = card.effect === 'charge';

              newPlayer.board.push({
                ...card,
                currentHealth: card.health,
                currentAttack: card.attack,
                canAttack: hasCharge,
                summoningSickness: !hasCharge,
              });
              newPlayer.mana -= card.cost;

              // Execute Battlecry if card has one
              if (card.effect === 'battlecry') {
                const battlecryResult = executeBattlecry(card, newPlayer, opponentPlayer);
                if (battlecryResult.success && battlecryResult.message) {
                  setEffectNotification({
                    id: `effect-${Date.now()}`,
                    message: battlecryResult.message,
                    type: 'battlecry',
                  });
                }

                // Remove dead minions after battlecry damage
                opponentPlayer.board = opponentPlayer.board.filter(minion => {
                  if (minion.currentHealth <= 0) {
                    // Execute deathrattle before moving to graveyard
                    if (minion.effect === 'deathrattle') {
                      const deathrattleResult = executeDeathrattle(minion, opponentPlayer, newPlayer);
                      if (deathrattleResult.success && deathrattleResult.message) {
                        setEffectNotification({
                          id: `effect-${Date.now()}`,
                          message: deathrattleResult.message,
                          type: 'deathrattle',
                        });
                      }
                    }
                    opponentPlayer.graveyard.push(minion);
                    return false;
                  }
                  return true;
                });
              }

              return {
                ...prev,
                player2: newPlayer,
                player1: opponentPlayer
              } as GameState;
            });
          }
        } else if (action.type === 'ATTACK_MINION' && action.targetId) {
          setGameState(prev => {
            if (!prev) return prev;
            const newState = { ...prev };
            const attacker = newState.player2.board.find(c => c.id === action.cardId);
            const defender = newState.player1.board.find(c => c.id === action.targetId);

            if (attacker && defender && attacker.canAttack) {
              const attackerDamage = attacker.currentAttack;
              const defenderDamage = defender.currentAttack;

              // Deal damage
              attacker.currentHealth -= defenderDamage;
              defender.currentHealth -= attackerDamage;

              // Lifesteal: Heal attacking player if attacker has lifesteal
              if (attacker.effect === 'lifesteal') {
                newState.player2.health = Math.min(
                  newState.player2.health + attackerDamage,
                  newState.player2.maxHealth
                );
              }

              attacker.canAttack = false;

              // Process deathrattles for AI minions that died
              newState.player2.board.forEach(minion => {
                if (minion.currentHealth <= 0 && minion.effect === 'deathrattle') {
                  const result = executeDeathrattle(minion, newState.player2, newState.player1);
                  if (result.success && result.message) {
                    setEffectNotification({
                      id: `effect-${Date.now()}-${minion.id}`,
                      message: result.message,
                      type: 'deathrattle',
                    });
                  }
                }
              });

              // Process deathrattles for player minions that died
              newState.player1.board.forEach(minion => {
                if (minion.currentHealth <= 0 && minion.effect === 'deathrattle') {
                  const result = executeDeathrattle(minion, newState.player1, newState.player2);
                  if (result.success && result.message) {
                    setEffectNotification({
                      id: `effect-${Date.now()}-${minion.id}`,
                      message: result.message,
                      type: 'deathrattle',
                    });
                  }
                }
              });

              // Remove dead minions
              newState.player2.board = newState.player2.board.filter(c => {
                if (c.currentHealth <= 0) {
                  newState.player2.graveyard.push(c);
                  return false;
                }
                return true;
              });
              newState.player1.board = newState.player1.board.filter(c => {
                if (c.currentHealth <= 0) {
                  newState.player1.graveyard.push(c);
                  return false;
                }
                return true;
              });
            }
            return newState as GameState;
          });
        } else if (action.type === 'ATTACK_HERO') {
          setGameState(prev => {
            if (!prev) return prev;
            const attacker = prev.player2.board.find(c => c.id === action.cardId);
            if (attacker && attacker.canAttack) {
              const newState = { ...prev };
              const damage = attacker.currentAttack;

              // Deal damage to enemy hero
              newState.player1.health -= damage;

              // Lifesteal: Heal AI hero if attacker has lifesteal
              if (attacker.effect === 'lifesteal') {
                newState.player2.health = Math.min(
                  newState.player2.health + damage,
                  newState.player2.maxHealth
                );
              }

              attacker.canAttack = false;
              if (newState.player1.health <= 0) newState.winner = 'player2';
              return newState as GameState;
            }
            return prev;
          });
        } else if (action.type === 'END_TURN') {
          setGameState(prev => {
            if (!prev) return prev;

            const nextTurn = 'player1';
            const nextPlayer = prev.player1;

            // Draw a card with hand limit and fatigue check
            const newCard = nextPlayer.deck[0];
            const newDeck = nextPlayer.deck.slice(1);

            let newHand = nextPlayer.hand;
            let newFatigueCounter = nextPlayer.fatigueCounter;
            let newHealth = nextPlayer.health;

            if (newCard) {
              if (nextPlayer.hand.length >= HAND_LIMIT) {
                // Hand is full - burn the card
                setBurnNotification({
                  id: `burn-${Date.now()}`,
                  cardName: newCard.name,
                  player: nextPlayer.id,
                });
                // Card goes directly to graveyard (burned)
              } else {
                // Add card to hand
                newHand = [...nextPlayer.hand, newCard];
              }
            } else {
              // Deck empty - fatigue damage
              newFatigueCounter += 1;
              newHealth -= newFatigueCounter;
              console.log(`${nextPlayer.id} takes ${newFatigueCounter} fatigue damage!`);
            }

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
              turnNumber: prev.turnNumber + 1,
              player1: {
                ...nextPlayer,
                health: newHealth,
                hand: newHand,
                deck: newDeck,
                mana: newMaxMana,
                maxMana: newMaxMana,
                board: newBoard,
                fatigueCounter: newFatigueCounter,
              },
            };
          });
        }
      }
    };

    executeAITurn();
  }, [gameState?.turn, gameState?.turnNumber]); // Re-run when turn changes

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

  // Check if opponent has any taunt minions
  const opponentHasTaunt = opponent.board.some(card => card.effect === 'taunt');
  const opponentTauntMinions = opponent.board.filter(card => card.effect === 'taunt');

  const handlePlayCard = (cardId: string) => {
    const card = currentPlayer.hand.find(c => c.id === cardId);
    if (!card || card.cost > currentPlayer.mana) return;

    // Board limit check (7 minions max)
    if (currentPlayer.board.length >= 7) return;

    setGameState(prev => {
      if (!prev) return prev;

      const newPlayer = { ...currentPlayer };
      const opponentPlayer = { ...opponent };

      newPlayer.hand = newPlayer.hand.filter(c => c.id !== cardId);

      // Check if card has Charge effect
      const hasCharge = card.effect === 'charge';

      newPlayer.board.push({
        ...card,
        currentHealth: card.health,
        currentAttack: card.attack,
        canAttack: hasCharge,
        summoningSickness: !hasCharge,
      });
      newPlayer.mana -= card.cost;

      // Execute Battlecry if card has one
      if (card.effect === 'battlecry') {
        const battlecryResult = executeBattlecry(card, newPlayer, opponentPlayer);
        if (battlecryResult.success && battlecryResult.message) {
          setEffectNotification({
            id: `effect-${Date.now()}`,
            message: battlecryResult.message,
            type: 'battlecry',
          });
        }

        // Remove dead minions after battlecry damage
        opponentPlayer.board = opponentPlayer.board.filter(minion => {
          if (minion.currentHealth <= 0) {
            // Execute deathrattle before moving to graveyard
            if (minion.effect === 'deathrattle') {
              const deathrattleResult = executeDeathrattle(minion, opponentPlayer, newPlayer);
              if (deathrattleResult.success && deathrattleResult.message) {
                setEffectNotification({
                  id: `effect-${Date.now()}`,
                  message: deathrattleResult.message,
                  type: 'deathrattle',
                });
              }
            }
            opponentPlayer.graveyard.push(minion);
            return false;
          }
          return true;
        });
      }

      return {
        ...prev,
        [prev.turn]: newPlayer,
        [opponentId]: opponentPlayer,
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
      const attackerDamage = attacker.currentAttack;
      const defenderDamage = defender.currentAttack;

      attacker.currentHealth -= defenderDamage;
      defender.currentHealth -= attackerDamage;

      // Lifesteal: Heal attacking player if attacker has lifesteal
      if (attacker.effect === 'lifesteal') {
        attackingPlayer.health = Math.min(
          attackingPlayer.health + attackerDamage,
          attackingPlayer.maxHealth
        );
      }

      // Mark attacker as used
      attacker.canAttack = false;

      // Process deathrattles and remove dead minions
      attackingPlayer.board = attackingPlayer.board.filter(c => {
        if (c.currentHealth <= 0) {
          // Execute deathrattle before moving to graveyard
          if (c.effect === 'deathrattle') {
            const result = executeDeathrattle(c, attackingPlayer, defendingPlayer);
            if (result.success && result.message) {
              setEffectNotification({
                id: `effect-${Date.now()}-${c.id}`,
                message: result.message,
                type: 'deathrattle',
              });
            }
          }
          attackingPlayer.graveyard.push(c);
          return false;
        }
        return true;
      });

      defendingPlayer.board = defendingPlayer.board.filter(c => {
        if (c.currentHealth <= 0) {
          // Execute deathrattle before moving to graveyard
          if (c.effect === 'deathrattle') {
            const result = executeDeathrattle(c, defendingPlayer, attackingPlayer);
            if (result.success && result.message) {
              setEffectNotification({
                id: `effect-${Date.now()}-${c.id}`,
                message: result.message,
                type: 'deathrattle',
              });
            }
          }
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

      // TAUNT CHECK: Cannot attack hero if opponent has taunt minions
      const opponentHasTauntMinions = defendingPlayer.board.some(card => card.effect === 'taunt');
      if (opponentHasTauntMinions) {
        // Silently reject the attack (taunt minions must be killed first)
        return prev;
      }

      // Deal damage to hero
      const damage = attacker.currentAttack;
      defendingPlayer.health -= damage;

      // Lifesteal: Heal attacking player if attacker has lifesteal
      if (attacker.effect === 'lifesteal') {
        attackingPlayer.health = Math.min(
          attackingPlayer.health + damage,
          attackingPlayer.maxHealth
        );
      }

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

      // Draw a card with hand limit and fatigue check
      const newCard = nextPlayer.deck[0];
      const newDeck = nextPlayer.deck.slice(1);

      let newHand = nextPlayer.hand;
      let newFatigueCounter = nextPlayer.fatigueCounter;
      let newHealth = nextPlayer.health;

      if (newCard) {
        if (nextPlayer.hand.length >= HAND_LIMIT) {
          // Hand is full - burn the card
          setBurnNotification({
            id: `burn-${Date.now()}`,
            cardName: newCard.name,
            player: nextPlayer.id,
          });
          // Card goes directly to graveyard (burned)
        } else {
          // Add card to hand
          newHand = [...nextPlayer.hand, newCard];
        }
      } else {
        // Deck empty - fatigue damage
        newFatigueCounter += 1;
        newHealth -= newFatigueCounter;
        console.log(`${nextPlayer.id} takes ${newFatigueCounter} fatigue damage!`);
      }

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
          health: newHealth,
          hand: newHand,
          deck: newDeck,
          mana: newMaxMana,
          maxMana: newMaxMana,
          board: newBoard,
          fatigueCounter: newFatigueCounter,
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
    setBurnNotification(null);
    setEffectNotification(null);
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
      {/* Burn Notification */}
      <AnimatePresence>
        {burnNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-2xl border-2 border-red-400">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                <div>
                  <div className="font-bold">Card Burned!</div>
                  <div className="text-sm opacity-90">{burnNotification.cardName} - Hand was full (10/10)</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Effect Notification */}
      <AnimatePresence>
        {effectNotification && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-32 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className={`${
              effectNotification.type === 'battlecry'
                ? 'bg-purple-600 border-purple-400'
                : 'bg-orange-600 border-orange-400'
            } text-white px-6 py-3 rounded-lg shadow-2xl border-2`}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {effectNotification.type === 'battlecry' ? '⚡' : '💀'}
                </span>
                <div>
                  <div className="font-bold">
                    {effectNotification.type === 'battlecry' ? 'Battlecry!' : 'Deathrattle!'}
                  </div>
                  <div className="text-sm opacity-90">{effectNotification.message}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              isTargetable={attackState.mode === 'selecting_target' && !opponentHasTaunt}
              onClick={handleAttackHero}
            />
          </div>

          {/* Opponent Stats - Top Right */}
          <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
            <div className="text-lg text-gray-300">
              💎 <span className="font-bold text-blue-400">{opponent.mana}/{opponent.maxMana}</span>
            </div>
            <div className="text-sm text-gray-400">
              📚 {opponent.deck.length} | 🃏 {opponent.hand.length}/{HAND_LIMIT}
            </div>
          </div>

          {/* Opponent Board */}
          <div className="flex gap-2 justify-center min-h-[200px] items-center pt-8">
            {opponent.board.length === 0 ? (
              <p className="text-gray-500">Opponent's board is empty</p>
            ) : (
              opponent.board.map((card) => {
                // If opponent has taunt, only taunt minions are targetable
                const isTargetable = attackState.mode === 'selecting_target' &&
                  (!opponentHasTaunt || card.effect === 'taunt');

                return (
                  <div
                    key={card.id}
                    onClick={() => isTargetable && handleAttackMinion(card.id)}
                    className={isTargetable ? 'cursor-crosshair' : ''}
                  >
                    <Card
                      card={card}
                      isPlayable={isTargetable}
                    />
                  </div>
                );
              })
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
              {opponentHasTaunt ? (
                <div className="text-xs text-amber-400">
                  🛡️ Enemy has Taunt! You must attack taunt minions first
                </div>
              ) : (
                <div className="text-xs text-gray-400">
                  Click enemy minion to trade • Click enemy hero (pulsing red) to go face
                </div>
              )}
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
            <div className={`text-sm ${currentPlayer.hand.length >= HAND_LIMIT ? 'text-red-400 font-bold' : 'text-gray-400'}`}>
              🃏 {currentPlayer.hand.length}/{HAND_LIMIT} {currentPlayer.hand.length >= HAND_LIMIT && '(FULL!)'}
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
                    isPlayable={card.cost <= currentPlayer.mana && currentPlayer.board.length < 7}
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
          Tip: Cards with ⚡ Battlecry trigger when played. Cards with 💀 Deathrattle trigger when they die!
        </div>
      </div>
    </div>
  );
}
