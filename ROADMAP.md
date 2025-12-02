# Game of Memes - Development Roadmap

## ✅ Completed Tonight (Session 1)

### Core Game
- [x] Full Hearthstone-style combat system
- [x] Turn-based gameplay with mana system
- [x] Attack minions and heroes
- [x] Damage calculation and minion death
- [x] Beautiful v0 UI with dark cyber background
- [x] Rectangular trading card design
- [x] Bigger cards and UI elements
- [x] Drag-to-play with zoom effect
- [x] Opponent hand visualization

### Web3 Integration
- [x] Privy wallet authentication
- [x] Fetch user's VibeMarket NFTs via Alchemy
- [x] Filter for VibeMarket cards only (exclude unopened packs)
- [x] Real NFT cards loaded into game
- [x] Opponent uses player's cards (for AI testing)
- [x] VibeMarket card back on deck stacks

### Infrastructure
- [x] Market stat calculation algorithm
- [x] Project setup at `/Documents/AquaPrimeGenesis/game-of-memes/`
- [x] Privy, Alchemy, VibeMarket APIs configured
- [x] Base mainnet integration

---

## 🎯 Priority TODO (Tomorrow - Session 2)

### 1. Win/Lose Conditions ⭐⭐⭐
- [x] Check if playerHealth <= 0 or opponentHealth <= 0
- [x] Show victory/defeat screen
- [x] Display final stats (damage dealt, cards played, etc.)
- [x] "Play Again" button
- [x] Award nerf votes to loser (UI shows 1 vote earned)

### 2. Pack Token Market Data Integration ⭐⭐⭐
- [ ] Get pack ERC20 token address from contract
- [ ] Check if token is on bonding curve or Uniswap
- [ ] Fetch token price, market cap, liquidity, volume
- [ ] Calculate card stats from pack performance
- [ ] Display market data on cards (price change %, mcap)
- [ ] Update stats between matches (not mid-game)

### 3. UI/UX Polish ⭐⭐
- [ ] Move opponent hand to right side (Hearthstone layout)
- [ ] Larger hero portrait frames with arch shape
- [ ] Fix ENS avatar (use Basename for Base or skip for MVP)
- [ ] Make deck stacks even bigger
- [ ] Add sound effects (card play, attack, win/lose)

### 4. Basic AI Opponent ⭐⭐
- [ ] Simple AI that plays cards when it has mana
- [ ] AI attacks with all available minions
- [ ] AI prioritizes face damage when possible
- [ ] Different difficulty levels for testing

---

## 🚀 Core Features (Week 1-2)

### Card Type System
- [ ] Collection registry (on-chain mapping)
- [ ] Detect card types:
  - Fantasy DEF Pack → Armor/Defense equipment
  - Fantasy ATK Pack → Weapon equipment
  - Based Kids → Minions
  - Future: Spell packs, Companion packs
- [ ] Equipment mechanics (attach to minions)
- [ ] Foil/Pristine bonuses
- [ ] Keyword parsing for card abilities

### Match Result Tracking
- [ ] Store match results on-chain or Supabase
- [ ] Track which cards were in winning/losing decks
- [ ] Calculate card win rates
- [ ] DefCon threat level system (1-5 based on win %)

### Nerf Voting System (Phase 1)
- [ ] Award voting tokens to losers
- [ ] Voting power formula:
  ```
  power = lossMargin × rarityMultiplier × holdDuration × ownership
  ```
- [ ] Post-match "Flag OP Card" UI
- [ ] Off-chain vote tallying
- [ ] Display vote counts on cards
- [ ] Show DefCon levels in-game

---

## 💰 Economic System (Week 2-3)

### Stake-to-Play
- [ ] Smart contract for match stakes
- [ ] Lock tokens before match
- [ ] Winner takes pot (minus protocol fee)
- [ ] Loser's tokens auto-liquidate on Uniswap
- [ ] Buy unopened pack with liquidation proceeds
- [ ] Transfer pack NFT to winner

### Prize System
- [ ] Tournament smart contracts
- [ ] Entry fee collection
- [ ] Prize pool distribution
- [ ] Unopened packs as rewards
- [ ] Leaderboard tracking

### Token Utility
- [ ] Must stake pack token to play with those cards
- [ ] Entry fees in pack tokens
- [ ] Burn mechanism (% of fees)
- [ ] LP staking rewards

---

## 🎮 PVP System (Week 3-4)

### Room Codes (Simple Start)
- [ ] Create game room with code (like Jackbox)
- [ ] Share code with friend
- [ ] Real-time sync via Supabase Realtime
- [ ] Both players lock stakes in contract
- [ ] Trustless settlement

