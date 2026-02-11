# Deathrattle Implementation Status - Loop 26

## STATUS: PARTIALLY COMPLETE (2/3 files)

### ✅ Completed
1. **lib/cards.ts** - Added `effect: 'deathrattle'` to $WOJAK card (Line 51)
2. **lib/effects.ts** - Implemented wojakDeathrattle function and updated executeDeathrattle

### ❌ Blocked
3. **app/page.tsx** - Cannot modify due to file permissions

## What's Working
- `npm run build` **PASSES** ✅
- $WOJAK card now has deathrattle property
- Effect system can execute deathrattle logic
- wojakDeathrattle deals 1 damage to enemy hero

## What's NOT Working
- Deathrattle **does not trigger in-game** because app/page.tsx hasn't been updated
- When $WOJAK dies, the deathrattle effect will not execute
- No visual notification appears for deathrattle

## To Complete Implementation

### Option 1: Manual Edits
See `DEATHRATTLE_CHANGES_NEEDED.md` for all 7 required changes to app/page.tsx

### Option 2: Automated Script
I can create a script to apply the changes if given execute permissions

### Option 3: Use claude-code with file permissions
Grant write permissions to app/page.tsx and re-run this task

## Files Changed So Far

### lib/cards.ts (MODIFIED)
```diff
  {
    id: 'wojak-1',
    name: '$WOJAK',
    imageUrl: '/wojak-meme-face-crying-trader.jpg',
    description: 'Panic sells. Paper hands.',
+   effect: 'deathrattle',
    ...calculateCardStats({
```

### lib/effects.ts (MODIFIED)
```diff
export function executeDeathrattle(
  card: BoardCard,
  owningPlayer: Player,
  opponentPlayer: Player
): EffectResult {
  if (card.effect !== 'deathrattle') {
    return { success: false, message: 'Card has no deathrattle effect' };
  }

+  // $WOJAK Deathrattle: Deal 1 damage to the enemy hero
+  if (card.name === '$WOJAK') {
+    return wojakDeathrattle(opponentPlayer);
+  }
+
  // Add more deathrattle effects here as new cards are added
  return { success: false, message: 'Unknown deathrattle effect' };
}

+/**
+ * $WOJAK Deathrattle: Deal 1 damage to the enemy hero
+ * Thematically: "Takes you down with them" - panic spreads
+ */
+function wojakDeathrattle(opponentPlayer: Player): EffectResult {
+  const damage = 1;
+  opponentPlayer.health -= damage;
+
+  return {
+    success: true,
+    message: `Enemy hero took ${damage} damage!`,
+    damage: damage,
+  };
+}
```

Also updated `getEffectDescription()`:
```diff
case 'deathrattle':
+  if (cardName === '$WOJAK') {
+    return 'Deathrattle: Deal 1 damage to the enemy hero';
+  }
  return 'Deathrattle: Special effect when this minion dies';
```

## Next Steps

1. **Apply changes from DEATHRATTLE_CHANGES_NEEDED.md** to app/page.tsx
2. **Run** `npm run build` to verify
3. **Test** with `npm run dev`:
   - Play $WOJAK
   - Let opponent kill it
   - Verify orange 💀 notification appears
   - Verify enemy hero takes 1 damage
4. **Mark task complete** in @fix_plan.md

## Testing Checklist (After app/page.tsx is updated)

- [ ] Build passes (`npm run build`)
- [ ] Dev server runs (`npm run dev`)
- [ ] $WOJAK card shows in deck
- [ ] $WOJAK can be played
- [ ] When $WOJAK dies in combat → Deathrattle triggers
- [ ] Orange notification with 💀 icon appears
- [ ] Enemy hero takes 1 damage
- [ ] Notification shows "Enemy hero took 1 damage!"
- [ ] Notification disappears after 3 seconds
- [ ] AI can play and trigger $WOJAK deathrattle
- [ ] Multiple deathrattles can trigger in same turn
- [ ] Deathrattle triggers from:
  - [ ] Minion-on-minion combat
  - [ ] Hero attack back damage (if applicable)
  - [ ] Battlecry damage (if $BEAR kills $WOJAK)

## Why This Approach

**Using $WOJAK Instead of Creating New Card:**
- Existing card with art
- Thematic fit ("panic spreads")
- Low cost = easy to test
- No new assets needed

**Deathrattle Effect Choice:**
- 1 damage to enemy hero is small but meaningful
- Creates interesting trading decisions
- Not overpowered
- Visible impact on game state

**Integration Points:**
- 4 locations where minions die (2 in AI turn, 2 in player turn)
- Executes before minion moves to graveyard
- Proper player reference (owner vs opponent)
- Visual feedback matches battlecry pattern

## Build Output

```
> game-of-memes@1.0.0 build
> next build

   ▲ Next.js 16.0.6 (Turbopack)

   Creating an optimized production build ...
 ✓ Compiled successfully in 1134.3ms
   Running TypeScript ...
   Collecting page data using 9 workers ...
   Generating static pages using 9 workers (0/3) ...
 ✓ Generating static pages using 9 workers (3/3) in 210.3ms
   Finalizing page optimization ...

Route (app)
┌ ○ /
└ ○ /_not-found


○  (Static)  prerendered as static content
```

**Status: PASSING** ✅

## Summary

**Progress: 66% Complete (2/3 files)**

| File | Status | Lines Changed |
|------|--------|---------------|
| lib/cards.ts | ✅ DONE | 1 line |
| lib/effects.ts | ✅ DONE | ~30 lines |
| app/page.tsx | ❌ BLOCKED | ~95 lines |

**Total Implementation:** ~126 lines across 3 files
**Completed:** ~31 lines (25%)
**Remaining:** ~95 lines (75%)

The implementation is **functionally complete** but **not integrated** into the game UI.
