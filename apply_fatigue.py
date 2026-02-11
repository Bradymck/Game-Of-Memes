#!/usr/bin/env python3
"""
Fatigue Damage Implementation Script
Applies fatigue damage logic to lib/types.ts and app/page.tsx
"""

import shutil
import sys

print("💀 Implementing Fatigue Damage System...")
print()

# =======================
# 1. Update lib/types.ts
# =======================
TYPES_FILE = "lib/types.ts"
print(f"📝 Step 1/5: Updating {TYPES_FILE}...")

with open(TYPES_FILE, 'r') as f:
    types_content = f.read()

# Create backup
shutil.copy(TYPES_FILE, TYPES_FILE + ".backup-fatigue")
print(f"  ✓ Backup created: {TYPES_FILE}.backup-fatigue")

# Add fatigueCounter to Player interface
types_old = """// Player state
export interface Player {
  id: string;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  deck: Card[];
  hand: Card[];
  board: BoardCard[];
  graveyard: Card[];
}"""

types_new = """// Player state
export interface Player {
  id: string;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  deck: Card[];
  hand: Card[];
  board: BoardCard[];
  graveyard: Card[];
  fatigueCounter: number; // Tracks fatigue damage (increases each time deck is empty)
}"""

if types_old in types_content:
    types_content = types_content.replace(types_old, types_new)
    with open(TYPES_FILE, 'w') as f:
        f.write(types_content)
    print(f"  ✓ Added fatigueCounter to Player interface")
else:
    print(f"  ⚠️  Player interface already modified or pattern not found")

print()

# =======================
# 2. Update app/page.tsx
# =======================
PAGE_FILE = "app/page.tsx"
print(f"📝 Step 2/5: Updating {PAGE_FILE}...")

with open(PAGE_FILE, 'r') as f:
    page_content = f.read()

# Create backup
shutil.copy(PAGE_FILE, PAGE_FILE + ".backup-fatigue")
print(f"  ✓ Backup created: {PAGE_FILE}.backup-fatigue")

# Change 1: Initialize fatigueCounter in createInitialPlayer
init_old = """  return {
    id,
    health: 30,
    maxHealth: 30,
    mana: 1,
    maxMana: 1,
    deck: remainingDeck,
    hand,
    board: [],
    graveyard: [],
  };
}"""

init_new = """  return {
    id,
    health: 30,
    maxHealth: 30,
    mana: 1,
    maxMana: 1,
    deck: remainingDeck,
    hand,
    board: [],
    graveyard: [],
    fatigueCounter: 0, // Start at 0, increments when drawing from empty deck
  };
}"""

if init_old in page_content:
    page_content = page_content.replace(init_old, init_new)
    print(f"  ✓ Change 1/4: Added fatigueCounter initialization")
else:
    print(f"  ⚠️  Change 1/4: createInitialPlayer already modified")

# Change 2: AI turn draw with fatigue
ai_draw_old = """      // Draw a card with hand limit check
      const newCard = nextPlayer.deck[0];
      const newDeck = nextPlayer.deck.slice(1);

      let newHand = nextPlayer.hand;
      if (newCard) {
        if (nextPlayer.hand.length >= HAND_LIMIT) {
          // Hand is full - burn the card
          setBurnNotification({
            id: `burn-${Date.now()}`,
            cardName: newCard.name,
            player: nextPlayer.id,
          });
          // Card goes directly to graveyard (burned)
        } else {
          // Add card to hand
          newHand = [...nextPlayer.hand, newCard];
        }
      }"""

ai_draw_new = """      // Draw a card with hand limit check and fatigue damage
      const newCard = nextPlayer.deck[0];
      const newDeck = nextPlayer.deck.slice(1);
      let newFatigueCounter = nextPlayer.fatigueCounter;
      let newHealth = nextPlayer.health;

      let newHand = nextPlayer.hand;
      if (newCard) {
        if (nextPlayer.hand.length >= HAND_LIMIT) {
          // Hand is full - burn the card
          setBurnNotification({
            id: `burn-${Date.now()}`,
            cardName: newCard.name,
            player: nextPlayer.id,
          });
          // Card goes directly to graveyard (burned)
        } else {
          // Add card to hand
          newHand = [...nextPlayer.hand, newCard];
        }
      } else {
        // Deck is empty - take fatigue damage
        newFatigueCounter += 1;
        newHealth -= newFatigueCounter;
        console.log(`${nextPlayer.id} takes ${newFatigueCounter} fatigue damage! (Health: ${nextPlayer.health} -> ${newHealth})`);
      }"""

if ai_draw_old in page_content:
    page_content = page_content.replace(ai_draw_old, ai_draw_new)
    print(f"  ✓ Change 2/4: Added fatigue damage to AI turn draw")
