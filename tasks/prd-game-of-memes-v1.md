# Product Requirements Document: Game of Memes v1.0

## Overview

**Product Name:** Game of Memes
**Version:** 1.0
**Branch Name:** feature/game-completion

### Vision
A Hearthstone-style NFT card game where meme token market data drives card stats, and losing players vote on card balance changes through DAO governance.

### Current State (v0.2)
- Basic card game with 8 meme cards
- Turn-based gameplay with mana system
- Combat system (minion-to-minion, minion-to-hero)
- Summoning sickness and attack-once-per-turn
- Win/lose conditions with game reset
- Market data display on cards
- Build passes, dev server runs

### What's Missing
1. Card effects (battlecry, deathrattle, charge, taunt)
2. AI opponent (currently hot-seat 2-player only)
3. Board/hand limits
4. Web3/NFT integration
5. Voting/DAO system

---

## User Stories

### US-001: Implement Charge Effect

**Priority:** High
**Acceptance Criteria:**
- Cards with `effect: 'charge'` can attack immediately when played
- Summoning sickness is bypassed for charge minions
- $CHAD card should be able to attack on the turn it's played
- Add visual indicator showing charge minions are ready to attack

**Files to modify:**
- `app/page.tsx` - playCard function, attack logic
- `lib/types.ts` - verify CardEffect type includes 'charge'

---

### US-002: Implement Taunt Effect

**Priority:** High
**Acceptance Criteria:**
- Cards with `effect: 'taunt'` must be attacked before other targets
- Enemy minions/hero cannot be targeted while taunt minion is on board
- Add visual indicator (shield icon or border) for taunt minions
- Multiple taunt minions: any can be attacked first

**Files to modify:**
- `app/page.tsx` - attack target validation
- `components/Card.tsx` - taunt visual indicator

---

### US-003: Implement Battlecry Effect

**Priority:** Medium
**Acceptance Criteria:**
- Battlecry triggers when card is played from hand
- $BEAR card battlecry: Deal 2 damage to a random enemy minion
- Create effect execution system for extensibility
- Visual feedback when battlecry triggers

**Files to create:**
- `lib/effects.ts` - effect execution system

**Files to modify:**
- `app/page.tsx` - playCard function to trigger battlecry

---

### US-004: Implement Deathrattle Effect

**Priority:** Medium
**Acceptance Criteria:**
- Deathrattle triggers when minion dies
- Create at least one card with deathrattle effect
- Death processing checks for deathrattle before removal
- Visual feedback when deathrattle triggers

**Files to modify:**
- `app/page.tsx` - minion death processing
- `lib/effects.ts` - deathrattle execution
- `lib/cards.ts` - add deathrattle card

---

### US-005: Implement Board Limit (7 Minions)

**Priority:** High
**Acceptance Criteria:**
- Maximum 7 minions per player on board
- Cards cannot be played if board is full
- Visual indicator when board is full
- Card playability reflects board state

**Files to modify:**
- `app/page.tsx` - playCard validation, card playability check

---

### US-006: Implement Hand Limit (10 Cards)

**Priority:** Medium
**Acceptance Criteria:**
- Maximum 10 cards in hand
- Cards drawn when hand is full are discarded (burned)
- Visual/text feedback when card is burned
- Track burned cards in game state

**Files to modify:**
- `app/page.tsx` - drawCard function
- `lib/types.ts` - add burnedCards to Player type (optional)

---

### US-007: Implement Basic AI Opponent

**Priority:** Critical
**Acceptance Criteria:**
- AI plays for Player 2 during their turn
- AI plays cards if enough mana (prioritize high-cost cards)
- AI attacks with all available minions
- AI prioritizes attacking enemy minions with lower health
- AI goes face when no good trades available
- Turn ends automatically after AI actions

**Files to create:**
- `lib/ai.ts` - AI decision logic

**Files to modify:**
- `app/page.tsx` - trigger AI on player2 turn, auto-end turn

---

### US-008: Add Fatigue Damage

**Priority:** Low
**Acceptance Criteria:**
- When deck is empty, drawing deals damage to hero
- Fatigue damage increases: 1, 2, 3, 4... each draw
- Track fatigue counter per player
- Visual feedback for fatigue damage

