# AI Opponent Implementation Guide

## Quick Start (5 minutes)

This guide shows you how to integrate the AI opponent into the game. The AI logic is already complete in `lib/ai.ts` - we just need to hook it up to the game.

---

## Step 1: Add AI Import

**File**: `app/page.tsx`
**Line**: ~7 (after other imports)

**Find this:**
```typescript
import { GameState, Player, BoardCard } from '@/lib/types';
```

**Change to:**
```typescript
import { GameState, Player, BoardCard } from '@/lib/types';
import { planAITurn, AIAction } from '@/lib/ai';
```

---

## Step 2: Add AI Turn Effect

**File**: `app/page.tsx`
**Location**: After the first `useEffect` hook (around line 50)

**Find this:**
```typescript
  }, []); // Only run once on mount

  // Don't render until state is initialized
  if (!gameState) {
```

**Insert this BETWEEN those two sections:**
```typescript
  }, []); // Only run once on mount

  // AI Turn Logic - Execute when it's player2's turn
  useEffect(() => {
    if (!gameState || gameState.turn !== 'player2' || gameState.winner) return;

    const executeAITurn = async () => {
      // Small delay before AI starts (feels more natural)
      await new Promise(resolve => setTimeout(resolve, 800));

      const actions = planAITurn(gameState.player2, gameState.player1);

      // Execute each action with a delay for visual feedback
      for (const action of actions) {
        await new Promise(resolve => setTimeout(resolve, 600));

        if (action.type === 'PLAY_CARD') {
          const card = gameState.player2.hand.find(c => c.id === action.cardId);
          if (card && card.cost <= gameState.player2.mana && gameState.player2.board.length < 7) {
            setGameState(prev => {
              if (!prev) return prev;
              const newPlayer = { ...prev.player2 };
              newPlayer.hand = newPlayer.hand.filter(c => c.id !== action.cardId);

              // Check if card has Charge effect
              const hasCharge = card.effect === 'charge';

              newPlayer.board.push({
                ...card,
                currentHealth: card.health,
                currentAttack: card.attack,
                canAttack: hasCharge,
                summoningSickness: !hasCharge,
              });
              newPlayer.mana -= card.cost;

              return { ...prev, player2: newPlayer } as GameState;
            });
          }
        } else if (action.type === 'ATTACK_MINION' && action.targetId) {
          setGameState(prev => {
            if (!prev) return prev;
            const newState = { ...prev };
            const attacker = newState.player2.board.find(c => c.id === action.cardId);
            const defender = newState.player1.board.find(c => c.id === action.targetId);

            if (attacker && defender && attacker.canAttack) {
              attacker.currentHealth -= defender.currentAttack;
              defender.currentHealth -= attacker.currentAttack;
              attacker.canAttack = false;

              newState.player2.board = newState.player2.board.filter(c => c.currentHealth > 0);
              newState.player1.board = newState.player1.board.filter(c => c.currentHealth > 0);
            }
            return newState as GameState;
          });
        } else if (action.type === 'ATTACK_HERO') {
          setGameState(prev => {
            if (!prev) return prev;
            const attacker = prev.player2.board.find(c => c.id === action.cardId);
            if (attacker && attacker.canAttack) {
              const newState = { ...prev };
              newState.player1.health -= attacker.currentAttack;
              attacker.canAttack = false;
              if (newState.player1.health <= 0) newState.winner = 'player2';
              return newState as GameState;
            }
            return prev;
          });
        } else if (action.type === 'END_TURN') {
          setGameState(prev => {
            if (!prev) return prev;

            const nextTurn = 'player1';
            const nextPlayer = prev.player1;

            // Draw a card
            const newCard = nextPlayer.deck[0];
            const newHand = newCard ? [...nextPlayer.hand, newCard] : nextPlayer.hand;
            const newDeck = nextPlayer.deck.slice(1);

            // Increase max mana
            const newMaxMana = Math.min(nextPlayer.maxMana + 1, 10);

            // Remove summoning sickness and refresh attacks
            const newBoard = nextPlayer.board.map(c => ({
              ...c,
              summoningSickness: false,
              canAttack: true,
            }));

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
              },
            };
          });
        }
      }
    };

    executeAITurn();
  }, [gameState?.turn, gameState?.turnNumber]); // Re-run when turn changes

  // Don't render until state is initialized
  if (!gameState) {
```

---

## Step 3: Verify Build

Run this in your terminal:
```bash
npm run build
```

Should see: `✓ Compiled successfully`

---

## Step 4: Test the AI

```bash
npm run dev
```

Open http://localhost:3000 and:
1. Play a few cards
2. Click "End Turn"
3. Watch the AI automatically:
   - Play cards from its hand
   - Attack your minions (making smart trades)
   - Attack your hero when no good trades exist
   - End its turn automatically

---

## What the AI Does

The AI opponent will:
- ✅ Play the highest-cost cards it can afford (up to 7 minions)
- ✅ Evaluate all possible attacks and choose the best trades
- ✅ Attack your hero when no favorable trades exist
- ✅ Respect the Charge effect (charge minions attack immediately)
- ✅ End turn automatically after completing all actions
- ✅ Add delays between actions for visual clarity

---

## Bonus: Charge Effect Included!

Notice in the AI code above:
```typescript
const hasCharge = card.effect === 'charge';

newPlayer.board.push({
  ...card,
  currentHealth: card.health,
  currentAttack: card.attack,
  canAttack: hasCharge,  // ✅ Charge minions can attack immediately
  summoningSickness: !hasCharge,  // ✅ Bypass summoning sickness
});
```

This means **Charge Effect is already implemented** for the AI! You'll need to apply the same change to the human player's `handlePlayCard` function (around line 74).

---

## Next Steps

After AI is working:
1. ✅ AI Opponent - DONE!
2. ✅ Charge Effect - DONE (for AI, need to add to player)
3. ⬜ Apply Charge to player's handlePlayCard function
4. ⬜ Implement Taunt Effect
5. ⬜ Implement Hand Limit (10 cards max with burn)
6. ⬜ Implement Battlecry/Deathrattle effects

---

## Troubleshooting

**Build fails?**
- Make sure you copied the code exactly
- Check for missing brackets or parentheses
- Look for TypeScript errors in the output

**AI doesn't play?**
- Check browser console for errors (F12)
- Make sure you clicked "End Turn" to switch to player2
- Verify the import statement was added at the top

**AI plays too fast?**
- Increase the delay values (600ms and 800ms) in the code
- This makes it easier to see what the AI is doing

---

## Summary

You've just integrated a fully functional AI opponent! The AI uses the logic from `lib/ai.ts` to:
1. Analyze the game state
2. Decide which cards to play
3. Choose optimal attack targets
4. Make intelligent trades vs going face

The game is now playable solo against the AI!
