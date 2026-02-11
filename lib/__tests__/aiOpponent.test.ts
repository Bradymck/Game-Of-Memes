import { describe, it, expect } from "vitest";
import { getAIActions, getSimpleAIActions } from "../aiOpponent";
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
