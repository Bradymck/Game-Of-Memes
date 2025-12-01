# Combat System Update ⚔️

## What Just Got Added (v0.2)

The game is now **actually playable**! Full Hearthstone-style combat is implemented.

## New Features

### ✅ Combat System
- **Click your minion** → Enters attack mode (card gets yellow ring)
- **Click enemy minion** → Your minion attacks theirs (mutual damage)
- **Click enemy hero** → Direct face damage
- Minions take damage and health updates in real-time
- Dead minions are removed from board automatically

### ✅ Summoning Sickness
- Minions **can't attack** the turn they're played
- Next turn, they wake up and can attack
- Proper `canAttack` flag enforcement

### ✅ Attack Once Per Turn
- Each minion can only attack once
- After attacking, they're locked until next turn
- Refreshes on your turn start

### ✅ Win/Lose Conditions
- Hero health tracks properly
- Game ends when hero reaches 0 HP
- Victory/Defeat screen with "Play Again" button

### ✅ Visual Feedback
- **Yellow ring** = Selected attacker
- **Enemy hero pulses red** when in attack mode
- **Damaged minions** show health in red instead of green
- **"Select a target!"** message when attacking
- Cards show current HP (not just base stats)

## How to Play

1. **Play cards** from your hand (costs mana)
2. **End turn** (opponent's turn, you draw a card, gain mana)
3. **On your next turn:**
   - Click a minion on your board (ready to attack)
   - Click enemy minion to trade, OR click enemy hero to go face
4. **Win** by reducing opponent to 0 HP

## Combat Rules (Hearthstone-accurate)

- ✅ Minions attack once per turn
- ✅ Summoning sickness (can't attack turn 1)
- ✅ Mutual damage (both take damage when trading)
- ✅ Death at 0 HP
- ✅ Direct hero damage
- ✅ No friendly fire (can't attack your own units)

## What's Still Missing (Future Updates)

- **Taunt** - Must kill taunt minions first
- **Charge** - Attack immediately (no summoning sickness)
- **Battlecry/Deathrattle** - Card effects
- **Board limit** (7 minions max)
- **Hand limit** (10 cards max)
- **Fatigue damage** (empty deck = damage)
- **AI opponent** (currently hotseat 2-player)
- **Sound effects**
- **Better animations** (attack arrows, damage numbers)

## Code Changes

### Modified Files:
- `app/page.tsx` - Added combat logic, attack state, win/lose screen
- `components/Card.tsx` - Added `isSelected` prop, dynamic HP display

### Key Functions Added:
- `handleSelectAttacker()` - Choose which minion attacks
- `handleAttackMinion()` - Execute minion vs minion combat
- `handleAttackHero()` - Execute face damage
- Win detection & game reset

---

**The game is now feature-complete for basic 1v1 play!** 🎮

Test it at [http://localhost:3000](http://localhost:3000)
