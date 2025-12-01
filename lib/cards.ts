import { Card } from './types';
import { calculateCardStats } from './marketStats';

// Mock market data for MVP (future: fetch from DEX Screener/CoinGecko)
export const MEME_CARDS_WITH_MARKET_DATA: Card[] = [
  {
    id: 'pepe-1',
    name: '$PEPE',
    imageUrl: '/sad-pepe-frog-meme-crying.jpg',
    description: 'OG meme coin. Never dies.',
    ...calculateCardStats({
      price: 0.000008,
      marketCap: 3_400_000_000,
      liquidity: 45_000_000,
      volume24h: 180_000_000,
      priceChange24h: 5.2,
    }),
    marketData: {
      price: 0.000008,
      marketCap: 3_400_000_000,
      liquidity: 45_000_000,
      volume24h: 180_000_000,
      priceChange24h: 5.2,
    },
  },
  {
    id: 'doge-1',
    name: '$DOGE',
    imageUrl: '/shiba-inu-dog-diamond-hands-crypto-meme.jpg',
    description: 'Much hodl. Very diamond hands. Wow.',
    ...calculateCardStats({
      price: 0.08,
      marketCap: 11_500_000_000,
      liquidity: 120_000_000,
      volume24h: 450_000_000,
      priceChange24h: -2.1,
    }),
    marketData: {
      price: 0.08,
      marketCap: 11_500_000_000,
      liquidity: 120_000_000,
      volume24h: 450_000_000,
      priceChange24h: -2.1,
    },
  },
  {
    id: 'wojak-1',
    name: '$WOJAK',
    imageUrl: '/wojak-meme-face-crying-trader.jpg',
    description: 'Panic sells. Paper hands.',
    ...calculateCardStats({
      price: 0.00012,
      marketCap: 45_000,
      liquidity: 8_000,
      volume24h: 12_000,
      priceChange24h: -15.5,
    }),
    marketData: {
      price: 0.00012,
      marketCap: 45_000,
      liquidity: 8_000,
      volume24h: 12_000,
      priceChange24h: -15.5,
    },
  },
  {
    id: 'chad-1',
    name: '$CHAD',
    imageUrl: '/chad-muscular-bull-crypto-meme.jpg',
    description: 'Bull market alpha. Never backs down.',
    effect: 'charge',
    ...calculateCardStats({
      price: 1.25,
      marketCap: 85_000_000,
      liquidity: 12_000_000,
      volume24h: 28_000_000,
      priceChange24h: 22.8,
    }),
    marketData: {
      price: 1.25,
      marketCap: 85_000_000,
      liquidity: 12_000_000,
      volume24h: 28_000_000,
      priceChange24h: 22.8,
    },
  },
  {
    id: 'stonks-1',
    name: '$STONKS',
    imageUrl: '/stonks-meme-man-suit-pointing-up.jpg',
    description: 'Only goes up. Trust the chart.',
    ...calculateCardStats({
      price: 0.45,
      marketCap: 8_500_000,
      liquidity: 950_000,
      volume24h: 2_200_000,
      priceChange24h: 12.3,
    }),
    marketData: {
      price: 0.45,
      marketCap: 8_500_000,
      liquidity: 950_000,
      volume24h: 2_200_000,
      priceChange24h: 12.3,
    },
  },
  {
    id: 'panic-1',
    name: '$PANIC',
    imageUrl: '/angry-newspaper-reader-panic-meme.jpg',
    description: 'FUD spreader. Weak hands activate.',
    ...calculateCardStats({
      price: 0.0015,
      marketCap: 125_000,
      liquidity: 18_000,
      volume24h: 32_000,
      priceChange24h: -8.7,
    }),
    marketData: {
      price: 0.0015,
      marketCap: 125_000,
      liquidity: 18_000,
      volume24h: 32_000,
      priceChange24h: -8.7,
    },
  },
  {
    id: 'bear-1',
    name: '$BEAR',
    imageUrl: '/scary-bear-market-crash-meme.jpg',
    description: 'Crashes markets. Destroys portfolios.',
    effect: 'battlecry',
    ...calculateCardStats({
      price: 0.028,
      marketCap: 2_800_000,
      liquidity: 450_000,
      volume24h: 980_000,
      priceChange24h: 8.4,
    }),
    marketData: {
      price: 0.028,
      marketCap: 2_800_000,
      liquidity: 450_000,
      volume24h: 980_000,
      priceChange24h: 8.4,
    },
  },
  {
    id: 'nervous-1',
    name: '$PAPER',
    imageUrl: '/nervous-sweating-man-selling-meme.jpg',
    description: 'Sells at bottom. Regrets forever.',
    ...calculateCardStats({
      price: 0.00089,
      marketCap: 78_000,
      liquidity: 12_000,
      volume24h: 8_500,
      priceChange24h: -22.1,
    }),
    marketData: {
      price: 0.00089,
      marketCap: 78_000,
      liquidity: 12_000,
      volume24h: 8_500,
      priceChange24h: -22.1,
    },
  },
];

// Generate a starter deck
export function generateStarterDeck(): Card[] {
  const deck: Card[] = [];

  // Add 2 copies of each card for now
  MEME_CARDS_WITH_MARKET_DATA.forEach(card => {
    deck.push({ ...card });
    deck.push({ ...card, id: card.id + '-copy' });
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
