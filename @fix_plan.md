# Game of Memes - Fix Plan

## CRITICAL: You are working on the REAL project
**Location:** `/Users/bradymckenna/Documents/AquaPrimeGenesis/game-of-memes/`
**NOT:** `/Documents/game-of-memes/` (that's a different, simpler prototype)

---

## Priority 0: Fix Build Errors (BLOCKING)

### [ ] Fix thread-stream/WalletConnect build errors
**Status**: BLOCKING - must fix first
**Error**: "Missing module type" errors from thread-stream in node_modules
**Possible fixes**:
1. Add thread-stream test files to tsconfig exclude
2. Update next.config.mjs to exclude these from Turbopack
3. Clear node_modules and reinstall
4. Downgrade problematic packages

---

## Priority 1: From ROADMAP.md - MVP Features

### [ ] Pack Token Market Data Integration
**Files**: `lib/marketStats.ts`, `lib/vibemarket.ts`
**Requirements**:
- Get pack ERC20 token address from contract
- Check if token is on bonding curve or Uniswap
- Fetch token price, market cap, liquidity, volume
- Calculate card stats from pack performance
- Display market data on cards (price change %, mcap)
- Update stats between matches (not mid-game)

### [ ] Basic AI Opponent
**Files**: `lib/aiOpponent.ts` (exists!), `components/game-board.tsx`
**Requirements**:
- Simple AI that plays cards when it has mana
- AI attacks with all available minions
- AI prioritizes face damage when possible
- Hook AI into game loop

### [ ] UI/UX Polish
**Files**: `components/game-board.tsx`, `components/meme-card.tsx`
**Requirements**:
- Move opponent hand to right side (Hearthstone layout)
- Larger hero portrait frames
- Make deck stacks bigger
- Sound effects (card play, attack, win/lose)

---

## Priority 2: Core Features

### [ ] Card Type System
- Collection registry detection
- Fantasy DEF Pack → Armor/Defense
- Fantasy ATK Pack → Weapons
- Based Kids → Minions
- Equipment mechanics

### [ ] Match Result Tracking
- Store results (on-chain or Supabase)
- Track which cards were in winning/losing decks
- Calculate card win rates

### [ ] Nerf Voting System (Phase 1)
- Award voting tokens to losers
- Post-match "Flag OP Card" UI
- Display vote counts on cards

---

## Priority 3: Economic System

### [ ] Stake-to-Play
- Smart contract for match stakes
- Lock tokens before match
- Winner takes pot
- Loser auto-liquidates on Uniswap

---

## Completed
- [x] Full Hearthstone-style combat system
- [x] Turn-based gameplay with mana system
- [x] Privy wallet authentication
- [x] Fetch user's VibeMarket NFTs via Alchemy
- [x] Real NFT cards loaded into game
- [x] Win/lose conditions
- [x] Award nerf votes to loser UI

---

## Notes
- Build: `npm run build`
- Dev: `npm run dev` (localhost:3000)
- This project has Privy, Wagmi, real NFTs - don't recreate
- Check ROADMAP.md for full feature list
