// Core card types
export interface Card {
  id: string;
  name: string;
  cost: number;
  attack: number;
  health: number;
  imageUrl: string;
  description?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  effect?: CardEffect;
}

export type CardEffect = 'battlecry' | 'deathrattle' | 'taunt' | 'charge' | 'lifesteal';

// Player state
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
}

// Card on board (has current stats that can differ from base card)
export interface BoardCard extends Card {
  currentHealth: number;
  currentAttack: number;
  canAttack: boolean;
  summoningSickness: boolean;
}

// Game state
export interface GameState {
  player1: Player;
  player2: Player;
  turn: 'player1' | 'player2';
  turnNumber: number;
  phase: 'draw' | 'main' | 'attack' | 'end';
  winner?: 'player1' | 'player2' | 'draw';
}

// Actions
export type GameAction =
  | { type: 'PLAY_CARD'; playerId: string; cardId: string; position?: number }
  | { type: 'ATTACK'; attackerId: string; targetId: string }
  | { type: 'END_TURN'; playerId: string }
  | { type: 'CONCEDE'; playerId: string };

// Match result for NFT/voting system (future)
export interface MatchResult {
  winner: string;
  loser: string;
  winnerDeck: Card[];
  loserDeck: Card[];
  marginOfVictory: number;
  timestamp: number;
}

// Voting system (future blockchain integration)
export interface VoteProposal {
  id: string;
  cardId: string;
  proposedChange: {
    attack?: number;
    health?: number;
    cost?: number;
  };
  votesFor: number;
  votesAgainst: number;
  createdAt: number;
  expiresAt: number;
  status: 'active' | 'passed' | 'rejected' | 'expired';
}
