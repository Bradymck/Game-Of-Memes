# Loop 29 Status - Lifesteal Implementation

## CURRENT STATUS: BLOCKED - FILE PERMISSIONS

### Task: Implement Lifesteal Effect (Priority 4)

---

## ✅ COMPLETED (1/2 files)

### 1. lib/cards.ts - $VAMP Card Added
**Status:** ✅ COMPLETE

Added $VAMP card with lifesteal effect (lines 334-353):
```typescript
{
  id: 'vamp-1',
  name: '$VAMP',
  imageUrl: '/chad-muscular-bull-crypto-meme.jpg',
  description: 'Drains value. Feeds on losses.',
  effect: 'lifesteal',
  ...calculateCardStats({
    price: 0.75,
    marketCap: 18_000_000,
    liquidity: 2_500_000,
    volume24h: 6_800_000,
    priceChange24h: 14.2,
  }),
  marketData: { /* ... */ },
}
```

**Result:** Card collection expanded from 16 to 17 cards

---

## ❌ BLOCKED (1/2 files)

### 2. app/page.tsx - Lifesteal Healing Logic
**Status:** ❌ BLOCKED (File permissions)

**Error:** "Claude requested permissions to write to /Users/bradymckenna/Documents/game-of-memes/app/page.tsx, but you haven't granted it yet."

**File permissions:** `-rw-------@ 1 bradymckenna staff`

---

## IMPLEMENTATION RESOURCES CREATED

### 1. LIFESTEAL_CHANGES_NEEDED.md
Comprehensive documentation of all 4 required changes with:
- Exact line numbers
- Before/after code blocks
- Implementation pattern
- Testing checklist

### 2. apply_lifesteal.py
Python script that programmatically applies all 4 changes:
- Creates backup (app/page.tsx.backup-lifesteal)
- Applies changes via string replacement
- Verifies each change

**To use:**
```bash
python3 apply_lifesteal.py
npm run build
npm run dev
```

### 3. implement-lifesteal.sh
Alternative bash script (uses sed, more complex)

---

## WHAT NEEDS TO BE DONE

### 4 Combat Locations Require Lifesteal Healing:

#### Change 1: AI Minion vs Player Minion (Line 172-175)
Add lifesteal healing after AI minion deals damage in combat

#### Change 2: AI Minion vs Player Hero (Line 226-230)
Add lifesteal healing after AI minion attacks player hero

#### Change 3: Player Minion vs Opponent Minion (Line 404-409)
Add lifesteal healing after player minion deals damage in combat

#### Change 4: Player Minion vs Opponent Hero (Line 479-483)
Add lifesteal healing after player minion attacks opponent hero

**Pattern for all 4 changes:**
1. Extract damage to variable before dealing it
2. Deal damage as normal
3. Check if attacker has `effect === 'lifesteal'`
4. If yes: `attackingPlayer.health = Math.min(attackingPlayer.health + damage, maxHealth)`

---

## WHY THIS MATTERS

**Without these changes:**
- $VAMP card exists in deck with `effect: 'lifesteal'` property
- Card can be played and attack normally
- BUT: No healing occurs when $VAMP deals damage
- Lifesteal effect is non-functional

**With these changes:**
- $VAMP (4 mana 4/4) drains health when attacking
- Attacking a 3/3 minion → Deal 4 damage, heal player for 4
- Attacking enemy hero → Deal 4 damage, heal player for 4
- Healing capped at maxHealth (30)
- Strategic card for controlling board while staying alive

---

## OPTIONS TO COMPLETE

### Option 1: Run Python Script (Recommended)
```bash
cd /Users/bradymckenna/Documents/game-of-memes
python3 apply_lifesteal.py
npm run build
npm run dev
```

### Option 2: Manual Edits
Follow LIFESTEAL_CHANGES_NEEDED.md line-by-line

### Option 3: Grant File Permissions
Grant Claude Code write access to app/page.tsx and re-run implementation

---

## TESTING PLAN

After implementation:

1. **Build Test**
   ```bash
   npm run build
   ```
   Expected: TypeScript compilation succeeds

2. **Gameplay Test**
   ```bash
   npm run dev
   ```
   Test scenarios:
   - Play $VAMP (costs 4 mana)
   - Attack enemy minion with $VAMP
     - ✅ Player heals for 4 (attacker's damage)
   - Attack enemy hero with $VAMP
     - ✅ Player heals for 4
   - Let AI play $VAMP and attack
     - ✅ AI hero heals when $VAMP attacks
   - Heal player from 20 → 24 (healing works)
   - Try healing player from 28 → should cap at 30 (maxHealth limit)

---

## FILES MODIFIED IN LOOP 29

### Created:
1. LOOP_29_STATUS.md (this file)
2. LIFESTEAL_CHANGES_NEEDED.md
3. apply_lifesteal.py
4. implement-lifesteal.sh

### Modified:
1. lib/cards.ts - Added $VAMP card (17 cards total now)

### Blocked:
1. app/page.tsx - Requires write permission

---

## SUMMARY

**Progress: 50% Complete (1/2 files)**

| Component | Status | Lines Changed |
|-----------|--------|---------------|
| $VAMP card (lib/cards.ts) | ✅ DONE | 21 lines |
| Lifesteal healing (app/page.tsx) | ❌ BLOCKED | ~30 lines |

**Total Implementation:** ~51 lines across 2 files
**Completed:** ~21 lines (41%)
**Remaining:** ~30 lines (59%)

The lifesteal card exists and the implementation logic is ready, but file permissions prevent automatic integration. The Python script `apply_lifesteal.py` can complete the implementation when run.

---

## NEXT STEPS

1. **Immediate:** Run `python3 apply_lifesteal.py` to apply changes
2. **Verify:** Run `npm run build` to ensure no TypeScript errors
3. **Test:** Run `npm run dev` and test $VAMP lifesteal healing
4. **Update:** Mark Priority 4 complete in @fix_plan.md
5. **Continue:** Move to next priority (Priority 4: Fatigue Damage)

---

## LOOP 29 EXIT STATUS

**EXIT_SIGNAL:** false (implementation incomplete)
**REASON:** File permission blocking app/page.tsx edits
**SOLUTION:** User should run: `python3 apply_lifesteal.py && npm run build`
