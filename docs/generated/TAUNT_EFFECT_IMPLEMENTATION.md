# Taunt Effect Implementation Guide

## Overview
Implements the Taunt card effect. Taunt minions must be attacked before other targets (minions or hero).

## Current State
- Players can attack any enemy target freely
- No forced attack ordering
- Need to add taunt validation and visual indicators

## Code Changes Required

### File: app/page.tsx

#### 1. Update Attack Validation Functions

**Location**: `handleAttackMinion` and `handleAttackHero` (around lines 97-176)

Add helper function to check for taunt:

```typescript
// Add this helper function before handleAttackMinion
const enemyHasTaunt = (enemyPlayer: Player): boolean => {
  return enemyPlayer.board.some(minion => minion.effect === 'taunt');
};
```

**Update handleAttackMinion**:

**Current Code**:
```typescript
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

    // Skip if already attacked
    if (!attacker.canAttack) return prev;

    // Deal damage ...
  });
};
```

**Updated Code**:
```typescript
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

    // Skip if already attacked
    if (!attacker.canAttack) return prev;

    // TAUNT CHECK: Cannot attack non-taunt minions if taunt exists
    const hasTaunt = enemyHasTaunt(defendingPlayer);
    if (hasTaunt && defender.effect !== 'taunt') {
      // Trying to attack non-taunt when taunt exists - block it
      return prev;
    }

    // Deal damage ...
  });
};
```

**Update handleAttackHero**:

**Current Code**:
```typescript
const handleAttackHero = () => {
  if (!attackState.attackerId) return;

  setGameState(prev => {
    if (!prev) return prev;

    const newState = { ...prev };
    const attackingPlayer = newState[currentPlayerId];
    const defendingPlayer = newState[opponentId];

    const attacker = attackingPlayer.board.find(c => c.id === attackState.attackerId);
    if (!attacker) return prev;

    // Skip if already attacked
    if (!attacker.canAttack) return prev;

    // Deal damage to hero ...
  });
};
```

**Updated Code**:
```typescript
const handleAttackHero = () => {
  if (!attackState.attackerId) return;

  setGameState(prev => {
    if (!prev) return prev;

    const newState = { ...prev };
    const attackingPlayer = newState[currentPlayerId];
    const defendingPlayer = newState[opponentId];

    const attacker = attackingPlayer.board.find(c => c.id === attackState.attackerId);
    if (!attacker) return prev;

    // Skip if already attacked
    if (!attacker.canAttack) return prev;

    // TAUNT CHECK: Cannot attack hero if taunt minion exists
    if (enemyHasTaunt(defendingPlayer)) {
      return prev;
    }

    // Deal damage to hero ...
  });
};
```

### File: components/Card.tsx

#### 2. Add Visual Indicator for Taunt

**Location**: Card component render (around line 30-122)

Add taunt border and shield icon:

**Current Code** (around line 43):
```typescript
className={`
  relative w-32 h-48 rounded-xl overflow-hidden cursor-pointer
  bg-gradient-to-br ${rarityColors[card.rarity]}
  shadow-lg ${isPlayable ? `${rarityGlow[card.rarity]} hover:shadow-xl` : ''}
  ${!isPlayable && !isSelected && 'opacity-60 cursor-not-allowed'}
  ${isSelected && 'ring-4 ring-yellow-400 scale-105'}
`}
```

**Updated Code**:
```typescript
className={`
  relative w-32 h-48 rounded-xl overflow-hidden cursor-pointer
  bg-gradient-to-br ${rarityColors[card.rarity]}
  shadow-lg ${isPlayable ? `${rarityGlow[card.rarity]} hover:shadow-xl` : ''}
  ${!isPlayable && !isSelected && 'opacity-60 cursor-not-allowed'}
  ${isSelected && 'ring-4 ring-yellow-400 scale-105'}
  ${'effect' in card && card.effect === 'taunt' && 'ring-4 ring-amber-500 shadow-amber-500/50'}
`}
```

Add shield icon for taunt:

**Location**: After rarity indicator (around line 111-119)

```typescript
{/* Taunt indicator */}
{'effect' in card && card.effect === 'taunt' && (
  <div className="absolute top-2 left-2 z-10">
    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
      <span className="text-white text-xl">🛡️</span>
    </div>
  </div>
)}
```

## Add a Taunt Card

### File: lib/cards.ts

Add or modify a card to have taunt:

**Location**: MEME_CARDS_WITH_MARKET_DATA array

