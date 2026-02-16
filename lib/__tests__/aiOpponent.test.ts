import { describe, it, expect } from "vitest";
import {
  getAIActions,
  getSimpleAIActions,
  type Difficulty,
} from "../aiOpponent";
import type { MemeCardData } from "../game-context";

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

describe("getAIActions", () => {
  it("plays cards when mana is available", () => {
    const actions = getAIActions({
      opponentHand: [makeCard({ id: "h1", mana: 2 })],
      opponentField: [],
      playerField: [],
      opponentMana: 3,
      playerHealth: 30,
    });

    const playActions = actions.filter((a) => a.type === "PLAY_CARD");
    expect(playActions.length).toBe(1);
    expect(playActions[0].cardId).toBe("h1");
  });

  it("does not play cards when mana is insufficient", () => {
    const actions = getAIActions({
      opponentHand: [makeCard({ id: "h1", mana: 5 })],
      opponentField: [],
      playerField: [],
      opponentMana: 2,
      playerHealth: 30,
    });

    const playActions = actions.filter((a) => a.type === "PLAY_CARD");
    expect(playActions.length).toBe(0);
  });

  it("plays expensive cards first", () => {
    const actions = getAIActions({
      opponentHand: [
        makeCard({ id: "cheap", mana: 1 }),
        makeCard({ id: "expensive", mana: 3 }),
      ],
      opponentField: [],
      playerField: [],
      opponentMana: 5,
      playerHealth: 30,
    });

    const playActions = actions.filter((a) => a.type === "PLAY_CARD");
    expect(playActions.length).toBe(2);
    expect(playActions[0].cardId).toBe("expensive");
    expect(playActions[1].cardId).toBe("cheap");
  });

  it("attacks hero when no enemy minions", () => {
    const actions = getAIActions({
      opponentHand: [],
      opponentField: [makeCard({ id: "m1", canAttack: true })],
      playerField: [],
      opponentMana: 0,
      playerHealth: 30,
    });

    const attackActions = actions.filter((a) => a.type === "ATTACK_HERO");
    expect(attackActions.length).toBe(1);
    expect(attackActions[0].cardId).toBe("m1");
  });

  it("does not attack with summoning-sick minions", () => {
    const actions = getAIActions({
      opponentHand: [],
      opponentField: [makeCard({ id: "m1", canAttack: false })],
      playerField: [],
      opponentMana: 0,
      playerHealth: 30,
    });

    const attackActions = actions.filter(
      (a) => a.type === "ATTACK_HERO" || a.type === "ATTACK_MINION",
    );
    expect(attackActions.length).toBe(0);
  });

  it("respects board limit of 7", () => {
    const fullField = Array.from({ length: 7 }, (_, i) =>
      makeCard({ id: `f${i}`, canAttack: false }),
    );
    const actions = getAIActions({
      opponentHand: [makeCard({ id: "h1", mana: 1 })],
      opponentField: fullField,
      playerField: [],
      opponentMana: 10,
      playerHealth: 30,
    });

    const playActions = actions.filter((a) => a.type === "PLAY_CARD");
    expect(playActions.length).toBe(0);
  });

  it("returns actions when enemy minions present (trade or face)", () => {
    // Run multiple times since 70/30 is random
    let hadFace = false;
    let hadTrade = false;

    for (let i = 0; i < 50; i++) {
      const actions = getAIActions({
        opponentHand: [],
        opponentField: [makeCard({ id: "m1", canAttack: true })],
        playerField: [makeCard({ id: "enemy1" })],
        opponentMana: 0,
        playerHealth: 30,
      });

      const attack = actions.find(
        (a) => a.type === "ATTACK_HERO" || a.type === "ATTACK_MINION",
      );
      if (attack?.type === "ATTACK_HERO") hadFace = true;
      if (attack?.type === "ATTACK_MINION") hadTrade = true;
    }

    // Over 50 iterations, both outcomes should appear (70/30 split)
    expect(hadFace).toBe(true);
    expect(hadTrade).toBe(true);
  });
});

