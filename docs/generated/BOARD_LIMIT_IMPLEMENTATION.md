# Board Limit (7 Minions) Implementation Guide

## Overview
Implements the maximum 7 minions per player board limit. Cards cannot be played if the board is full.

## Current State
- No board size limit enforced
- Players can theoretically play unlimited minions
- Need to add validation to prevent playing when board is full

## Code Changes Required

### File: app/page.tsx

**Location**: `handlePlayCard` function (around line 65-88)

**Current Code**:
```typescript
const handlePlayCard = (cardId: string) => {
  const card = currentPlayer.hand.find(c => c.id === cardId);
  if (!card || card.cost > currentPlayer.mana) return;
  // ... rest of function
};
```

**Updated Code**:
```typescript
const handlePlayCard = (cardId: string) => {
  const card = currentPlayer.hand.find(c => c.id === cardId);
  if (!card || card.cost > currentPlayer.mana) return;

  // Prevent playing if board is full (7 minions max)
  if (currentPlayer.board.length >= 7) return;

  // ... rest of function
};
```

### Also Update Card Playability Display

**Location**: Player hand rendering (around line 419)

**Current Code**:
```typescript
<Card
  card={card}
  onClick={() => handlePlayCard(card.id)}
  isPlayable={card.cost <= currentPlayer.mana}
  isInHand={true}
/>
```

**Updated Code**:
```typescript
<Card
  card={card}
  onClick={() => handlePlayCard(card.id)}
  isPlayable={card.cost <= currentPlayer.mana && currentPlayer.board.length < 7}
  isInHand={true}
/>
```

## Changes Summary
1. Add board size check in `handlePlayCard`: `if (currentPlayer.board.length >= 7) return;`
2. Update card playability in hand: `isPlayable={card.cost <= currentPlayer.mana && currentPlayer.board.length < 7}`

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
   - Play 1-6 minions: Should work normally
   - Play 7th minion: Should work, board is now full
   - Try to play 8th minion:
     - Card should be dimmed in hand
     - Clicking card does nothing
     - No error messages
   - Attack with minion or use hero power (future): Board space should free up
   - Can then play more minions

3. **Visual Feedback**:
   - Cards that can't be played due to board limit should appear dimmed
   - Hover effect should still work but clicking has no effect

## Expected Behavior

### Before (Current - No Limit):
```
Board: [Minion1, Minion2, Minion3, Minion4, Minion5, Minion6, Minion7]
Hand: [Minion8 - bright, clickable]
→ Click Minion8
→ Plays to board (8 minions! - wrong)
```

### After (With 7 Minion Limit):
```
Board: [Minion1, Minion2, Minion3, Minion4, Minion5, Minion6, Minion7]
Hand: [Minion8 - dimmed, unplayable]
→ Click Minion8
→ Nothing happens (board is full)
→ Kill enemy minion to make space
→ Minion8 becomes bright again
→ Can now play Minion8
```

## Integration with AI

The AI already checks board size in its decision logic (`lib/ai.ts`):
```typescript
function chooseBestCardToPlay(hand: Card[], availableMana: number, boardSize: number): Card | null {
  // Don't play if board is full (7 minions)
  if (boardSize >= 7) return null;
  // ...
}
```

So AI will automatically respect the board limit once it's enforced in `handlePlayCard`.

## UI Enhancement (Optional)

Could add a visual indicator when board is full:

**Location**: Above player board (around line 340)

```typescript
{currentPlayer.board.length >= 7 && (
  <div className="text-center text-orange-400 text-sm mb-2">
    ⚠️ Board Full (7/7)
  </div>
)}
```

## Files Modified
- app/page.tsx (2 lines added)

## Estimated Time
- Implementation: 3 minutes
- Testing: 5 minutes
- **Total: ~8 minutes**

This is a critical game rule that prevents board spam and adds strategic depth!
