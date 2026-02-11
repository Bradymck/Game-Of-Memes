#!/bin/bash

# Lifesteal Implementation Script
# Applies lifesteal healing logic to all 4 combat damage locations in app/page.tsx

set -e  # Exit on error

FILE="app/page.tsx"
BACKUP="app/page.tsx.backup-lifesteal"

echo "🧛 Implementing Lifesteal Effect..."

# Create backup
cp "$FILE" "$BACKUP"
echo "✓ Backup created: $BACKUP"

# Change 1: AI Minion vs Player Minion (Line 172-175)
echo "⚙️  Change 1/4: AI minion combat..."
sed -i '' '172,175s/.*/            if (attacker \&\& defender \&\& attacker.canAttack) {\
              const attackerDamage = attacker.currentAttack;\
              const defenderDamage = defender.currentAttack;\
\
              \/\/ Deal damage\
              attacker.currentHealth -= defenderDamage;\
              defender.currentHealth -= attackerDamage;\
\
              \/\/ Lifesteal: Heal attacking player if attacker has lifesteal\
              if (attacker.effect === '\''lifesteal'\'') {\
                newState.player2.health = Math.min(\
                  newState.player2.health + attackerDamage,\
                  newState.player2.maxHealth\
                );\
              }\
\
              attacker.canAttack = false;/' "$FILE"

# Change 2: AI Minion vs Player Hero (Lines 227-230)
echo "⚙️  Change 2/4: AI hero attack..."
sed -i '' '227,230s/.*/            const attacker = prev.player2.board.find(c => c.id === action.cardId);\
            if (attacker \&\& attacker.canAttack) {\
              const newState = { ...prev };\
              const damage = attacker.currentAttack;\
\
              \/\/ Deal damage to enemy hero\
              newState.player1.health -= damage;\
\
              \/\/ Lifesteal: Heal AI hero if attacker has lifesteal\
              if (attacker.effect === '\''lifesteal'\'') {\
                newState.player2.health = Math.min(\
                  newState.player2.health + damage,\
                  newState.player2.maxHealth\
                );\
              }\
\
              attacker.canAttack = false;/' "$FILE"

# Change 3: Player Minion vs Opponent Minion (Lines 404-409)
echo "⚙️  Change 3/4: Player minion combat..."
sed -i '' '404,409s/.*/      \/\/ Deal damage\
      const attackerDamage = attacker.currentAttack;\
      const defenderDamage = defender.currentAttack;\
\
      attacker.currentHealth -= defenderDamage;\
      defender.currentHealth -= attackerDamage;\
\
      \/\/ Lifesteal: Heal attacking player if attacker has lifesteal\
      if (attacker.effect === '\''lifesteal'\'') {\
        attackingPlayer.health = Math.min(\
          attackingPlayer.health + attackerDamage,\
          attackingPlayer.maxHealth\
        );\
      }\
\
      \/\/ Mark attacker as used\
      attacker.canAttack = false;/' "$FILE"

# Change 4: Player Minion vs Opponent Hero (Lines 479-483)
echo "⚙️  Change 4/4: Player hero attack..."
sed -i '' '479,483s/.*/      \/\/ Deal damage to hero\
      const damage = attacker.currentAttack;\
      defendingPlayer.health -= damage;\
\
      \/\/ Lifesteal: Heal attacking player if attacker has lifesteal\
      if (attacker.effect === '\''lifesteal'\'') {\
        attackingPlayer.health = Math.min(\
          attackingPlayer.health + damage,\
          attackingPlayer.maxHealth\
        );\
      }\
\
      \/\/ Mark attacker as used\
      attacker.canAttack = false;/' "$FILE"

echo "✅ All 4 changes applied successfully!"
echo ""
echo "🧪 Running build to verify..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ BUILD SUCCESSFUL!"
    echo "🎮 Lifesteal effect is now fully implemented!"
    echo ""
    echo "Test with: npm run dev"
    echo "- Play $VAMP card (4 mana, 4/4)"
    echo "- Attack with $VAMP"
    echo "- Watch your hero heal for damage dealt!"
    echo ""
    echo "Backup saved at: $BACKUP"
else
    echo ""
    echo "❌ BUILD FAILED - Restoring backup..."
    mv "$BACKUP" "$FILE"
    echo "⚠️  Original file restored. Check LIFESTEAL_CHANGES_NEEDED.md for manual implementation."
    exit 1
fi
