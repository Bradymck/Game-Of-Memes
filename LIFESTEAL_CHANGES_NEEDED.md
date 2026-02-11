# Lifesteal Integration - Required Changes to app/page.tsx

## Summary
Add lifesteal healing logic in 4 combat damage locations where minions deal damage.

**Lifesteal Mechanic:**
- When a minion with `effect: 'lifesteal'` deals damage, heal the controlling player
- Healing amount equals damage dealt
- Cannot exceed maxHealth

---

## Change 1: AI Minion vs Player Minion (Lines 172-175)

**FROM:**
```typescript
            if (attacker && defender && attacker.canAttack) {
              attacker.currentHealth -= defender.currentAttack;
              defender.currentHealth -= attacker.currentAttack;
              attacker.canAttack = false;
```

**TO:**
```typescript
            if (attacker && defender && attacker.canAttack) {
              const attackerDamage = attacker.currentAttack;
              const defenderDamage = defender.currentAttack;

              // Deal damage
              attacker.currentHealth -= defenderDamage;
              defender.currentHealth -= attackerDamage;

              // Lifesteal: Heal attacking player if attacker has lifesteal
              if (attacker.effect === 'lifesteal') {
                newState.player2.health = Math.min(
                  newState.player2.health + attackerDamage,
                  newState.player2.maxHealth
                );
              }

              attacker.canAttack = false;
```

---

## Change 2: AI Minion vs Player Hero (Lines 227-230)

**FROM:**
```typescript
            const attacker = prev.player2.board.find(c => c.id === action.cardId);
            if (attacker && attacker.canAttack) {
              const newState = { ...prev };
              newState.player1.health -= attacker.currentAttack;
              attacker.canAttack = false;
```

**TO:**
```typescript
            const attacker = prev.player2.board.find(c => c.id === action.cardId);
            if (attacker && attacker.canAttack) {
              const newState = { ...prev };
              const damage = attacker.currentAttack;

              // Deal damage to enemy hero
              newState.player1.health -= damage;

              // Lifesteal: Heal AI hero if attacker has lifesteal
              if (attacker.effect === 'lifesteal') {
                newState.player2.health = Math.min(
                  newState.player2.health + damage,
                  newState.player2.maxHealth
                );
              }

              attacker.canAttack = false;
```

---

## Change 3: Player Minion vs Opponent Minion (Lines 404-409)

**FROM:**
```typescript
      // Deal damage
      attacker.currentHealth -= defender.currentAttack;
      defender.currentHealth -= attacker.currentAttack;

      // Mark attacker as used
      attacker.canAttack = false;
```

**TO:**
```typescript
      // Deal damage
      const attackerDamage = attacker.currentAttack;
      const defenderDamage = defender.currentAttack;

      attacker.currentHealth -= defenderDamage;
      defender.currentHealth -= attackerDamage;

      // Lifesteal: Heal attacking player if attacker has lifesteal
      if (attacker.effect === 'lifesteal') {
        attackingPlayer.health = Math.min(
          attackingPlayer.health + attackerDamage,
          attackingPlayer.maxHealth
        );
      }

      // Mark attacker as used
      attacker.canAttack = false;
```

---

## Change 4: Player Minion vs Opponent Hero (Lines 479-483)

**FROM:**
```typescript
      // Deal damage to hero
      defendingPlayer.health -= attacker.currentAttack;

      // Mark attacker as used
      attacker.canAttack = false;
```

**TO:**
```typescript
      // Deal damage to hero
      const damage = attacker.currentAttack;
      defendingPlayer.health -= damage;

      // Lifesteal: Heal attacking player if attacker has lifesteal
      if (attacker.effect === 'lifesteal') {
        attackingPlayer.health = Math.min(
          attackingPlayer.health + damage,
          attackingPlayer.maxHealth
        );
      }

      // Mark attacker as used
      attacker.canAttack = false;
```

---

## Summary of Changes

- **4 locations modified**
- **~30 lines added** (healing logic + damage variable extraction)
- Lifesteal triggers on:
  - ✅ Minion-on-minion combat (both AI and player)
  - ✅ Minion-on-hero attacks (both AI and player)
- Healing capped at maxHealth (30)

---

## Testing Checklist

After implementation:

- [ ] Build passes (`npm run build`)
- [ ] Dev server runs (`npm run dev`)
- [ ] $VAMP card shows in deck
- [ ] $VAMP can be played (4 mana cost)
- [ ] When $VAMP attacks minion → Player heals for damage dealt
- [ ] When $VAMP attacks hero → Player heals for damage dealt
- [ ] Healing doesn't exceed 30 (maxHealth)
- [ ] AI can play $VAMP and trigger lifesteal
- [ ] Lifesteal works with different attack values (buffs/debuffs if added later)

---

## Card Details

**$VAMP** (lib/cards.ts line 334-353):
- **ID:** vamp-1
- **Name:** $VAMP
- **Effect:** lifesteal
- **Stats:** 4 mana, 4/4 (4 attack, 4 health)
- **Description:** "Drains value. Feeds on losses."
- **Thematic:** Vampire drains opponent's health to heal owner

---

## Implementation Pattern

All 4 changes follow the same pattern:

1. Extract damage amount to variable BEFORE dealing damage
2. Deal damage as normal
3. Check if attacker has `effect === 'lifesteal'`
4. If yes: Heal attacking player by damage amount
5. Cap healing with `Math.min(currentHealth + damage, maxHealth)`
6. Continue with normal combat flow

This ensures lifesteal triggers only when damage is actually dealt, and healing is properly capped.
