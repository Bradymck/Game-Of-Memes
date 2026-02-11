# Game of Memes - Agent Instructions

## Quick Start

```bash
# Install dependencies (if needed)
npm install

# Run development server
npm run dev

# Build (verify TypeScript compiles)
npm run build

# Lint
npm run lint
```

## Project Structure

```
game-of-memes/
├── app/
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Main game (ALL game logic here)
├── components/
│   ├── Card.tsx         # Card display component
│   └── HeroPortrait.tsx # Hero portrait with health bar
├── lib/
│   ├── types.ts         # TypeScript interfaces
│   ├── cards.ts         # Card definitions and deck generation
│   ├── marketStats.ts   # Market data -> card stats calculation
│   └── utils.ts         # Utility functions
├── public/
│   └── *.jpg            # Card images
├── specs/               # Project specifications for Ralph
├── PROMPT.md            # Ralph instructions
├── @fix_plan.md         # Prioritized task list
└── @AGENT.md            # This file
```

## Key Types (lib/types.ts)

```typescript
interface Card {
  id: string;
  name: string;
  cost: number;
  attack: number;
  health: number;
  imageUrl: string;
  description?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  effect?: 'battlecry' | 'deathrattle' | 'taunt' | 'charge' | 'lifesteal';
  marketData?: MarketData;
}

interface BoardCard extends Card {
  currentHealth: number;
  currentAttack: number;
  canAttack: boolean;
  summoningSickness: boolean;
}

interface Player {
  id: string;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  deck: Card[];
  hand: Card[];
  board: BoardCard[];
  graveyard: Card[];
}
```

## Game State (in app/page.tsx)

The main game uses React useState hooks:
- `gameState` - player1, player2, turn, turnNumber, phase, winner
- `selectedAttacker` - currently selected minion for attack
- Helper functions: `playCard()`, `handleSelectAttacker()`, `handleAttackMinion()`, `handleAttackHero()`, `endTurn()`, `startNewGame()`

## Existing Cards (lib/cards.ts)

8 starter cards with market-based stats:
- $PEPE, $DOGE, $WOJAK, $CHAD (has charge), $STONKS, $PANIC, $BEAR (has battlecry), $PAPER

## Build Verification

Always run after changes:
```bash
npm run build
```

Must see: "Creating an optimized production build" and no errors.

## Browser Testing

1. Run `npm run dev`
2. Open http://localhost:3000
3. Test:
   - Play cards from hand
   - Attack with minions
   - Win/lose conditions
   - Play Again button

## Code Style

- Use TypeScript strictly
- Framer Motion for animations
- Tailwind CSS for styling
- Keep game logic in app/page.tsx
- Small, focused components

## Common Issues

1. **Type errors**: Check Card vs BoardCard - use type guards like `'currentHealth' in card`
2. **Animation**: Use Framer Motion's `motion.div` with `whileHover`, `animate`, etc.
3. **State updates**: Use functional updates for state that depends on previous state