**Example** - Modify $BEAR to have taunt instead of battlecry:

```typescript
{
  id: 'bear-1',
  name: '$BEAR',
  imageUrl: '/scary-bear-market-crash-meme.jpg',
  description: 'Market guardian. Must be dealt with first.',
  effect: 'taunt',  // Changed from 'battlecry'
  ...calculateCardStats({
    price: 0.028,
    marketCap: 2_800_000,
    liquidity: 450_000,
    volume24h: 980_000,
    priceChange24h: 8.4,
  }),
  // ... marketData
}
```

## Complete Implementation Summary

### app/page.tsx Changes:

1. **Add helper function** (before handleAttackMinion):
```typescript
const enemyHasTaunt = (enemyPlayer: Player): boolean => {
  return enemyPlayer.board.some(minion => minion.effect === 'taunt');
};
```

2. **Update handleAttackMinion** - add taunt check:
```typescript
const hasTaunt = enemyHasTaunt(defendingPlayer);
if (hasTaunt && defender.effect !== 'taunt') {
  return prev;  // Block attack on non-taunt
}
```

3. **Update handleAttackHero** - add taunt check:
```typescript
if (enemyHasTaunt(defendingPlayer)) {
  return prev;  // Block face damage
}
```

### components/Card.tsx Changes:

4. **Add taunt ring** to className:
```typescript
${'effect' in card && card.effect === 'taunt' && 'ring-4 ring-amber-500 shadow-amber-500/50'}
```

5. **Add shield icon**:
```typescript
{'effect' in card && card.effect === 'taunt' && (
  <div className="absolute top-2 left-2 z-10">
    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
      <span className="text-white text-xl">🛡️</span>
    </div>
  </div>
)}
```

### lib/cards.ts Changes:

6. **Modify $BEAR card**:
```typescript
effect: 'taunt',  // Instead of 'battlecry'
description: 'Market guardian. Must be dealt with first.',
```

## Testing

After implementing:

1. **Build Test**:
   ```bash
   npm run build
   ```
   Should compile without errors.

2. **Manual Testing**:
   ```bash
   npm run dev
   ```

   Test cases:

   **Scenario 1: Taunt Blocking Face**
   - Opponent has $BEAR (taunt) on board
   - Player has attacker ready
   - Try to attack enemy hero
   - **Expected**: Attack blocked (nothing happens)
   - Kill the taunt minion
   - Try to attack enemy hero again
   - **Expected**: Attack succeeds

   **Scenario 2: Taunt Blocking Non-Taunt**
   - Opponent has $BEAR (taunt) AND $PEPE (no taunt)
   - Player has attacker ready
   - Try to attack $PEPE
   - **Expected**: Attack blocked
   - Try to attack $BEAR
   - **Expected**: Attack succeeds

   **Scenario 3: Visual Indicators**
   - Play $BEAR
   - **Expected**:
     - Amber/gold ring around card
     - Shield icon (🛡️) in top-left
     - Clearly distinguishable from normal cards

3. **AI Integration**:
   - AI should recognize taunt minions
   - AI's `chooseBestAttackTarget` may need update to handle taunt
   - Test AI respects taunt rules

## Expected Behavior

### Before (Current - No Taunt):
```
Enemy Board: [$BEAR (5/4), $PEPE (1/1)]
Your Board: [$CHAD (6/5) ready to attack]

Click $CHAD → Click $PEPE
→ $PEPE dies (1/1 can't survive 6 damage)

Click $CHAD → Click Enemy Hero
→ Hero takes 6 damage
```

### After (With Taunt):
```
Enemy Board: [$BEAR (5/4, TAUNT 🛡️), $PEPE (1/1)]
Your Board: [$CHAD (6/5) ready to attack]

Click $CHAD → Click $PEPE
→ Nothing happens (must attack taunt first!)

Click $CHAD → Click Enemy Hero
→ Nothing happens (must kill taunt first!)

Click $CHAD → Click $BEAR
→ $CHAD attacks $BEAR (both take damage)
→ After $BEAR dies, can now attack $PEPE or hero
```

## Files Modified
- app/page.tsx (~10 lines added)
- components/Card.tsx (~8 lines added)
- lib/cards.ts (1 card modified)

## Estimated Time
- Implementation: 15 minutes
- Testing: 10 minutes
- **Total: ~25 minutes**

Taunt is a defensive mechanic that protects vulnerable minions and forces favorable trades!
