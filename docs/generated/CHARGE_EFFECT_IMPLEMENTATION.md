# Charge Effect Implementation Guide

## Overview
Implements the Charge card effect which allows minions to attack immediately when played, bypassing summoning sickness.

## Current State
- $CHAD card already has `effect: 'charge'` defined in lib/cards.ts
- Summoning sickness currently prevents ALL minions from attacking on the turn they're played
- Need to check for charge effect and bypass this restriction

## Code Changes Required

### File: app/page.tsx

**Location**: `handlePlayCard` function (around line 65-88)

**Current Code**:
```typescript
const handlePlayCard = (cardId: string) => {
  const card = currentPlayer.hand.find(c => c.id === cardId);
  if (!card || card.cost > currentPlayer.mana) return;

  setGameState(prev => {
    if (!prev) return prev;

    const newPlayer = { ...currentPlayer };
    newPlayer.hand = newPlayer.hand.filter(c => c.id !== cardId);
    newPlayer.board.push({
      ...card,
      currentHealth: card.health,
      currentAttack: card.attack,
      canAttack: false,           // ← Always false
      summoningSickness: true,    // ← Always true
    });
    newPlayer.mana -= card.cost;

    return {
      ...prev,
      [prev.turn]: newPlayer,
    } as GameState;
  });
};
```

**Updated Code**:
```typescript
const handlePlayCard = (cardId: string) => {
  const card = currentPlayer.hand.find(c => c.id === cardId);
  if (!card || card.cost > currentPlayer.mana) return;

  setGameState(prev => {
    if (!prev) return prev;

    const newPlayer = { ...currentPlayer };
    newPlayer.hand = newPlayer.hand.filter(c => c.id !== cardId);

    // Check if card has Charge effect
    const hasCharge = card.effect === 'charge';

    newPlayer.board.push({
      ...card,
      currentHealth: card.health,
      currentAttack: card.attack,
      canAttack: hasCharge,           // Charge minions can attack immediately
      summoningSickness: !hasCharge,  // Charge bypasses summoning sickness
    });
    newPlayer.mana -= card.cost;

    return {
      ...prev,
      [prev.turn]: newPlayer,
    } as GameState;
  });
};
```

## Changes Summary
1. Add `const hasCharge = card.effect === 'charge';` before pushing to board
2. Change `canAttack: false` to `canAttack: hasCharge`
3. Change `summoningSickness: true` to `summoningSickness: !hasCharge`

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
   - Play a **normal card** (e.g., $PEPE):
     - Should appear dimmed/unselectable
     - Cannot attack the same turn
     - Can attack next turn

   - Play **$CHAD** (has charge):
     - Should appear bright/selectable immediately
     - Can attack the same turn it's played
     - Should have yellow ring when clicked
     - Can attack enemy minion or hero

3. **Visual Indicators**:
   - Charge minions should NOT be dimmed when played
   - Should be selectable with cursor-pointer
   - Yellow ring appears when selected as attacker

## Expected Behavior

### Before (Current):
```
Turn 6: Player has $CHAD in hand (6 mana cost)
→ Plays $CHAD
→ $CHAD appears on board but is dimmed
→ Cannot attack this turn
→ Must end turn and wait
```

### After (With Charge):
```
Turn 6: Player has $CHAD in hand (6 mana cost)
→ Plays $CHAD
→ $CHAD appears on board, BRIGHT and selectable
→ Click $CHAD → it gets yellow ring
→ Click enemy minion → $CHAD attacks immediately!
→ Or click enemy hero → direct 6 damage!
```

## Integration with AI

Once AI integration is complete, the AI will automatically benefit from charge minions:
- AI will recognize `canAttack: true` on newly played minions
- Will use charge minions to attack in same turn
- Makes AI more aggressive and effective

## Files Modified
- app/page.tsx (3 lines changed in handlePlayCard)

## Estimated Time
- Implementation: 2 minutes
- Testing: 5 minutes
- **Total: ~7 minutes**

This is a simple but impactful feature that makes the game more dynamic!
