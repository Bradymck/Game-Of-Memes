import type { MemeCardData } from "./game-context";

/**
 * AI Opponent Logic with Difficulty Levels
 *
 * Easy (Rookie): Random plays, skips cards 30%, 90/10 face/trade
 * Normal: Plays expensive cards first, 70/30 face/trade
 * Hard (Mastermind): Smart trading, prioritizes low-health threats, 50/50 face/trade
 */

export type Difficulty = "easy" | "normal" | "hard";

export interface GameState {
  opponentHand: MemeCardData[];
  opponentField: MemeCardData[];
  playerField: MemeCardData[];
  opponentMana: number;
  playerHealth: number;
}

export interface AIAction {
  type: "PLAY_CARD" | "ATTACK_MINION" | "ATTACK_HERO" | "END_TURN";
  cardId?: string;
  targetId?: string;
}

/**
 * AI decides what to do on its turn
 */
export function getAIActions(
  state: GameState,
  difficulty: Difficulty = "normal",
): AIAction[] {
  switch (difficulty) {
    case "easy":
      return getEasyAIActions(state);
    case "hard":
      return getHardAIActions(state);
    case "normal":
    default:
      return getNormalAIActions(state);
  }
}

/**
 * Easy AI: Random plays, skips cards 30%, 90/10 face/trade
 */
function getEasyAIActions(state: GameState): AIAction[] {
  const actions: AIAction[] = [];

  // Step 1: Play cards randomly (not expensive-first), skip 30% of the time
  let remainingMana = state.opponentMana;
  const playableCards = state.opponentHand
    .filter((card) => card.mana <= remainingMana)
    .sort(() => Math.random() - 0.5); // Random order

  for (const card of playableCards) {
    if (state.opponentField.length >= 7) break; // Board full
    if (card.mana > remainingMana) continue;

    // 30% chance to skip playing this card (dumb AI)
    if (Math.random() < 0.3) continue;

    actions.push({
      type: "PLAY_CARD",
      cardId: card.id,
    });

    remainingMana -= card.mana;
  }

  // Step 2: Attack with minions - 90% face, 10% trade
  for (const minion of state.opponentField) {
    if (!minion.canAttack) continue;

    if (state.playerField.length === 0) {
      // No enemy minions, attack hero
      actions.push({
        type: "ATTACK_HERO",
        cardId: minion.id,
      });
    } else {
      // 90% chance to go face, 10% chance to trade
      if (Math.random() > 0.1) {
        actions.push({
          type: "ATTACK_HERO",
          cardId: minion.id,
        });
      } else {
        const target =
          state.playerField[
            Math.floor(Math.random() * state.playerField.length)
          ];
        actions.push({
          type: "ATTACK_MINION",
          cardId: minion.id,
          targetId: target.id,
        });
      }
    }
  }

  return actions;
}

/**
 * Normal AI: Original behavior (70/30 face/trade, expensive cards first)
 */
function getNormalAIActions(state: GameState): AIAction[] {
  const actions: AIAction[] = [];

  // Step 1: Play cards if we have mana and field space
  let remainingMana = state.opponentMana;
  const playableCards = state.opponentHand
    .filter((card) => card.mana <= remainingMana)
    .sort((a, b) => b.mana - a.mana); // Play expensive cards first

  for (const card of playableCards) {
    if (state.opponentField.length >= 7) break; // Board full
    if (card.mana > remainingMana) continue;

    actions.push({
      type: "PLAY_CARD",
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
        type: "ATTACK_HERO",
        cardId: minion.id,
      });
    } else {
      // Enemy has minions - 70% chance to go face, 30% chance to trade
      if (Math.random() > 0.3) {
        actions.push({
          type: "ATTACK_HERO",
          cardId: minion.id,
        });
      } else {
        // Attack a random enemy minion
        const target =
          state.playerField[
            Math.floor(Math.random() * state.playerField.length)
          ];
        actions.push({
          type: "ATTACK_MINION",
          cardId: minion.id,
          targetId: target.id,
        });
      }
    }
  }

  return actions;
}

/**
 * Hard AI: Smart trading, prioritizes killing low-health threats, 50/50 face/trade
 */
function getHardAIActions(state: GameState): AIAction[] {
  const actions: AIAction[] = [];

  // Step 1: Smart card playing - consider board state
  let remainingMana = state.opponentMana;
  const playableCards = state.opponentHand
    .filter((card) => card.mana <= remainingMana)
    .sort((a, b) => b.mana - a.mana); // Play expensive cards first

  for (const card of playableCards) {
    if (state.opponentField.length >= 7) break; // Board full
    if (card.mana > remainingMana) continue;

    actions.push({
      type: "PLAY_CARD",
      cardId: card.id,
    });

    remainingMana -= card.mana;
  }

  // Step 2: Smart attacking - prioritize favorable trades
  for (const minion of state.opponentField) {
    if (!minion.canAttack) continue;

    if (state.playerField.length === 0) {
      // No enemy minions, attack hero
      actions.push({
        type: "ATTACK_HERO",
        cardId: minion.id,
      });
    } else {
      // Find low-health enemy minions we can kill
      const killableTargets = state.playerField.filter(
        (enemy) => enemy.health <= minion.attack,
      );

      if (killableTargets.length > 0) {
        // Prioritize killing the highest attack minion we can kill
        const bestTarget = killableTargets.sort(
          (a, b) => b.attack - a.attack,
        )[0];
        actions.push({
          type: "ATTACK_MINION",
          cardId: minion.id,
          targetId: bestTarget.id,
        });
      } else {
        // No killable targets - 50/50 face or trade
        if (Math.random() > 0.5) {
          actions.push({
            type: "ATTACK_HERO",
            cardId: minion.id,
          });
        } else {
          // Trade into highest attack minion
          const target = state.playerField.sort(
            (a, b) => b.attack - a.attack,
          )[0];
          actions.push({
            type: "ATTACK_MINION",
            cardId: minion.id,
            targetId: target.id,
          });
        }
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
  const playable = state.opponentHand.find(
    (card) => card.mana <= state.opponentMana && state.opponentField.length < 7,
  );

  if (playable) {
    actions.push({ type: "PLAY_CARD", cardId: playable.id });
  }

  // Attack face with all minions
  state.opponentField.forEach((minion) => {
    if (minion.canAttack) {
      actions.push({ type: "ATTACK_HERO", cardId: minion.id });
    }
  });

  return actions;
}
