# Game of Memes - Requirements Specification

## Overview
A Hearthstone-style NFT card game where meme token market data drives card stats, and losing players vote on card balance changes.

## Core Gameplay Requirements

### Turn System
- Two players take alternating turns
- Each turn: Draw phase -> Main phase -> End turn
- Player gains +1 max mana each turn (cap at 10)
- Mana refills to max at turn start

### Card Playing
- Cards cost mana to play
- Cards go from hand to board
- Maximum 7 minions on board
- Maximum 10 cards in hand (excess burned)

### Combat System
- Minions can attack once per turn
- Summoning sickness: can't attack turn played (unless Charge)
- Minion vs Minion: both take damage equal to other's attack
- Minion vs Hero: hero takes damage, minion takes none
- Minions die at 0 health

### Win Condition
- Reduce opponent's health to 0
- Starting health: 30

## Card Effects

### Charge
- Can attack immediately when played
- Bypasses summoning sickness

### Taunt
- Must be attacked before other targets
- Visual indicator required (shield/border)

### Battlecry
- Effect triggers when played from hand
- Does NOT trigger when summoned by other effects

### Deathrattle
- Effect triggers when minion dies
- Resolves before minion removed from board

### Lifesteal
- When dealing damage, heal hero by same amount
- Cannot exceed max health

## AI Opponent Requirements

### Decision Making
1. Play cards (prioritize fitting highest cost cards)
2. Make trades (attack enemy minions with favorable stats)
3. Go face (attack hero when no good trades)

### Behavior
- Small delay between actions for visual clarity
- Auto-end turn when no more actions possible
- Should be beatable but provide challenge

## Card Stat Calculation (from Market Data)

### Attack (based on token price)
- $10+ = 7 attack
- $1+ = 6 attack
- $0.10+ = 5 attack
- $0.01+ = 4 attack
- $0.001+ = 3 attack
- $0.0001+ = 2 attack
- Below = 1 attack

### Health (based on market cap)
- $100M+ = 6 health
- $10M+ = 5 health
- $1M+ = 4 health
- $100K+ = 3 health
- $10K+ = 2 health
- Below = 1 health

### Cost (based on total stats)
- 12+ stats = 10 mana
- 10+ stats = 8 mana
- 8+ stats = 6 mana
- 6+ stats = 4 mana
- 4+ stats = 3 mana
- 3+ stats = 2 mana
- Below = 1 mana

### Rarity (based on market cap + liquidity)
- Score 12+ = Legendary
- Score 10+ = Epic
- Score 8+ = Rare
- Below = Common

## UI Requirements

### Game Board
- Player area (bottom, blue border)
- Opponent area (top, red border)
- Hand displayed at bottom
- Board in middle
- Hero portraits with health bars

### Card Display
- Cost badge (top left, blue)
- Attack stat (bottom left, red)
- Health stat (bottom right, green/red if damaged)
- Rarity indicator (colored dot)
- Market change indicator (green up/red down arrow)

### Visual Feedback
- Selected attacker: yellow ring
- Targetable enemy hero: pulsing red
- Playable cards: full opacity
- Unplayable cards: dimmed
- Damaged health: red instead of green

## Future: NFT Integration (Phase 2)

- Wallet connection via wagmi/viem
- Cards as ERC-1155 NFTs on Base L2
- Card ownership on-chain
- Trading/marketplace

## Future: Voting System (Phase 3)

- Track match results
- Losers get voting power
- Vote on card nerfs/buffs
- DAO governance smart contract
