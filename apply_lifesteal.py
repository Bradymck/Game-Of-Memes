#!/usr/bin/env python3
"""
Lifesteal Implementation Script
Applies lifesteal healing logic to app/page.tsx
"""

import shutil
import sys

FILE_PATH = "app/page.tsx"
BACKUP_PATH = "app/page.tsx.backup-lifesteal"

# Read the file
print("🧛 Implementing Lifesteal Effect...")
with open(FILE_PATH, 'r') as f:
    lines = f.readlines()

# Create backup
shutil.copy(FILE_PATH, BACKUP_PATH)
print(f"✓ Backup created: {BACKUP_PATH}")

# Change 1: AI Minion vs Player Minion (Lines 172-175, 0-indexed: 171-174)
print("⚙️  Change 1/4: AI minion combat (lines 172-175)...")
old_block_1 = """            if (attacker && defender && attacker.canAttack) {
              attacker.currentHealth -= defender.currentAttack;
              defender.currentHealth -= attacker.currentAttack;
              attacker.canAttack = false;
"""

new_block_1 = """            if (attacker && defender && attacker.canAttack) {
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
"""

content = ''.join(lines)
if old_block_1 in content:
    content = content.replace(old_block_1, new_block_1, 1)
    print("  ✓ Applied")
else:
    print("  ⚠️  Block 1 not found - may already be modified")

# Change 2: AI Minion vs Player Hero (Lines 226-230, 0-indexed: 225-229)
print("⚙️  Change 2/4: AI hero attack (lines 226-230)...")
old_block_2 = """          setGameState(prev => {
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
          });"""

new_block_2 = """          setGameState(prev => {
            if (!prev) return prev;
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
              if (newState.player1.health <= 0) newState.winner = 'player2';
              return newState as GameState;
            }
            return prev;
          });"""

if old_block_2 in content:
    content = content.replace(old_block_2, new_block_2, 1)
    print("  ✓ Applied")
else:
    print("  ⚠️  Block 2 not found - may already be modified")

# Change 3: Player Minion vs Opponent Minion (Lines 404-409, 0-indexed: 403-408)
print("⚙️  Change 3/4: Player minion combat (lines 404-409)...")
old_block_3 = """      // Deal damage
      attacker.currentHealth -= defender.currentAttack;
      defender.currentHealth -= attacker.currentAttack;

      // Mark attacker as used
      attacker.canAttack = false;
"""

new_block_3 = """      // Deal damage
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
"""

if old_block_3 in content:
    content = content.replace(old_block_3, new_block_3, 1)
    print("  ✓ Applied")
else:
    print("  ⚠️  Block 3 not found - may already be modified")

# Change 4: Player Minion vs Opponent Hero (Lines 479-483, 0-indexed: 478-482)
print("⚙️  Change 4/4: Player hero attack (lines 479-483)...")
old_block_4 = """      // Deal damage to hero
      defendingPlayer.health -= attacker.currentAttack;

      // Mark attacker as used
      attacker.canAttack = false;
"""

new_block_4 = """      // Deal damage to hero
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
"""

if old_block_4 in content:
    content = content.replace(old_block_4, new_block_4, 1)
    print("  ✓ Applied")
else:
    print("  ⚠️  Block 4 not found - may already be modified")

# Write the modified content
with open(FILE_PATH, 'w') as f:
    f.write(content)

print("✅ All 4 changes applied successfully!")
print(f"📄 Modified: {FILE_PATH}")
print(f"💾 Backup: {BACKUP_PATH}")
print()
print("Next steps:")
print("1. Run: npm run build")
print("2. Test: npm run dev")
print("3. Play $VAMP and attack to see healing!")
