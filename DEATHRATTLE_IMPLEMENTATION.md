# Deathrattle Effect Implementation Guide

## Overview
Implementing Deathrattle effect for Game of Memes - triggers when a minion dies.

## Files to Modify

### 1. lib/cards.ts
**Action**: Add `effect: 'deathrattle'` to $WOJAK card

**Location**: Line 49 (after description)

**Change**:
```typescript
{
  id: 'wojak-1',
  name: '$WOJAK',
  imageUrl: '/wojak-meme-face-crying-trader.jpg',
  description: 'Panic sells. Paper hands.',
  effect: 'deathrattle',  // ADD THIS LINE
  ...calculateCardStats({
    price: 0.00012,
    marketCap: 45_000,
    liquidity: 8_000,
    volume24h: 12_000,
    priceChange24h: -15.5,
  }),
  // ... rest of card
}
```

**Rationale**: $WOJAK thematically fits deathrattle - "takes you down with them" through panic/FUD spreading.

---

### 2. lib/effects.ts
**Action**: Implement wojakDeathrattle function

**Location**: Lines 77-90 (replace stub implementation)

**Change**:
```typescript
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
```

**Also update getEffectDescription** (around line 109):
```typescript
case 'deathrattle':
  if (cardName === '$WOJAK') {
    return 'Deathrattle: Deal 1 damage to the enemy hero';
  }
  return 'Deathrattle: Special effect when this minion dies';
```

---

### 3. app/page.tsx
**Action**: Integrate deathrattle execution in 4 locations where minions die

**Import**: Already has `import { executeBattlecry, EffectResult } from '@/lib/effects';`
**Update to**: `import { executeBattlecry, executeDeathrattle, EffectResult } from '@/lib/effects';`

#### Location 1: Lines 138-143 (AI Battlecry cleanup)
**Replace**:
```typescript
// Remove dead minions after battlecry damage
opponentPlayer.board = opponentPlayer.board.filter(minion => {
  if (minion.currentHealth <= 0) {
    opponentPlayer.graveyard.push(minion);
    return false;
  }
  return true;
});
```

**With**:
```typescript
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
```

#### Location 2: Lines 166-167 (AI Combat cleanup)
**Replace**:
```typescript
newState.player2.board = newState.player2.board.filter(c => c.currentHealth > 0);
newState.player1.board = newState.player1.board.filter(c => c.currentHealth > 0);
```

**With**:
```typescript
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
```

#### Location 3: Lines 299-305 (Player Battlecry cleanup)
**Replace**: Same pattern as Location 1, but with correct player references
```typescript
// Remove dead minions after battlecry damage
opponentPlayer.board = opponentPlayer.board.filter(minion => {
  if (minion.currentHealth <= 0) {
    // Execute deathrattle before moving to graveyard
    if (minion.effect === 'deathrattle') {
      const deathrattleResult = executeDeathrattle(minion, opponentPlayer, attackingPlayer);
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
```

#### Location 4: Lines 349-363 (Player Combat cleanup)
**Replace**:
```typescript
// Remove dead minions
attackingPlayer.board = attackingPlayer.board.filter(c => {
  if (c.currentHealth <= 0) {
    attackingPlayer.graveyard.push(c);
    return false;
  }
  return true;
});

defendingPlayer.board = defendingPlayer.board.filter(c => {
  if (c.currentHealth <= 0) {
    defendingPlayer.graveyard.push(c);
    return false;
  }
  return true;
});
```

**With**:
```typescript
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
```

#### Update Effect Notification UI (around line 530)
Change color from purple (battlecry) to orange (deathrattle):
```typescript
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
```

#### Update Instructions Tip (around line 749)
```typescript
<div className="text-xs text-gray-500">
  Tip: Cards with ⚡ Battlecry trigger when played. Cards with 💀 Deathrattle trigger when they die!
</div>
```

---

## How Deathrattle Works

**Game Mechanic**:
- Triggers when minion's health reaches 0 or below
- Executes BEFORE minion is moved to graveyard
- $WOJAK: Deals 1 damage to enemy hero (panic spreads!)
- Multiple deathrattles can trigger in sequence

**Visual Feedback**:
- 💀 Skull emoji icon
- Orange background (distinct from purple battlecry)
- Shows "Deathrattle!" title
- Displays effect message
- Animates with scale + opacity
- Auto-disappears after 3 seconds

**Integration Points**:
1. After battlecry damage (both players)
2. After minion combat (both directions)
3. Proper player reference (owning player vs opponent)

---

## Testing Checklist

After implementation, test with `npm run dev`:

- [ ] Play $WOJAK card
- [ ] Let opponent kill $WOJAK
- [ ] Verify deathrattle notification appears (💀 orange banner)
- [ ] Verify enemy hero takes 1 damage
- [ ] Verify message shows "Enemy hero took 1 damage!"
- [ ] Verify notification disappears after 3 seconds
- [ ] Test when AI plays and dies with $WOJAK
- [ ] Test multiple $WOJAK deaths in same turn
- [ ] Verify deathrattle triggers from:
  - [ ] Minion combat
  - [ ] Battlecry damage (if $BEAR kills $WOJAK)
- [ ] Instructions show deathrattle tip

---

## Build Verification

```bash
npm run build
```

Should compile without TypeScript errors.

---

## Why $WOJAK?

**Thematic fit**:
- Wojak = crying trader, panic seller, paper hands
- "Takes you down with them" fits the character
- Panic/FUD spreads to opponent (hero damage)
- Low-cost card makes deathrattle easy to test
- Existing card art fits the mechanic

**Balance**:
- 1 damage is small but noticeable
- Won't break game balance
- Creates interesting trading decisions
- Enemy must consider face damage when clearing

---

## Extensibility

Easy to add more deathrattle cards:

```typescript
if (card.name === '$NEWCARD') {
  return newCardDeathrattle(owningPlayer, opponentPlayer);
}
```

Examples for future cards:
- Summon a 1/1 token for owning player
- Draw a card
- Deal damage to all minions
- Heal friendly hero
- Add card to hand

---

## Summary

**Changes**:
1. lib/cards.ts: Add `effect: 'deathrattle'` to $WOJAK (1 line)
2. lib/effects.ts: Implement wojakDeathrattle function (~20 lines)
3. app/page.tsx: Integrate deathrattle in 4 death locations (~80 lines)
4. app/page.tsx: Update UI for deathrattle color/icon (~15 lines)

**Total**: ~116 lines changed/added across 3 files

**Effect**: $WOJAK now deals 1 damage to enemy hero when killed - adds strategic depth to trading decisions!
