# Hand Limit (10 Cards) Implementation Guide

## Overview
Implements the maximum 10 cards in hand limit. Cards drawn when hand is full are discarded ("burned") with visual feedback.

## Current State
- No hand size limit enforced
- Drawing cards always adds to hand
- Need to add validation and burn mechanic

## Code Changes Required

### File: app/page.tsx

**Location**: `handleEndTurn` function (around line 178-216)

**Current Code**:
```typescript
const handleEndTurn = () => {
  setGameState(prev => {
    if (!prev) return prev;

    const nextTurn = prev.turn === 'player1' ? 'player2' : 'player1';
    const nextPlayer = prev[nextTurn];

    // Draw a card
    const newCard = nextPlayer.deck[0];
    const newHand = newCard ? [...nextPlayer.hand, newCard] : nextPlayer.hand;
    const newDeck = nextPlayer.deck.slice(1);

    // ... rest of function
  });
};
```

**Updated Code**:
```typescript
const handleEndTurn = () => {
  setGameState(prev => {
    if (!prev) return prev;

    const nextTurn = prev.turn === 'player1' ? 'player2' : 'player1';
    const nextPlayer = prev[nextTurn];

    // Draw a card
    const newCard = nextPlayer.deck[0];

    // Check hand limit (10 cards max)
    let newHand = nextPlayer.hand;
    let burnedCard = null;

    if (newCard) {
      if (nextPlayer.hand.length >= 10) {
        // Hand is full - burn the drawn card
        burnedCard = newCard;
        console.log(`Card burned: ${newCard.name} - hand was full!`);
      } else {
        // Add to hand
        newHand = [...nextPlayer.hand, newCard];
      }
    }

    const newDeck = nextPlayer.deck.slice(1);

    // ... rest of function (update to use newHand)
  });
};
```

## State for Burn Notification

Add state to show burn message:

**Location**: Top of component with other useState (after line 37)

```typescript
const [lastBurnedCard, setLastBurnedCard] = useState<string | null>(null);
```

**In handleEndTurn**, set the burned card:

```typescript
if (newCard) {
  if (nextPlayer.hand.length >= 10) {
    burnedCard = newCard;
    setLastBurnedCard(newCard.name);
    // Clear message after 3 seconds
    setTimeout(() => setLastBurnedCard(null), 3000);
  } else {
    newHand = [...nextPlayer.hand, newCard];
  }
}
```

## Visual Feedback UI

**Location**: Near turn indicator (around line 308-335)

Add burn notification:

```typescript
{/* Burn Notification */}
{lastBurnedCard && (
  <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
    <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-xl border-2 border-red-400">
      <div className="font-bold text-lg">🔥 Card Burned!</div>
      <div className="text-sm">{lastBurnedCard} - Hand was full (10/10)</div>
    </div>
  </div>
)}
```

## Complete Implementation

### Step 1: Add State
```typescript
const [lastBurnedCard, setLastBurnedCard] = useState<string | null>(null);
```

### Step 2: Update handleEndTurn
```typescript
const handleEndTurn = () => {
  setGameState(prev => {
    if (!prev) return prev;

    const nextTurn = prev.turn === 'player1' ? 'player2' : 'player1';
    const nextPlayer = prev[nextTurn];

    // Draw a card with hand limit check
    const newCard = nextPlayer.deck[0];
    let newHand = nextPlayer.hand;

    if (newCard) {
      if (nextPlayer.hand.length >= 10) {
        // Card is burned
        setLastBurnedCard(newCard.name);
        setTimeout(() => setLastBurnedCard(null), 3000);
      } else {
        newHand = [...nextPlayer.hand, newCard];
      }
    }

    const newDeck = nextPlayer.deck.slice(1);

    // ... (rest of function with newHand instead of constructing it)

    return {
      ...prev,
      turn: nextTurn,
      turnNumber: prev.turnNumber + (nextTurn === 'player1' ? 1 : 0),
      [nextTurn]: {
        ...nextPlayer,
        hand: newHand,  // Use the newHand we calculated
        deck: newDeck,
        mana: newMaxMana,
        maxMana: newMaxMana,
        board: newBoard,
      },
    };
  });

  setAttackState({ attackerId: null, mode: 'idle' });
};
```

### Step 3: Add UI Component
Place after turn indicator div:

```typescript
{lastBurnedCard && (
  <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
    <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-xl border-2 border-red-400 animate-bounce">
      <div className="font-bold text-lg">🔥 Card Burned!</div>
      <div className="text-sm">{lastBurnedCard} - Hand was full (10/10)</div>
    </div>
  </div>
)}
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
   - Play cards until hand has 8-9 cards
   - End turn (draw should work normally)
   - Play more cards to get exactly 10 cards in hand
   - End turn → Should see burn notification
   - Check console for burn message
   - Play some cards to reduce hand size below 10
   - End turn → Should draw normally again

3. **Visual Feedback**:
   - Burn notification should appear at top center
   - Should be visible for 3 seconds
   - Should have bouncing animation
   - Red background for emphasis

## Expected Behavior

### Before (Current - No Limit):
```
Hand: [Card1, Card2, ..., Card10, Card11]
End Turn
→ Draws Card12
→ Hand: [Card1, Card2, ..., Card11, Card12] (too many!)
```

### After (With 10 Card Limit):
```
Hand: [Card1, Card2, ..., Card10] (full)
End Turn
→ Tries to draw Card11
→ 🔥 Card Burned! Card11 - Hand was full (10/10)
→ Hand: [Card1, Card2, ..., Card10] (still 10)
```

## Integration Notes

- **AI**: AI will never hit hand limit since it plays cards aggressively
- **Fatigue**: When implemented, burned cards still consume from deck (fatigue next turn if deck empty)
- **Console**: Burn events logged to console for debugging

## Files Modified
- app/page.tsx (~15 lines added)

## Estimated Time
- Implementation: 10 minutes
- Testing: 8 minutes
- **Total: ~18 minutes**

This is a critical game rule that prevents infinite hand size and adds strategic depth to card management!
