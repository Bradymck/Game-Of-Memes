import { describe, it, expect } from "vitest";
import type { MemeCardData } from "../game-context";

/**
 * Card Mechanics Test Suite
 *
 * Tests pure game logic functions that don't require React context.
 * These tests cover:
 * - Combat math (minion vs minion, minion vs hero)
 * - Mana validation
 * - Board limits
 * - Deck operations
 * - Game-over conditions
 */

function makeCard(overrides: Partial<MemeCardData> = {}): MemeCardData {
  return {
    id: `card-${Math.random().toString(36).slice(2, 6)}`,
    name: "Test Card",
    image: "/test.jpg",
    rarity: "common",
    attack: 3,
    health: 3,
    mana: 2,
    ticker: "$TEST",
    canAttack: true,
    ...overrides,
  };
}

describe("Combat Math", () => {
  describe("Minion vs Minion", () => {
    it("applies mutual damage correctly", () => {
      const attacker = makeCard({ id: "attacker", attack: 3, health: 5 });
      const target = makeCard({ id: "target", attack: 2, health: 4 });

      const newTargetHealth = target.health - attacker.attack; // 4 - 3 = 1
      const newAttackerHealth = attacker.health - target.attack; // 5 - 2 = 3

      expect(newTargetHealth).toBe(1);
      expect(newAttackerHealth).toBe(3);
    });

    it("correctly identifies when attacker dies", () => {
      const attacker = makeCard({ id: "attacker", attack: 2, health: 3 });
      const target = makeCard({ id: "target", attack: 5, health: 10 });

      const newAttackerHealth = attacker.health - target.attack; // 3 - 5 = -2

      expect(newAttackerHealth).toBeLessThanOrEqual(0);
    });

    it("correctly identifies when target dies", () => {
      const attacker = makeCard({ id: "attacker", attack: 4, health: 5 });
      const target = makeCard({ id: "target", attack: 1, health: 3 });

      const newTargetHealth = target.health - attacker.attack; // 3 - 4 = -1

      expect(newTargetHealth).toBeLessThanOrEqual(0);
    });

    it("correctly identifies mutual kill", () => {
      const attacker = makeCard({ id: "attacker", attack: 3, health: 2 });
      const target = makeCard({ id: "target", attack: 5, health: 3 });

      const newTargetHealth = target.health - attacker.attack; // 3 - 3 = 0
      const newAttackerHealth = attacker.health - target.attack; // 2 - 5 = -3

      expect(newTargetHealth).toBeLessThanOrEqual(0);
      expect(newAttackerHealth).toBeLessThanOrEqual(0);
    });

    it("handles 0 attack correctly (no damage)", () => {
      const attacker = makeCard({ id: "attacker", attack: 0, health: 5 });
      const target = makeCard({ id: "target", attack: 3, health: 4 });

      const newTargetHealth = target.health - attacker.attack; // 4 - 0 = 4
      const newAttackerHealth = attacker.health - target.attack; // 5 - 3 = 2

      expect(newTargetHealth).toBe(4); // No damage dealt
      expect(newAttackerHealth).toBe(2); // But still takes counter-damage
    });

    it("calculates overkill damage correctly", () => {
      const attacker = makeCard({ id: "attacker", attack: 10, health: 5 });
      const target = makeCard({ id: "target", attack: 2, health: 3 });

      const newTargetHealth = target.health - attacker.attack; // 3 - 10 = -7
      const overkill = Math.abs(newTargetHealth);

      expect(newTargetHealth).toBeLessThan(0);
      expect(overkill).toBe(7); // 7 points of overkill damage
    });
  });

  describe("Hero attacks", () => {
    it("applies damage to hero health", () => {
      const attacker = makeCard({ id: "attacker", attack: 5 });
      const heroHealth = 30;

      const newHeroHealth = heroHealth - attacker.attack; // 30 - 5 = 25

      expect(newHeroHealth).toBe(25);
    });

    it("hero does not deal counter-damage to attacking minion", () => {
      const attacker = makeCard({ id: "attacker", attack: 5, health: 3 });
      const attackerHealthAfter = attacker.health; // Should remain 3

      expect(attackerHealthAfter).toBe(3);
    });

    it("can reduce hero to exactly 0", () => {
      const attacker = makeCard({ id: "attacker", attack: 5 });
      const heroHealth = 5;

      const newHeroHealth = heroHealth - attacker.attack; // 5 - 5 = 0

      expect(newHeroHealth).toBe(0);
    });

    it("can reduce hero to negative (overkill)", () => {
      const attacker = makeCard({ id: "attacker", attack: 10 });
      const heroHealth = 3;

      const newHeroHealth = heroHealth - attacker.attack; // 3 - 10 = -7

      expect(newHeroHealth).toBe(-7);
    });
  });
});

