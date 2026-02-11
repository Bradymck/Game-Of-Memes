import { Card, BoardCard, Player, GameState } from './types';

/**
 * Effect System for Game of Memes
 *
 * This module handles card effects (Battlecry, Deathrattle, etc.)
 * Effects are triggered at specific moments in the game
 */

export interface EffectResult {
  success: boolean;
  message?: string;
  targetId?: string;
  damage?: number;
}

/**
 * Execute Battlecry effect when a card is played from hand
 * @param card - The card being played
 * @param playingPlayer - The player who played the card
 * @param opponentPlayer - The opponent player
 * @returns Result of the battlecry effect
 */
export function executeBattlecry(
  card: Card,
  playingPlayer: Player,
  opponentPlayer: Player
): EffectResult {
  if (card.effect !== 'battlecry') {
    return { success: false, message: 'Card has no battlecry effect' };
  }

  // $BEAR Battlecry: Deal 2 damage to a random enemy minion
  if (card.name === '$BEAR') {
    return bearBattlecry(opponentPlayer);
  }

  // $WHALE Battlecry: Deal 2 damage to a random enemy minion
  if (card.name === '$WHALE') {
    return whaleBattlecry(opponentPlayer);
  }

  // Add more battlecry effects here as new cards are added
  return { success: false, message: 'Unknown battlecry effect' };
}

/**
 * $BEAR Battlecry: Deal 2 damage to a random enemy minion
 */
function bearBattlecry(opponentPlayer: Player): EffectResult {
  // If opponent has no minions, battlecry does nothing
  if (opponentPlayer.board.length === 0) {
    return {
      success: true,
      message: 'No enemy minions to target'
    };
  }

  // Pick a random enemy minion
  const randomIndex = Math.floor(Math.random() * opponentPlayer.board.length);
  const target = opponentPlayer.board[randomIndex];

  // Deal 2 damage
  const damage = 2;
  target.currentHealth -= damage;

  return {
    success: true,
    message: `${target.name} took ${damage} damage!`,
    targetId: target.id,
    damage: damage,
  };
}

/**
 * $WHALE Battlecry: Deal 2 damage to a random enemy minion
 * Thematically: "Moves markets" - disrupts enemy board
 */
function whaleBattlecry(opponentPlayer: Player): EffectResult {
  // If opponent has no minions, battlecry does nothing
  if (opponentPlayer.board.length === 0) {
    return {
      success: true,
      message: 'No enemy minions to target'
    };
  }

  // Pick a random enemy minion
  const randomIndex = Math.floor(Math.random() * opponentPlayer.board.length);
  const target = opponentPlayer.board[randomIndex];

  // Deal 2 damage
  const damage = 2;
  target.currentHealth -= damage;

  return {
    success: true,
    message: `${target.name} took ${damage} damage!`,
    targetId: target.id,
    damage: damage,
  };
}

/**
 * Execute Deathrattle effect when a minion dies
 * @param card - The minion that died
 * @param owningPlayer - The player who owned the minion
 * @param opponentPlayer - The opponent player
 * @returns Result of the deathrattle effect
 */
export function executeDeathrattle(
  card: BoardCard,
  owningPlayer: Player,
  opponentPlayer: Player
): EffectResult {
  if (card.effect !== 'deathrattle') {
    return { success: false, message: 'Card has no deathrattle effect' };
  }

  // $WOJAK Deathrattle: Deal 1 damage to the enemy hero
  if (card.name === '$WOJAK') {
    return wojakDeathrattle(opponentPlayer);
  }

  // Add more deathrattle effects here as new cards are added
  return { success: false, message: 'Unknown deathrattle effect' };
}

/**
 * $WOJAK Deathrattle: Deal 1 damage to the enemy hero
 * Thematically: "Takes you down with them" - panic spreads
 */
function wojakDeathrattle(opponentPlayer: Player): EffectResult {
  const damage = 1;
  opponentPlayer.health -= damage;

  return {
    success: true,
    message: `Enemy hero took ${damage} damage!`,
    damage: damage,
  };
}

/**
 * Check if a card has a specific effect
 */
export function hasEffect(card: Card | BoardCard, effect: string): boolean {
  return card.effect === effect;
}

/**
 * Get effect description for display
 */
export function getEffectDescription(effect: string, cardName: string): string {
  switch (effect) {
    case 'battlecry':
      if (cardName === '$BEAR') {
        return 'Battlecry: Deal 2 damage to a random enemy minion';
      }
      if (cardName === '$WHALE') {
        return 'Battlecry: Deal 2 damage to a random enemy minion';
      }
      return 'Battlecry: Special effect when played';
    case 'deathrattle':
      if (cardName === '$WOJAK') {
        return 'Deathrattle: Deal 1 damage to the enemy hero';
      }
      return 'Deathrattle: Special effect when this minion dies';
    case 'charge':
      return 'Charge: Can attack immediately';
    case 'taunt':
      return 'Taunt: Must be attacked before other targets';
    case 'lifesteal':
      return 'Lifesteal: Restore health equal to damage dealt';
    default:
      return '';
  }
}