### Async AI-vs-AI (Advanced)
- [ ] Player A vs AI(Player B's deck)
- [ ] Player B vs AI(Player A's deck)
- [ ] Compare scores to determine winner
- [ ] Fully async, no coordination needed
- [ ] Deterministic AI with same seed

### Matchmaking (Future)
- [ ] Skill-based rating (ELO/MMR)
- [ ] Queue system
- [ ] Stake tier matching
- [ ] Tournament brackets

---

## 🗳️ Governance & Balance (Week 4+)

### Voting System (Phase 2)
- [ ] Nerf proposal UI
- [ ] 7-day voting period
- [ ] Quadratic voting implementation
- [ ] On-chain vote execution
- [ ] 3-day timelock before nerf
- [ ] Card stat updates via oracle

### Anti-Abuse
- [ ] Max votes per wallet
- [ ] Proposal cooldown (30 days per card)
- [ ] Must own 3+ cards from pack to vote
- [ ] False voter penalty system
- [ ] Emergency nerf for DefCon 1

### Community Features
- [ ] Pack creator metadata standard
- [ ] Collection registry DAO
- [ ] Community card tagging
- [ ] Leaderboard of best voters
- [ ] Voting accuracy rewards

---

## 🎨 Content & Polish (Ongoing)

### Card Mechanics
- [ ] Spells (foil cards?)
- [ ] Equipment system (attach to minions)
- [ ] Artifacts (ongoing effects)
- [ ] Companions from companion packs
- [ ] Custom abilities from metadata

### Visual Effects
- [ ] Attack animations
- [ ] Damage numbers
- [ ] Card play particles
- [ ] Win/lose screen animations
- [ ] Legendary card shine effects

### Audio
- [ ] Card play sounds
- [ ] Attack sounds
- [ ] Ambient background music
- [ ] Victory/defeat jingles

---

## 🌐 Decentralization Path (Month 2+)

### Reduce Centralization
- [ ] IPFS for game state storage
- [ ] Ceramic for match history
- [ ] Libp2p for peer discovery
- [ ] Run own Base node (remove Alchemy dep)
- [ ] WalletConnect only (remove Privy)

### Full Satoshi Mode
- [ ] No Supabase (use OrbitDB/GunDB)
- [ ] DHT-based matchmaking
- [ ] Fully client-side game logic
- [ ] On-chain settlement only
- [ ] Unstoppable, uncensorable

---

## 💡 Innovation Ideas (Backlog)

### Bitcoin NFT Integration 🔥 (KILLER FEATURE)
- [ ] Add Bitcoin wallet connection (like pepe.wtf does)
- [ ] Fetch Counterparty NFTs (Rare Pepes, Spells of Genesis)
- [ ] Load Bitcoin NFTs as legendary tier cards
- [ ] Age bonus (2014 cards = +5 attack!)
- [ ] Cross-chain: Bitcoin + Ethereum + Base in one game
- [ ] **Marketing gold:** "Play your $100K Rare Pepe"
- [ ] Bridge via Emblem Vault or signature proof
- [ ] OG NFT holders get special perks/voting power

### Pack Token Integration
- [ ] Stats update based on Uniswap price/liquidity
- [ ] Bonding curve detection
- [ ] Market cap milestones unlock tiers
- [ ] Volume-based card cost scaling

### Community Packs
- [ ] Open standard for game-compatible packs
- [ ] Auto-registration for qualifying packs
- [ ] Pack creator incentives
- [ ] UGC card abilities

### Advanced Features
- [ ] Draft mode (open packs, build deck)
- [ ] Sealed deck tournaments
- [ ] Card trading/marketplace
- [ ] Deck sharing (export/import codes)
- [ ] Replay system
- [ ] Tournament spectating

---

## 🎯 MVP Launch Checklist

**Minimum Viable Game:**
- [x] Working card game with combat
- [x] Real NFT integration
- [ ] Win/lose conditions
- [ ] Basic AI opponent
- [ ] Pack token stats (simple version)
- [ ] Stake-to-play (single match)
- [ ] Post-match voting UI

**Target:** Ship in 2 weeks, iterate based on feedback!

---

## 📊 Success Metrics

**Week 1:**
- 100 matches played
- 10 unique players
- 5 packs staked

**Month 1:**
- 1000 matches
- 100 players
- 50 ETH in stakes
- 10 VibeMarket packs integrated

**Month 3:**
- 10K matches
- 1K players
- First community nerf vote
- 5 new pack types created FOR the game

---

## 🔥 The Vision

**"The Bitcoin of Hearthstone"**
- Truly decentralized card ownership
- Community-balanced meta
- Pack tokens = card power
- Losers balance the game
- Stake-to-play with liquidation
- Self-funding prize pools

**No other game does this.** You're building something genuinely innovative! 🎮💎

---

_Last updated: Dec 1, 2025 - After epic 6-hour building session!_