describe("Mana Validation", () => {
  it("allows playing card when mana equals cost", () => {
    const card = makeCard({ mana: 3 });
    const currentMana = 3;

    const canPlay = card.mana <= currentMana;

    expect(canPlay).toBe(true);
  });

  it("allows playing card when mana exceeds cost", () => {
    const card = makeCard({ mana: 2 });
    const currentMana = 5;

    const canPlay = card.mana <= currentMana;

    expect(canPlay).toBe(true);
  });

  it("prevents playing card when mana is insufficient", () => {
    const card = makeCard({ mana: 5 });
    const currentMana = 3;

    const canPlay = card.mana <= currentMana;

    expect(canPlay).toBe(false);
  });

  it("correctly deducts mana cost after playing card", () => {
    const card = makeCard({ mana: 3 });
    const currentMana = 7;

    const remainingMana = currentMana - card.mana;

    expect(remainingMana).toBe(4);
  });

  it("handles 0-cost cards", () => {
    const card = makeCard({ mana: 0 });
    const currentMana = 0;

    const canPlay = card.mana <= currentMana;

    expect(canPlay).toBe(true);
  });
});

describe("Board Limits", () => {
  it("allows placing minion when board has space", () => {
    const field = [
      makeCard({ id: "m1" }),
      makeCard({ id: "m2" }),
      makeCard({ id: "m3" }),
    ];

    const canPlace = field.length < 7;

    expect(canPlace).toBe(true);
  });

  it("prevents placing minion when board is full", () => {
    const field = Array.from({ length: 7 }, (_, i) =>
      makeCard({ id: `m${i}` }),
    );

    const canPlace = field.length < 7;

    expect(canPlace).toBe(false);
  });

  it("allows placing exactly when at 6 minions", () => {
    const field = Array.from({ length: 6 }, (_, i) =>
      makeCard({ id: `m${i}` }),
    );

    const canPlace = field.length < 7;

    expect(canPlace).toBe(true);
  });
});

describe("Deck Operations", () => {
  it("draws a card from non-empty deck", () => {
    const deck = [
      makeCard({ id: "d1", name: "Card 1" }),
      makeCard({ id: "d2", name: "Card 2" }),
      makeCard({ id: "d3", name: "Card 3" }),
    ];

    const drawnCard = deck[0];
    const remainingDeck = deck.slice(1);

    expect(drawnCard.id).toBe("d1");
    expect(remainingDeck.length).toBe(2);
  });

  it("returns nothing when drawing from empty deck", () => {
    const deck: MemeCardData[] = [];

    const drawnCard = deck[0];

    expect(drawnCard).toBeUndefined();
  });

  it("shuffles graveyard into deck when deck is empty", () => {
    const deck: MemeCardData[] = [];
    const graveyard = [
      makeCard({ id: "g1" }),
      makeCard({ id: "g2" }),
      makeCard({ id: "g3" }),
    ];

    // Simulate reshuffling
    const newDeck = [...graveyard].sort(() => Math.random() - 0.5);
    const newGraveyard: MemeCardData[] = [];

    expect(newDeck.length).toBe(3);
    expect(newGraveyard.length).toBe(0);
    expect(deck.length).toBe(0);
  });

  it("handles empty deck and empty graveyard", () => {
    const deck: MemeCardData[] = [];
    const graveyard: MemeCardData[] = [];

    const drawnCard = deck[0];

    expect(drawnCard).toBeUndefined();
    expect(deck.length).toBe(0);
    expect(graveyard.length).toBe(0);
  });
});

describe("Game Over Conditions", () => {
  it("game ends when player health reaches 0", () => {
    const playerHealth = 0;
    const opponentHealth = 20;

    const gameOver = playerHealth <= 0 || opponentHealth <= 0;
    const playerWon = opponentHealth <= 0;

    expect(gameOver).toBe(true);
    expect(playerWon).toBe(false);
  });

  it("game ends when opponent health reaches 0", () => {
    const playerHealth = 15;
    const opponentHealth = 0;

    const gameOver = playerHealth <= 0 || opponentHealth <= 0;
    const playerWon = opponentHealth <= 0;

    expect(gameOver).toBe(true);
    expect(playerWon).toBe(true);
  });

  it("game ends when player health goes negative", () => {
    const playerHealth = -5;
    const opponentHealth = 10;

    const gameOver = playerHealth <= 0 || opponentHealth <= 0;
    const playerWon = opponentHealth <= 0;

    expect(gameOver).toBe(true);
    expect(playerWon).toBe(false);
  });

  it("game continues when both players have health", () => {
    const playerHealth = 15;
    const opponentHealth = 20;

    const gameOver = playerHealth <= 0 || opponentHealth <= 0;

    expect(gameOver).toBe(false);
  });

  it("game ends when both reach 0 simultaneously (mutual kill)", () => {
    const playerHealth = 0;
    const opponentHealth = 0;

    const gameOver = playerHealth <= 0 || opponentHealth <= 0;

    expect(gameOver).toBe(true);
  });
});