**Files to modify:**
- `app/page.tsx` - drawCard function
- `lib/types.ts` - add fatigueCounter to Player type

---

### US-009: Add More Meme Cards

**Priority:** Medium
**Acceptance Criteria:**
- Expand card pool to at least 16 unique cards
- Include cards with each effect type (charge, taunt, battlecry, deathrattle)
- Vary cost/stats distribution (1-10 mana range)
- Add card images for new cards
- Balance stats based on effects

**Files to modify:**
- `lib/cards.ts` - add new card definitions
- `public/` - add new card images

---

### US-010: Implement Lifesteal Effect

**Priority:** Low
**Acceptance Criteria:**
- Minions with lifesteal heal their hero when dealing damage
- Healing equals damage dealt
- Visual feedback showing health gained
- Hero cannot exceed maxHealth

**Files to modify:**
- `app/page.tsx` - attack damage resolution
- `lib/effects.ts` - lifesteal processing

---

### US-011: Add Sound Effects

**Priority:** Low
**Acceptance Criteria:**
- Sound on card play
- Sound on attack
- Sound on minion death
- Sound on turn end
- Sound on game win/lose
- Volume control or mute option

**Files to create:**
- `lib/sounds.ts` - sound management
- `public/sounds/` - audio files

**Files to modify:**
- `app/page.tsx` - trigger sounds on events

---

### US-012: Install Web3 Dependencies

**Priority:** High (for Phase 2)
**Acceptance Criteria:**
- Install wagmi, viem, @rainbow-me/rainbowkit
- Configure for Base L2 network
- Create WalletProvider wrapper component
- Wallet connect button in UI (doesn't need to do anything yet)

**Files to create:**
- `lib/wagmi.ts` - wagmi configuration
- `components/WalletButton.tsx` - connect wallet UI

**Files to modify:**
- `app/layout.tsx` - wrap with providers
- `package.json` - add dependencies

---

### US-013: Create Smart Contract Foundation

**Priority:** High (for Phase 2)
**Acceptance Criteria:**
- Initialize Foundry/Forge project structure
- Create ERC-1155 contract for card NFTs
- Include mint, burn, and metadata functions
- Write basic tests for contract
- Add deployment script for Base testnet

**Files to create:**
- `contracts/GameOfMemesCards.sol`
- `contracts/test/GameOfMemesCards.t.sol`
- `foundry.toml`

---

### US-014: Improve Attack Animations

**Priority:** Low
**Acceptance Criteria:**
- Attack animation shows attacker moving toward target
- Damage numbers float up from damaged units
- Screen shake on big hits
- Death animation before removal

**Files to modify:**
- `app/page.tsx` - attack flow with animation states
- `components/Card.tsx` - animation variants

---

### US-015: Add Game Settings Menu

**Priority:** Low
**Acceptance Criteria:**
- Settings accessible from main game screen
- Toggle sound on/off
- Toggle animations on/off
- Reset game button
- Future: difficulty selection for AI

**Files to create:**
- `components/SettingsMenu.tsx`

**Files to modify:**
- `app/page.tsx` - settings state and toggle

---

## Quality Gates

- All TypeScript compiles without errors
- `npm run build` succeeds
- `npm run lint` passes
- Game is playable from start to win/lose
- No console errors during gameplay

## Notes for Implementation

- Maintain existing code style and patterns
- Use Framer Motion for all animations
- Keep components small and focused
- Test each feature manually before marking complete
- Commit after each user story completion

---

## Priority Order for MVP

1. US-007: AI Opponent (Critical - makes game playable solo)
2. US-001: Charge Effect
3. US-002: Taunt Effect
4. US-005: Board Limit
5. US-003: Battlecry Effect
6. US-006: Hand Limit
7. US-009: More Cards
8. US-004: Deathrattle Effect
9. US-008: Fatigue Damage
10. US-010: Lifesteal
11. US-011: Sound Effects
12. US-012: Web3 Setup
13. US-013: Smart Contracts
14. US-014: Attack Animations
15. US-015: Settings Menu
