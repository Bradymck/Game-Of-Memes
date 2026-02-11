import { Player, BoardCard, Card } from './types';

/**
 * AI Decision System for Game of Memes
 * Simple but effective AI that can play cards and make combat decisions
 */

export interface AIAction {
  type: 'PLAY_CARD' | 'ATTACK_MINION' | 'ATTACK_HERO' | 'END_TURN';
  cardId?: string;
  targetId?: string;
}

/**
 * Get the best card to play based on available mana
 * Prioritizes highest cost cards that can be played
 */
export function chooseBestCardToPlay(hand: Card[], availableMana: number, boardSize: number): Card | null {
  // Don't play if board is full (7 minions)
  if (boardSize >= 7) return null;

  // Filter playable cards
  const playableCards = hand.filter(card => card.cost <= availableMana);
  if (playableCards.length === 0) return null;

  // Sort by cost (highest first) and return the most expensive card we can afford
  playableCards.sort((a, b) => b.cost - a.cost);
  return playableCards[0];
}

/**
 * Evaluate trade value between attacker and defender
 * Returns positive if favorable, negative if unfavorable
 */
function evaluateTrade(attacker: BoardCard, defender: BoardCard): number {
  // Will the attacker kill the defender?
  const attackerKills = attacker.currentAttack >= defender.currentHealth;

  // Will the attacker die?
  const attackerDies = defender.currentAttack >= attacker.currentHealth;

  // Bonus value for killing taunt minions (clears the path)
  const tauntBonus = defender.effect === 'taunt' ? 20 : 0;

  // Favorable trades:
  // 1. Kill enemy without dying (best)
  if (attackerKills && !attackerDies) return 100 + tauntBonus;

  // 2. Trade evenly (both die) - value based on stats
  if (attackerKills && attackerDies) {
    // Prefer trading up (killing bigger minion)
    const statDiff = (defender.currentAttack + defender.currentHealth) - (attacker.currentAttack + attacker.currentHealth);
    return 50 + statDiff + tauntBonus;
  }

  // 3. Neither dies - value based on damage dealt vs taken
  if (!attackerKills && !attackerDies) {
    const damageDiff = attacker.currentAttack - defender.currentAttack;
    return damageDiff * 10;
  }

  // 4. Worst case: we die but don't kill (very bad)
  if (!attackerKills && attackerDies) return -100;

  return 0;
}

/**
 * Find the best target for an attacker
 * Returns targetId and whether to attack face instead
 * Respects Taunt: must attack taunt minions before other targets
 */
export function chooseBestAttackTarget(
  attacker: BoardCard,
  enemyBoard: BoardCard[],
  enemyHeroHealth: number
): { targetId: string | null; attackFace: boolean } {
  // Check if enemy has any taunt minions
  const tauntMinions = enemyBoard.filter(minion => minion.effect === 'taunt');

  // If enemy has taunt minions, we MUST attack one of them
  if (tauntMinions.length > 0) {
    // Evaluate trades only against taunt minions
    const tauntTrades = tauntMinions.map(defender => ({
      targetId: defender.id,
      value: evaluateTrade(attacker, defender),
    }));

    // Find best taunt to attack
    const bestTauntTrade = tauntTrades.reduce((best, current) =>
      current.value > best.value ? current : best
    );

    return { targetId: bestTauntTrade.targetId, attackFace: false };
  }

  // No taunt minions - normal attack logic
  // If no enemy minions, always go face
  if (enemyBoard.length === 0) {
    return { targetId: null, attackFace: true };
  }

  // Evaluate all possible trades
  const trades = enemyBoard.map(defender => ({
    targetId: defender.id,
    value: evaluateTrade(attacker, defender),
  }));

  // Find best trade
  const bestTrade = trades.reduce((best, current) =>
    current.value > best.value ? current : best
  );

  // If best trade is favorable (positive value), take it
  if (bestTrade.value > 0) {
    return { targetId: bestTrade.targetId, attackFace: false };
  }

  // If best trade is very bad and we can deal significant face damage, go face
  // Threshold: if attacker has 3+ attack and trade value is negative, go face
  if (attacker.currentAttack >= 3 && bestTrade.value < 0) {
    return { targetId: null, attackFace: true };
  }

  // If no good trade but also not worth going face, take best available trade anyway
  // (Don't waste attacks)
  return { targetId: bestTrade.targetId, attackFace: false };
}

/**
 * Generate full AI turn actions
 * Returns array of actions to execute in sequence
 */
export function planAITurn(
  aiPlayer: Player,
  enemyPlayer: Player
): AIAction[] {
  const actions: AIAction[] = [];

  let availableMana = aiPlayer.mana;
  let currentHand = [...aiPlayer.hand];
  let currentBoard = [...aiPlayer.board];

  // Phase 1: Play cards
  while (availableMana > 0) {
    const cardToPlay = chooseBestCardToPlay(currentHand, availableMana, currentBoard.length);
    if (!cardToPlay) break;

    actions.push({
      type: 'PLAY_CARD',
      cardId: cardToPlay.id,
    });

    // Update simulated state
    availableMana -= cardToPlay.cost;
    currentHand = currentHand.filter(c => c.id !== cardToPlay.id);
    currentBoard.push({
      ...cardToPlay,
      currentHealth: cardToPlay.health,
      currentAttack: cardToPlay.attack,
      canAttack: false,
      summoningSickness: true,
    });
  }

  // Phase 2: Attack with all available minions
  const attackers = currentBoard.filter(minion => minion.canAttack && !minion.summoningSickness);

  for (const attacker of attackers) {
    const { targetId, attackFace } = chooseBestAttackTarget(
      attacker,
      [...enemyPlayer.board],
      enemyPlayer.health
    );

    if (attackFace) {
      actions.push({
        type: 'ATTACK_HERO',
        cardId: attacker.id,
      });
    } else if (targetId) {
      actions.push({
        type: 'ATTACK_MINION',
        cardId: attacker.id,
        targetId: targetId,
      });
    }
  }

  // Phase 3: End turn
  actions.push({
    type: 'END_TURN',
  });

  return actions;
}
