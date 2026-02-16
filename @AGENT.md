# Game of Memes - Agent Instructions

## CRITICAL: Correct Project Location
**WORK IN:** `/Users/bradymckenna/Documents/AquaPrimeGenesis/game-of-memes/`
**DO NOT WORK IN:** `/Users/bradymckenna/Documents/game-of-memes/` (wrong project!)

## Quick Start

```bash
cd ~/Documents/AquaPrimeGenesis/game-of-memes

# Install dependencies
npm install

# Run development server
npm run dev

# Build (must pass!)
npm run build
```

## Project Structure

```
game-of-memes/
├── app/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── game-board.tsx      # Main game UI
│   ├── meme-card.tsx       # Card component
│   ├── hand-card.tsx       # Card in hand
│   ├── hero-portrait.tsx   # Hero/player portrait
│   ├── game-over-screen.tsx
│   ├── wallet-button.tsx   # Privy wallet
│   ├── providers.tsx       # Privy/Wagmi providers
│   ├── pack-opening/       # Pack opening system
│   └── ui/                 # shadcn components
├── hooks/
│   └── (custom hooks)
├── lib/
│   ├── game-context.tsx    # Game state management
│   ├── aiOpponent.ts       # AI logic
│   ├── vibemarket.ts       # VibeMarket API
│   ├── marketStats.ts      # Token price → card stats
│   ├── soulContract.ts     # Smart contract interaction
│   ├── basescanIndexer.ts  # Basescan API
│   └── xmtp.ts             # Chat
├── public/                  # Card images, assets
├── .env.local              # API keys (Privy, Alchemy)
├── ROADMAP.md              # Full feature roadmap
├── @fix_plan.md            # Current priorities
└── @AGENT.md               # This file
```

## Tech Stack

- **Next.js 16** with App Router
- **React 19**
- **TypeScript**
- **Tailwind CSS** + shadcn/ui
- **Privy** for wallet auth
- **Wagmi/Viem** for Web3
- **Ethers.js** for contracts
- **Alchemy** for NFT fetching
- **Base mainnet** blockchain
- **XMTP** for chat
- **Three.js** for 3D effects

## Environment Variables (.env.local)

Required keys:
- NEXT_PUBLIC_PRIVY_APP_ID
- NEXT_PUBLIC_ALCHEMY_API_KEY
- (others as needed)

## Key Components

### game-context.tsx
- GameProvider wraps the app
- Manages: players, hands, boards, turn, health
- Functions: playCard, attack, endTurn, etc.

### game-board.tsx
- Main game UI
- Renders hands, boards, heroes
- Handles drag-drop for cards

### vibemarket.ts
- Fetches NFTs from VibeMarket
- Filters for card NFTs (excludes unopened packs)

### marketStats.ts
- Calculates card stats from token market data
- Attack from price, Health from market cap

## Current Build Issue

Thread-stream/WalletConnect causing Turbopack errors.
Fix by either:
1. Exclude test files in tsconfig
2. Configure next.config.mjs
3. Clear node_modules

## Testing

1. `npm run dev`
2. Connect wallet via Privy
3. Should load your VibeMarket NFTs as cards
4. Play cards, attack, win/lose

## DO NOT:
- Create new projects
- Work in wrong folder
- Recreate Web3 integration that exists
- Ignore build errors