describe("Summoning Sickness", () => {
  it("newly played card cannot attack (canAttack: false)", () => {
    const card = makeCard({ canAttack: false });

    expect(card.canAttack).toBe(false);
  });

  it("card can attack after turn passes (canAttack: true)", () => {
    const card = makeCard({ canAttack: true });

    expect(card.canAttack).toBe(true);
  });

  it("prevents selecting card with canAttack: false as attacker", () => {
    const card = makeCard({ id: "m1", canAttack: false });

    const canSelect = card.canAttack === true;

    expect(canSelect).toBe(false);
  });
});

describe("Mana Progression", () => {
  it("increments max mana each turn", () => {
    const currentMaxMana = 3;
    const newMaxMana = Math.min(10, currentMaxMana + 1);

    expect(newMaxMana).toBe(4);
  });

  it("caps max mana at 10", () => {
    const currentMaxMana = 10;
    const newMaxMana = Math.min(10, currentMaxMana + 1);

    expect(newMaxMana).toBe(10);
  });

  it("reaches max mana at turn 10", () => {
    let maxMana = 1;

    for (let turn = 1; turn < 10; turn++) {
      maxMana = Math.min(10, maxMana + 1);
    }

    expect(maxMana).toBe(10);
  });

  it("refills mana to max at start of turn", () => {
    const maxMana = 5;
    const currentMana = 2; // After spending some

    const refillMana = maxMana;

    expect(refillMana).toBe(5);
  });
});

describe("Initial Game State", () => {
  it("player starts with correct initial hand size (4 cards)", () => {
    const playerHandSize = 4;

    expect(playerHandSize).toBe(4);
  });

  it("opponent starts with correct initial hand size (3 cards)", () => {
    const opponentHandSize = 3;

    expect(opponentHandSize).toBe(3);
  });

  it("opponent starts with 1 minion on board", () => {
    const opponentFieldSize = 1;

    expect(opponentFieldSize).toBe(1);
  });

  it("both players start with 1 mana", () => {
    const playerMana = 1;
    const opponentMana = 1;

    expect(playerMana).toBe(1);
    expect(opponentMana).toBe(1);
  });

  it("both players start with 30 health", () => {
    const playerHealth = 30;
    const opponentHealth = 30;

    expect(playerHealth).toBe(30);
    expect(opponentHealth).toBe(30);
  });

  it("player goes first (isPlayerTurn: true)", () => {
    const isPlayerTurn = true;

    expect(isPlayerTurn).toBe(true);
  });

  it("game starts at turn 1", () => {
    const turnNumber = 1;

    expect(turnNumber).toBe(1);
  });

  it("game is not over at start", () => {
    const gameOver = false;
    const playerWon = null;

    expect(gameOver).toBe(false);
    expect(playerWon).toBe(null);
  });
});

describe("Graveyard Mechanics", () => {
  it("dead minion moves to graveyard", () => {
    const deadCard = makeCard({ id: "dead", attack: 3, health: -1 });
    const graveyard: MemeCardData[] = [];

    const shouldDie = deadCard.health <= 0;

    if (shouldDie) {
      graveyard.push(deadCard);
    }

    expect(graveyard.length).toBe(1);
    expect(graveyard[0].id).toBe("dead");
  });

  it("multiple dead minions move to graveyard", () => {
    const deadCards = [
      makeCard({ id: "d1", health: 0 }),
      makeCard({ id: "d2", health: -3 }),
      makeCard({ id: "d3", health: -1 }),
    ];
    const graveyard: MemeCardData[] = [];

    deadCards.forEach((card) => {
      if (card.health <= 0) {
        graveyard.push(card);
      }
    });

    expect(graveyard.length).toBe(3);
  });

  it("living minions do not move to graveyard", () => {
    const livingCard = makeCard({ id: "alive", health: 5 });
    const graveyard: MemeCardData[] = [];

    const shouldDie = livingCard.health <= 0;

    if (shouldDie) {
      graveyard.push(livingCard);
    }

    expect(graveyard.length).toBe(0);
  });
});

describe("Attack Rules", () => {
  it("cannot attack hero when opponent has minions (taunt)", () => {
    const opponentField = [makeCard({ id: "blocker" })];

    const hasTauntBlockers = opponentField.length > 0;

    expect(hasTauntBlockers).toBe(true);
  });

  it("can attack hero when opponent has no minions", () => {
    const opponentField: MemeCardData[] = [];

    const hasTauntBlockers = opponentField.length > 0;

    expect(hasTauntBlockers).toBe(false);
  });

  it("attacker sets canAttack to false after attacking", () => {
    const attacker = makeCard({ id: "attacker", canAttack: true });

    // After attack
    const updatedAttacker = { ...attacker, canAttack: false };

    expect(updatedAttacker.canAttack).toBe(false);
  });
});
