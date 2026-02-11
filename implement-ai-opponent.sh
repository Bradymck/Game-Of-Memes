#!/bin/bash
# Auto-implementation script for AI Opponent
# This script modifies app/page.tsx to integrate the AI opponent

set -e

GAME_FILE="app/page.tsx"
BACKUP_FILE="app/page.tsx.ai-backup"

echo "🤖 Implementing AI Opponent..."

# Backup original file
cp "$GAME_FILE" "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"

# Create a temporary file with the modifications
cat > /tmp/ai-integration.patch << 'ENDPATCH'
--- a/app/page.tsx
+++ b/app/page.tsx
@@ -4,7 +4,8 @@ import { useState, useEffect } from 'react';
 import Card from '@/components/Card';
 import HeroPortrait from '@/components/HeroPortrait';
 import { generateStarterDeck } from '@/lib/cards';
-import { GameState, Player, BoardCard } from '@/lib/types';
+import { GameState, Player, BoardCard } from '@/lib/types';
+import { planAITurn, AIAction } from '@/lib/ai';

 function createInitialPlayer(id: string): Player {
   const deck = generateStarterDeck();
@@ -48,6 +49,73 @@ export default function Home() {
     setGameState(initialState);
   }, []); // Only run once on mount

+  // AI Turn Logic - Execute when it's player2's turn
+  useEffect(() => {
+    if (!gameState || gameState.turn !== 'player2' || gameState.winner) return;
+
+    const executeAITurn = async () => {
+      // Small delay before AI starts (feels more natural)
+      await new Promise(resolve => setTimeout(resolve, 800));
+
+      const actions = planAITurn(gameState.player2, gameState.player1);
+
+      // Execute each action with a delay for visual feedback
+      for (const action of actions) {
+        await new Promise(resolve => setTimeout(resolve, 600));
+
+        if (action.type === 'PLAY_CARD') {
+          const card = gameState.player2.hand.find(c => c.id === action.cardId);
+          if (card && card.cost <= gameState.player2.mana && gameState.player2.board.length < 7) {
+            setGameState(prev => {
+              if (!prev) return prev;
+              const newPlayer = { ...prev.player2 };
+              newPlayer.hand = newPlayer.hand.filter(c => c.id !== action.cardId);
+
+              // Check if card has Charge effect
+              const hasCharge = card.effect === 'charge';
+
+              newPlayer.board.push({
+                ...card,
+                currentHealth: card.health,
+                currentAttack: card.attack,
+                canAttack: hasCharge,
+                summoningSickness: !hasCharge,
+              });
+              newPlayer.mana -= card.cost;
+
+              return { ...prev, player2: newPlayer } as GameState;
+            });
+          }
+        } else if (action.type === 'ATTACK_MINION' && action.targetId) {
+          setGameState(prev => {
+            if (!prev) return prev;
+            const newState = { ...prev };
+            const attacker = newState.player2.board.find(c => c.id === action.cardId);
+            const defender = newState.player1.board.find(c => c.id === action.targetId);
+
+            if (attacker && defender && attacker.canAttack) {
+              attacker.currentHealth -= defender.currentAttack;
+              defender.currentHealth -= attacker.currentAttack;
+              attacker.canAttack = false;
+
+              newState.player2.board = newState.player2.board.filter(c => c.currentHealth > 0);
+              newState.player1.board = newState.player1.board.filter(c => c.currentHealth > 0);
+            }
+            return newState as GameState;
+          });
+        } else if (action.type === 'ATTACK_HERO') {
+          setGameState(prev => {
+            if (!prev) return prev;
+            const attacker = prev.player2.board.find(c => c.id === action.cardId);
+            if (attacker && attacker.canAttack) {
+              const newState = { ...prev };
+              newState.player1.health -= attacker.currentAttack;
+              attacker.canAttack = false;
+              if (newState.player1.health <= 0) newState.winner = 'player2';
+              return newState as GameState;
+            }
+            return prev;
+          });
+        } else if (action.type === 'END_TURN') {
           const nextTurn = 'player1';
           const nextPlayer = gameState.player1;

@@ -68,6 +136,18 @@ export default function Home() {
             board: newBoard,
           },
         });
+        }
+      }
+    };
+
+    executeAITurn();
+  }, [gameState?.turn, gameState?.turnNumber]); // Re-run when turn changes
+
   // Don't render until state is initialized
   if (!gameState) {
     return (
ENDPATCH

# Apply the changes manually using a Python script for more reliable editing
python3 << 'ENDPYTHON'
import re

# Read the original file
with open('app/page.tsx', 'r') as f:
    content = f.read()

# 1. Add AI import
content = content.replace(
    "import { GameState, Player, BoardCard } from '@/lib/types';",
    "import { GameState, Player, BoardCard } from '@/lib/types';\nimport { planAITurn, AIAction } from '@/lib/ai';"
)

# 2. Find the position after the first useEffect and insert AI turn logic
first_useeffect_end = content.find("  }, []); // Only run once on mount")
if first_useeffect_end == -1:
    print("ERROR: Could not find first useEffect")
    exit(1)

ai_logic = '''

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
'''

insert_pos = first_useeffect_end + len("  }, []); // Only run once on mount")
content = content[:insert_pos] + ai_logic + content[insert_pos:]

# Write the modified content
with open('app/page.tsx', 'w') as f:
    f.write(content)

print("✅ AI integration code added successfully")
ENDPYTHON

if [ $? -ne 0 ]; then
    echo "❌ Failed to apply changes! Restoring backup..."
    cp "$BACKUP_FILE" "$GAME_FILE"
    exit 1
fi

echo "✅ Code modified successfully"

# Verify the build
echo "🔨 Running build to verify..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build passed! AI Opponent implemented successfully."
    echo ""
    echo "🎮 Next steps:"
    echo "1. Run 'npm run dev' to test the AI opponent"
    echo "2. The AI will automatically play when it's player2's turn"
    echo "3. Watch it play cards, make trades, and attack your hero"
    echo ""
    echo "📋 To continue with other features:"
    echo "   - Charge Effect: Already included in AI logic!"
    echo "   - Board Limit: Already enforced (7 minions max)"
    echo "   - Run './implement-hand-limit.sh' for next feature"
else
    echo "❌ Build failed! Restoring backup..."
    cp "$BACKUP_FILE" "$GAME_FILE"
    echo "Backup restored. Check the error above."
    exit 1
fi
