#!/bin/bash
# Auto-implementation script for Charge Effect
# This script modifies app/page.tsx to add charge effect support

set -e

GAME_FILE="app/page.tsx"
BACKUP_FILE="app/page.tsx.backup"

echo "🔧 Implementing Charge Effect..."

# Backup original file
cp "$GAME_FILE" "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"

# Use sed to modify the handlePlayCard function
# This adds the hasCharge check and modifies canAttack/summoningSickness

# The sed command finds the line with "newPlayer.board.push({" and replaces the next few lines
sed -i '' '
/newPlayer.hand = newPlayer.hand.filter/a\
\
      // Check if card has Charge effect\
      const hasCharge = card.effect === '\''charge'\'';
' "$GAME_FILE"

sed -i '' 's/canAttack: false,/canAttack: hasCharge,  \/\/ Charge minions can attack immediately/' "$GAME_FILE"
sed -i '' 's/summoningSickness: true,/summoningSickness: !hasCharge,  \/\/ Charge bypasses summoning sickness/' "$GAME_FILE"

echo "✅ Code modified successfully"

# Verify the build
echo "🔨 Running build to verify..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build passed! Charge effect implemented successfully."
    echo ""
    echo "Next steps:"
    echo "1. Run 'npm run dev' to test"
    echo "2. Play $CHAD card - it should attack immediately"
    echo "3. Run './implement-board-limit.sh' for next feature"
else
    echo "❌ Build failed! Restoring backup..."
    cp "$BACKUP_FILE" "$GAME_FILE"
    echo "Backup restored. Check the error above."
    exit 1
fi
