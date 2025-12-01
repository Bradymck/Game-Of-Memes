# Game of Memes

**Where Losers Balance the Meta** 🃏

An NFT card game where players vote on card balance, and losers have the power to nerf overpowered cards.

## Current Features (v0.1 - Prototype)

- ✅ Basic card game mechanics
- ✅ Turn-based gameplay
- ✅ Mana system (1-10)
- ✅ Card playing from hand to board
- ✅ Starter deck with 8 meme cards
- ✅ Animated card components
- ✅ Responsive game board UI

## Roadmap

### Phase 1: Core Gameplay (Current)
- [x] Card system
- [x] Basic turn mechanics
- [ ] Combat system (attack cards/player)
- [ ] Card effects (battlecry, deathrattle, etc.)
- [ ] AI opponent

### Phase 2: NFT Integration
- [ ] Wallet connection (wagmi/viem)
- [ ] ERC-1155 smart contracts (Base L2)
- [ ] Card ownership on-chain
- [ ] Card minting system
- [ ] Trading/marketplace

### Phase 3: Voting System
- [ ] Match result tracking
- [ ] "Losers vote on nerfs" mechanic
- [ ] DAO governance smart contract
- [ ] Voting UI
- [ ] Balance change execution

### Phase 4: Polish
- [ ] Card artwork (replace placeholders)
- [ ] Sound effects
- [ ] More card sets
- [ ] Deck builder
- [ ] Leaderboards
- [ ] Matchmaking

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play!

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Animations**: Framer Motion
- **Future**: wagmi/viem (web3), Supabase (backend), Base L2 (blockchain)

## Game Mechanics

### Basic Rules
- Start with 30 health
- Draw 3 cards at game start
- Gain 1 max mana per turn (up to 10)
- Play cards by spending mana
- First player to reduce opponent to 0 health wins

### Card Rarities
- **Common** (Gray): Basic cards
- **Rare** (Blue): Better stats
- **Epic** (Purple): Special abilities
- **Legendary** (Orange): Most powerful

## The Vision

This game will be truly community-balanced:
1. **Players lose to OP cards** → Get voting power
2. **Vote to nerf cards** → Smart contract governance
3. **Community decides balance** → No centralized developer control
4. **True ownership** → Cards are NFTs you can trade

## Development

This is a work in progress! Currently in prototype phase.

Built with ❤️ and memes
