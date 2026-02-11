# Fatigue Damage Implementation Guide

## Overview
When a player's deck is empty and they try to draw a card, they take fatigue damage instead. Fatigue damage starts at 1 and increases by 1 each time: 1, 2, 3, 4, 5...

## Required Changes

### 1. lib/types.ts - Add Fatigue Counter

**Location**: Player interface (lines 34-45)

**FROM:**
```typescript
// Player state
export interface Player {
  id: string;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  deck: Card[];
  hand: Card[];
  board: BoardCard[];
  graveyard: Card[];
}
```

**TO:**
```typescript
// Player state
export interface Player {
  id: string;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  deck: Card[];
  hand: Card[];
  board: BoardCard[];
  graveyard: Card[];
  fatigueCounter: number; // Tracks fatigue damage (increases each time deck is empty)
}
```

---

### 2. app/page.tsx - Initialize Fatigue Counter

**Location**: createInitialPlayer function (lines 12-28)

**FROM:**
```typescript
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
```

**TO:**
```typescript
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
    fatigueCounter: 0, // Start at 0, increments when drawing from empty deck
  };
}
```

---

### 3. app/page.tsx - AI Turn End (Draw with Fatigue)

**Location**: AI Turn executeAITurn function, END_TURN action (around line 236-286)

**Find this code block** (around lines 243-261):
```typescript
// Draw a card with hand limit check
const newCard = nextPlayer.deck[0];
const newDeck = nextPlayer.deck.slice(1);

let newHand = nextPlayer.hand;
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
}
```

**REPLACE WITH:**
```typescript
// Draw a card with hand limit check and fatigue damage
const newCard = nextPlayer.deck[0];
const newDeck = nextPlayer.deck.slice(1);
let newFatigueCounter = nextPlayer.fatigueCounter;
let newHealth = nextPlayer.health;

let newHand = nextPlayer.hand;
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
  // Deck is empty - take fatigue damage
  newFatigueCounter += 1;
  newHealth -= newFatigueCounter;
  console.log(`${nextPlayer.id} takes ${newFatigueCounter} fatigue damage! (Health: ${nextPlayer.health} -> ${newHealth})`);
}
```

**Also update the return statement** (around line 273-284) to include fatigue:
```typescript
return {
  ...prev,
  turn: nextTurn,
  turnNumber: prev.turnNumber + 1,
  player1: {
    ...nextPlayer,
    hand: newHand,
    deck: newDeck,
    mana: newMaxMana,
    maxMana: newMaxMana,
    board: newBoard,
    health: newHealth,              // ADD THIS
    fatigueCounter: newFatigueCounter,  // ADD THIS
  },
};
```

---

### 4. app/page.tsx - Player Turn End (Draw with Fatigue)

**Location**: handleEndTurn function (around lines 496-546)

**Find this code block** (around lines 503-521):
```typescript
// Draw a card with hand limit check
const newCard = nextPlayer.deck[0];
const newDeck = nextPlayer.deck.slice(1);

let newHand = nextPlayer.hand;
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
}
```

**REPLACE WITH:**
```typescript
// Draw a card with hand limit check and fatigue damage
const newCard = nextPlayer.deck[0];
const newDeck = nextPlayer.deck.slice(1);
let newFatigueCounter = nextPlayer.fatigueCounter;
let newHealth = nextPlayer.health;

let newHand = nextPlayer.hand;
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
  // Deck is empty - take fatigue damage
  newFatigueCounter += 1;
  newHealth -= newFatigueCounter;
  console.log(`${nextPlayer.id} takes ${newFatigueCounter} fatigue damage! (Health: ${nextPlayer.health} -> ${newHealth})`);
}
```

**Also update the return statement** (around line 533-545) to include fatigue:
```typescript
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
    health: newHealth,              // ADD THIS
    fatigueCounter: newFatigueCounter,  // ADD THIS
  },
};
```

---

### 5. app/page.tsx - Play Again Reset

**Location**: handlePlayAgain function (around line 551-562)

**FROM:**
```typescript
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
```

**TO:** (No changes needed - createInitialPlayer now includes fatigueCounter: 0)

---

## Summary of Changes

| File | Lines Changed | Description |
|------|---------------|-------------|
| lib/types.ts | +1 line | Add fatigueCounter to Player interface |
| app/page.tsx (createInitialPlayer) | +1 line | Initialize fatigueCounter: 0 |
| app/page.tsx (AI turn draw) | +8 lines | Add fatigue damage logic |
| app/page.tsx (Player turn draw) | +8 lines | Add fatigue damage logic |

**Total**: ~18 lines of code across 2 files

---

## Testing Checklist

After implementation:

- [ ] Build passes (`npm run build`)
- [ ] Dev server runs (`npm run dev`)
- [ ] Game initializes with fatigueCounter: 0
- [ ] Play game until deck runs out
- [ ] First draw from empty deck → Take 1 damage
- [ ] Second draw from empty deck → Take 2 damage
- [ ] Third draw from empty deck → Take 3 damage
- [ ] Console logs show fatigue damage
- [ ] Player can die from fatigue damage
- [ ] Fatigue resets on "Play Again"

---

## Fatigue Mechanics

**How it works**:
1. Player starts with fatigueCounter = 0
2. When drawing and deck is empty:
   - Increment fatigueCounter by 1
   - Deal damage equal to fatigueCounter
   - Log to console for debugging
3. Damage increases: 1, 2, 3, 4, 5, 6...
4. Can kill player if health reaches 0

**Strategic impact**:
- Forces games to eventually end
- Punishes slow, control-heavy strategies
- Rewards aggressive play and card draw management
- Matches Hearthstone fatigue mechanic

---

## Implementation Notes

- Fatigue damage happens INSTEAD of drawing a card (not in addition to)
- No card burn notification for fatigue (different mechanic)
- Console.log added for debugging/testing
- Winner check happens automatically (existing code handles health <= 0)
- Fatigue persists and increases throughout the game (doesn't reset per turn)