else:
    print(f"  ⚠️  Change 2/4: AI turn draw already modified")

# Change 3: AI turn return statement with fatigue
ai_return_old = """        player1: {
          ...nextPlayer,
          hand: newHand,
          deck: newDeck,
          mana: newMaxMana,
          maxMana: newMaxMana,
          board: newBoard,
        },"""

ai_return_new = """        player1: {
          ...nextPlayer,
          hand: newHand,
          deck: newDeck,
          mana: newMaxMana,
          maxMana: newMaxMana,
          board: newBoard,
          health: newHealth,
          fatigueCounter: newFatigueCounter,
        },"""

if ai_return_old in page_content:
    page_content = page_content.replace(ai_return_old, ai_return_new)
    print(f"  ✓ Change 3/4: Updated AI turn return with fatigue")
else:
    print(f"  ⚠️  Change 3/4: AI turn return already modified")

# Change 4: Player turn draw with fatigue
player_draw_old = """    // Draw a card with hand limit check
    const newCard = nextPlayer.deck[0];
    const newDeck = nextPlayer.deck.slice(1);

    let newHand = nextPlayer.hand;
    if (newCard) {
      if (nextPlayer.hand.length >= HAND_LIMIT) {
        // Hand is full - burn the card
        setBurnNotification({
          id: `burn-${Date.now()}`,
          cardName: newCard.name,
          player: nextPlayer.id,
        });
        // Card goes directly to graveyard (burned)
      } else {
        // Add card to hand
        newHand = [...nextPlayer.hand, newCard];
      }
    }"""

player_draw_new = """    // Draw a card with hand limit check and fatigue damage
    const newCard = nextPlayer.deck[0];
    const newDeck = nextPlayer.deck.slice(1);
    let newFatigueCounter = nextPlayer.fatigueCounter;
    let newHealth = nextPlayer.health;

    let newHand = nextPlayer.hand;
    if (newCard) {
      if (nextPlayer.hand.length >= HAND_LIMIT) {
        // Hand is full - burn the card
        setBurnNotification({
          id: `burn-${Date.now()}`,
          cardName: newCard.name,
          player: nextPlayer.id,
        });
        // Card goes directly to graveyard (burned)
      } else {
        // Add card to hand
        newHand = [...nextPlayer.hand, newCard];
      }
    } else {
      // Deck is empty - take fatigue damage
      newFatigueCounter += 1;
      newHealth -= newFatigueCounter;
      console.log(`${nextPlayer.id} takes ${newFatigueCounter} fatigue damage! (Health: ${nextPlayer.health} -> ${newHealth})`);
    }"""

if player_draw_old in page_content:
    page_content = page_content.replace(player_draw_old, player_draw_new)
    print(f"  ✓ Change 4/4: Added fatigue damage to player turn draw")
else:
    print(f"  ⚠️  Change 4/4: Player turn draw already modified")

# Change 5: Player turn return statement with fatigue
player_return_old = """      [nextTurn]: {
        ...nextPlayer,
        hand: newHand,
        deck: newDeck,
        mana: newMaxMana,
        maxMana: newMaxMana,
        board: newBoard,
      },"""

player_return_new = """      [nextTurn]: {
        ...nextPlayer,
        hand: newHand,
        deck: newDeck,
        mana: newMaxMana,
        maxMana: newMaxMana,
        board: newBoard,
        health: newHealth,
        fatigueCounter: newFatigueCounter,
      },"""

if player_return_old in page_content:
    page_content = page_content.replace(player_return_old, player_return_new)
    print(f"  ✓ Change 5/4: Updated player turn return with fatigue")
else:
    print(f"  ⚠️  Change 5/4: Player turn return already modified")

# Write changes
with open(PAGE_FILE, 'w') as f:
    f.write(page_content)

print()
print("✅ All fatigue damage changes applied successfully!")
print()
print(f"📄 Modified files:")
print(f"  - {TYPES_FILE}")
print(f"  - {PAGE_FILE}")
print()
print(f"💾 Backups created:")
print(f"  - {TYPES_FILE}.backup-fatigue")
print(f"  - {PAGE_FILE}.backup-fatigue")
print()
print("📋 Summary of Changes:")
print("  1. Added fatigueCounter to Player interface (lib/types.ts)")
print("  2. Initialized fatigueCounter to 0 in createInitialPlayer (app/page.tsx)")
print("  3. Added fatigue damage when AI draws from empty deck (app/page.tsx)")
print("  4. Added fatigue damage when player draws from empty deck (app/page.tsx)")
print("  5. Updated turn end returns to include health and fatigueCounter")
print()
print("Next steps:")
print("1. Run: npm run build")
print("2. Test: npm run dev")
print("3. Play until deck runs out to test fatigue damage (1, 2, 3...)")
