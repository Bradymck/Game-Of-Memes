# Game of Memes

**A Hearthstone-style card game where your NFTs are your cards.**

Your VibeMarket NFT packs become playable decks. Card stats are derived from real market data. Losers vote to nerf overpowered cards. The community balances the meta.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![Base Chain](https://img.shields.io/badge/Base-Mainnet-blue)](https://base.org/)

## Features

- **NFT-Powered Cards** - Your VibeMarket NFT packs load as playable cards with stats derived from market performance
- **Hearthstone Combat** - Turn-based mana system, minion attacks, hero damage, drag-to-play
- **AI Opponent** - Play against an AI that uses your own cards against you
- **3D Card Rendering** - Three.js-powered card visuals with attack effects and damage numbers
- **Pack Opening** - Open NFT packs with Pyth VRF randomness, card flip reveal animations
- **Match History** - Track wins, losses, damage dealt, and cards played
- **Wallet Auth** - Sign in with your Ethereum wallet via Privy (no passwords)
- **Base Mainnet** - All NFT interactions on Base L2

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, Radix UI |
| 3D | Three.js, React Three Fiber, Drei |
| Auth | Privy (wallet-based) |
| Database | Supabase (PostgreSQL) |
| Chain | Base mainnet (via Alchemy + viem/wagmi) |
| NFTs | VibeMarket / Wield API |
| Testing | Vitest (unit), Playwright (e2e) |

## Quick Start

### Prerequisites

- Node.js 22+
- npm 10+
- A wallet with VibeMarket NFT packs on Base (for full gameplay)

### Setup

```bash
# Clone the repo
git clone https://github.com/Bradymck/Game-Of-Memes.git
cd Game-Of-Memes

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Fill in your API keys (see Environment Setup below)
# Then start the dev server
npm run dev
```

Visit `http://localhost:3000` to play.

### Environment Setup

Copy `.env.example` to `.env` and fill in the required values:

| Variable | Required | Where to Get It |
|----------|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | [Supabase Dashboard](https://supabase.com/dashboard) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Yes | [Privy Dashboard](https://dashboard.privy.io/) |
| `PRIVY_SECRET_KEY` | Yes | Privy Dashboard > Settings |
| `WIELD_API_KEY` | Yes | [VibeMarket](https://vibemarket.wieldlabs.com/) |
| `NEXT_PUBLIC_ALCHEMY_API_KEY` | Yes | [Alchemy Dashboard](https://dashboard.alchemy.com/) |
| `OPENAI_API_KEY` | For AI decks | [OpenAI](https://platform.openai.com/api-keys) |

See `.env.example` for the full list with descriptions.

## Project Structure

```
app/                    # Next.js App Router pages + API routes
  api/
    ai-deck/            # AI-generated deck building
    cards/              # Card data fetching (Wield API)
    matches/            # Match history recording
    packs/              # Pack/NFT data
  deck/                 # Deck builder page
  draft/                # Pack draft/opening flow
components/             # React components
  pack-opening/         # Pack opening ceremony components
  ui/                   # Radix-based UI primitives
  game-board.tsx        # Main game board
  meme-card.tsx         # Card component
  hero-portrait.tsx     # Hero display
hooks/                  # Custom React hooks
lib/                    # Utilities and business logic
  game-context.tsx      # Game state management
  supabase.ts           # Database client
  vibemarket.ts         # NFT/card data fetching
public/                 # Static assets and 3D models
supabase/               # Database migrations
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run lint` | Lint with ESLint |

## Web3 Integration

Game of Memes runs on **Base mainnet**. Key contracts:

| Contract | Address |
|----------|---------|
| AquaPrime NFT | `0x3e7A0f61A9889BFC6b8A9f356F9CC57299762369` |
| Moonstone Token | `0x491607a777AedAb22e5409820eF5386fBFE7F360` |

Card data is fetched from VibeMarket's Wield API. Pack ownership is verified via Alchemy's NFT API on Base.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, code style, and PR guidelines.

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the full feature roadmap, including:
- Pack token market data integration
- Stake-to-play economics
- PVP matchmaking
- Nerf voting governance
- Bitcoin NFT integration (Rare Pepes as legendary cards)

## License

[MIT](LICENSE)
