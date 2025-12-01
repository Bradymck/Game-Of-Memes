import { Card } from './types';

// Initial meme card set
export const STARTER_CARDS: Card[] = [
  {
    id: 'pepe-1',
    name: 'Rare Pepe',
    cost: 2,
    attack: 2,
    health: 3,
    rarity: 'rare',
    imageUrl: '/cards/pepe.jpg',
    description: 'A classic meme warrior',
  },
  {
    id: 'doge-1',
    name: 'Doge Commander',
    cost: 3,
    attack: 3,
    health: 3,
    rarity: 'common',
    imageUrl: '/cards/doge.jpg',
    description: 'Much attack. Very damage. Wow.',
  },
  {
    id: 'wojak-1',
    name: 'Sad Wojak',
    cost: 1,
    attack: 1,
    health: 2,
    rarity: 'common',
    imageUrl: '/cards/wojak.jpg',
    description: 'Starts weak but feels strong inside',
  },
  {
    id: 'chad-1',
    name: 'Giga Chad',
    cost: 5,
    attack: 6,
    health: 6,
    rarity: 'legendary',
    imageUrl: '/cards/chad.jpg',
    description: 'The ultimate alpha',
    effect: 'charge',
  },
  {
    id: 'nyan-1',
    name: 'Nyan Cat',
    cost: 4,
    attack: 3,
    health: 5,
    rarity: 'epic',
    imageUrl: '/cards/nyan.jpg',
    description: 'Flies over taunts',
  },
  {
    id: 'trollface-1',
    name: 'Troll Face',
    cost: 2,
    attack: 2,
    health: 2,
    rarity: 'common',
    imageUrl: '/cards/troll.jpg',
    description: 'U mad bro?',
    effect: 'battlecry',
  },
  {
    id: 'distracted-1',
    name: 'Distracted Boyfriend',
    cost: 3,
    attack: 2,
    health: 4,
    rarity: 'rare',
    imageUrl: '/cards/distracted.jpg',
    description: 'Attacks random target',
  },
  {
    id: 'stonks-1',
    name: 'Stonks Guy',
    cost: 4,
    attack: 4,
    health: 4,
    rarity: 'epic',
    imageUrl: '/cards/stonks.jpg',
    description: 'Only goes up',
  },
];

// Generate a starter deck
export function generateStarterDeck(): Card[] {
  const deck: Card[] = [];

  // Add copies of basic cards
  STARTER_CARDS.filter(c => c.rarity === 'common').forEach(card => {
    deck.push({ ...card });
    deck.push({ ...card, id: card.id + '-copy' });
  });

  // Add one copy of rares
  STARTER_CARDS.filter(c => c.rarity === 'rare').forEach(card => {
    deck.push({ ...card });
  });

  return shuffleDeck(deck);
}

// Shuffle deck
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