describe("getSimpleAIActions", () => {
  it("plays one affordable card and attacks face", () => {
    const actions = getSimpleAIActions({
      opponentHand: [
        makeCard({ id: "h1", mana: 2 }),
        makeCard({ id: "h2", mana: 1 }),
      ],
      opponentField: [makeCard({ id: "m1", canAttack: true })],
      playerField: [],
      opponentMana: 3,
      playerHealth: 30,
    });

    const playActions = actions.filter((a) => a.type === "PLAY_CARD");
    const attackActions = actions.filter((a) => a.type === "ATTACK_HERO");

    expect(playActions.length).toBe(1);
    expect(attackActions.length).toBe(1);
  });
});

describe("AI Difficulty Levels", () => {
  describe("Easy difficulty", () => {
    it("sometimes skips playing cards (30% chance)", () => {
      let totalPlayed = 0;
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const actions = getAIActions(
          {
            opponentHand: [
              makeCard({ id: "h1", mana: 1 }),
              makeCard({ id: "h2", mana: 1 }),
              makeCard({ id: "h3", mana: 1 }),
            ],
            opponentField: [],
            playerField: [],
            opponentMana: 10,
            playerHealth: 30,
          },
          "easy",
        );

        const playActions = actions.filter((a) => a.type === "PLAY_CARD");
        totalPlayed += playActions.length;
      }

      // With 3 cards and 30% skip rate, expect average around 2.1 cards played per iteration
      const avgPlayed = totalPlayed / iterations;
      expect(avgPlayed).toBeGreaterThan(1.5); // Should play some cards
      expect(avgPlayed).toBeLessThan(2.5); // But skip some too
    });

    it("heavily favors face attacks (90/10 ratio)", () => {
      let faceAttacks = 0;
      let minionAttacks = 0;
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const actions = getAIActions(
          {
            opponentHand: [],
            opponentField: [makeCard({ id: "m1", canAttack: true })],
            playerField: [makeCard({ id: "enemy1" })],
            opponentMana: 0,
            playerHealth: 30,
          },
          "easy",
        );

        const attack = actions.find(
          (a) => a.type === "ATTACK_HERO" || a.type === "ATTACK_MINION",
        );
        if (attack?.type === "ATTACK_HERO") faceAttacks++;
        if (attack?.type === "ATTACK_MINION") minionAttacks++;
      }

      // Should be roughly 90/10 split
      expect(faceAttacks).toBeGreaterThan(80);
      expect(minionAttacks).toBeLessThan(20);
    });

    it("plays cards in random order (not expensive-first)", () => {
      const orders = new Set<string>();
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        const actions = getAIActions(
          {
            opponentHand: [
              makeCard({ id: "cheap", mana: 1 }),
              makeCard({ id: "expensive", mana: 5 }),
            ],
            opponentField: [],
            playerField: [],
            opponentMana: 10,
            playerHealth: 30,
          },
          "easy",
        );

        const playActions = actions.filter((a) => a.type === "PLAY_CARD");
        if (playActions.length >= 2) {
          const order = playActions.map((a) => a.cardId).join(",");
          orders.add(order);
        }
      }

      // Should see both possible orders over 50 iterations (random, not deterministic)
      expect(orders.size).toBeGreaterThan(1);
    });
  });

  describe("Normal difficulty", () => {
    it("plays expensive cards first", () => {
      const actions = getAIActions(
        {
          opponentHand: [
            makeCard({ id: "cheap", mana: 1 }),
            makeCard({ id: "expensive", mana: 3 }),
          ],
          opponentField: [],
          playerField: [],
          opponentMana: 5,
          playerHealth: 30,
        },
        "normal",
      );

      const playActions = actions.filter((a) => a.type === "PLAY_CARD");
      expect(playActions.length).toBe(2);
      expect(playActions[0].cardId).toBe("expensive");
      expect(playActions[1].cardId).toBe("cheap");
    });

    it("uses 70/30 face/trade ratio", () => {
      let faceAttacks = 0;
      let minionAttacks = 0;
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const actions = getAIActions(
          {
            opponentHand: [],
            opponentField: [makeCard({ id: "m1", canAttack: true })],
            playerField: [makeCard({ id: "enemy1" })],
            opponentMana: 0,
            playerHealth: 30,
          },
          "normal",
        );

        const attack = actions.find(
          (a) => a.type === "ATTACK_HERO" || a.type === "ATTACK_MINION",
        );
        if (attack?.type === "ATTACK_HERO") faceAttacks++;
        if (attack?.type === "ATTACK_MINION") minionAttacks++;
      }

      // Should be roughly 70/30 split
      expect(faceAttacks).toBeGreaterThan(60);
      expect(faceAttacks).toBeLessThan(80);
      expect(minionAttacks).toBeGreaterThan(20);
      expect(minionAttacks).toBeLessThan(40);
    });
  });

  describe("Hard difficulty", () => {
    it("prioritizes killing low-health enemy minions", () => {
      const lowHealthEnemy = makeCard({ id: "weak", attack: 5, health: 2 });
      const highHealthEnemy = makeCard({ id: "strong", attack: 2, health: 10 });

      const actions = getAIActions(
        {
          opponentHand: [],
          opponentField: [makeCard({ id: "m1", attack: 3, canAttack: true })],
          playerField: [lowHealthEnemy, highHealthEnemy],
          opponentMana: 0,
          playerHealth: 30,
        },
        "hard",
      );

      const attack = actions.find((a) => a.type === "ATTACK_MINION");
      // Should attack the weak minion (can kill it with 3 attack)
      expect(attack?.targetId).toBe("weak");
    });

    it("prioritizes killing highest-attack killable target", () => {
      const weakMinion = makeCard({ id: "weak1", attack: 1, health: 2 });
      const strongMinion = makeCard({ id: "strong1", attack: 5, health: 3 });

      const actions = getAIActions(
        {
          opponentHand: [],
          opponentField: [makeCard({ id: "m1", attack: 4, canAttack: true })],
          playerField: [weakMinion, strongMinion],
          opponentMana: 0,
          playerHealth: 30,
        },
        "hard",
      );

      const attack = actions.find((a) => a.type === "ATTACK_MINION");
      // Should attack the strong minion (higher attack, still killable)
      expect(attack?.targetId).toBe("strong1");
    });

    it("uses 50/50 face/trade when can't kill anything", () => {
      let faceAttacks = 0;
      let minionAttacks = 0;
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const actions = getAIActions(
          {
            opponentHand: [],
            opponentField: [makeCard({ id: "m1", attack: 2, canAttack: true })],
            playerField: [makeCard({ id: "enemy1", health: 10 })],
            opponentMana: 0,
            playerHealth: 30,
          },
          "hard",
        );

        const attack = actions.find(
          (a) => a.type === "ATTACK_HERO" || a.type === "ATTACK_MINION",
        );
        if (attack?.type === "ATTACK_HERO") faceAttacks++;
        if (attack?.type === "ATTACK_MINION") minionAttacks++;
      }

      // Should be roughly 50/50 split
      expect(faceAttacks).toBeGreaterThan(40);
      expect(faceAttacks).toBeLessThan(60);
      expect(minionAttacks).toBeGreaterThan(40);
      expect(minionAttacks).toBeLessThan(60);
    });

    it("trades into highest attack minion when can't kill", () => {
      const weakMinion = makeCard({ id: "weak", attack: 2, health: 10 });
      const strongMinion = makeCard({ id: "strong", attack: 8, health: 10 });

      // Run multiple times since 50/50 face/trade is random
      let attackedStrongMinion = false;

      for (let i = 0; i < 50; i++) {
        const actions = getAIActions(
          {
            opponentHand: [],
            opponentField: [makeCard({ id: "m1", attack: 2, canAttack: true })],
            playerField: [weakMinion, strongMinion],
            opponentMana: 0,
            playerHealth: 30,
          },
          "hard",
        );

        const attack = actions.find((a) => a.type === "ATTACK_MINION");
        if (attack?.targetId === "strong") {
          attackedStrongMinion = true;
          break;
        }
      }

      // When it does trade, should target the highest attack minion
      expect(attackedStrongMinion).toBe(true);
    });
  });
});
