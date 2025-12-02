import type { MemeCardData } from './game-context';

/**
 * Simple AI Opponent Logic
 *
 * Strategy:
 * 1. Play cards if we have mana
 * 2. Attack with all minions
 * 3. Prioritize face damage (attack player directly)
 * 4. Super simple but functional
 */

export interface GameState {
  opponentHand: MemeCardData[];
  opponentField: MemeCardData[];
  playerField: MemeCardData[];
  opponentMana: number;
  playerHealth: number;
}

export interface AIAction {
  type: 'PLAY_CARD' | 'ATTACK_MINION' | 'ATTACK_HERO' | 'END_TURN';
  cardId?: string;
  targetId?: string;
}

/**
 * AI decides what to do on its turn
 */
export function getAIActions(state: GameState): AIAction[] {
  const actions: AIAction[] = [];

  // Step 1: Play cards if we have mana and field space
  let remainingMana = state.opponentMana;
  const playableCards = state.opponentHand
    .filter(card => card.mana <= remainingMana)
    .sort((a, b) => b.mana - a.mana); // Play expensive cards first

  for (const card of playableCards) {
    if (state.opponentField.length >= 7) break; // Board full
    if (card.mana > remainingMana) continue;

    actions.push({
      type: 'PLAY_CARD',
      cardId: card.id,
    });

    remainingMana -= card.mana;
  }

  // Step 2: Attack with all minions on field
  for (const minion of state.opponentField) {
    if (!minion.canAttack) continue;

    // Simple strategy: Always go face (attack hero)
    // Could be smarter (trade favorably, remove threats) but keep it simple
    if (state.playerField.length === 0) {
      // No enemy minions, attack hero
      actions.push({
        type: 'ATTACK_HERO',
        cardId: minion.id,
      });
    } else {
      // Enemy has minions - 70% chance to go face, 30% chance to trade
      if (Math.random() > 0.3) {
        actions.push({
          type: 'ATTACK_HERO',
          cardId: minion.id,
        });
      } else {
        // Attack a random enemy minion
        const target = state.playerField[Math.floor(Math.random() * state.playerField.length)];
        actions.push({
          type: 'ATTACK_MINION',
          cardId: minion.id,
          targetId: target.id,
        });
      }
    }
  }

  return actions;
}

/**
 * Even simpler AI: Just plays first affordable card and attacks face
 */
export function getSimpleAIActions(state: GameState): AIAction[] {
  const actions: AIAction[] = [];

  // Play one card
  const playable = state.opponentHand.find(card =>
    card.mana <= state.opponentMana && state.opponentField.length < 7
  );

  if (playable) {
    actions.push({ type: 'PLAY_CARD', cardId: playable.id });
  }

  // Attack face with all minions
  state.opponentField.forEach(minion => {
    if (minion.canAttack) {
      actions.push({ type: 'ATTACK_HERO', cardId: minion.id });
    }
  });

  return actions;
}
