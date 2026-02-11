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
    effect: 'deathrattle',
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
  {
    id: 'diamond-1',
    name: '$DIAMOND',
    imageUrl: '/shiba-inu-dog-diamond-hands-crypto-meme.jpg',
    description: 'Diamond hands. Unshakeable.',
    effect: 'taunt',
    ...calculateCardStats({
      price: 0.35,
      marketCap: 5_200_000,
      liquidity: 780_000,
      volume24h: 1_800_000,
      priceChange24h: 6.8,
    }),
    marketData: {
      price: 0.35,
      marketCap: 5_200_000,
      liquidity: 780_000,
      volume24h: 1_800_000,
      priceChange24h: 6.8,
    },
  },
  {
    id: 'moon-1',
    name: '$MOON',
    imageUrl: '/stonks-meme-man-suit-pointing-up.jpg',
    description: 'To the moon! Inevitable pump.',
    ...calculateCardStats({
      price: 2.5,
      marketCap: 120_000_000,
      liquidity: 18_000_000,
      volume24h: 42_000_000,
      priceChange24h: 35.2,
    }),
    marketData: {
      price: 2.5,
      marketCap: 120_000_000,
      liquidity: 18_000_000,
      volume24h: 42_000_000,
      priceChange24h: 35.2,
    },
  },
  {
    id: 'shib-1',
    name: '$SHIB',
    imageUrl: '/shiba-inu-dog-diamond-hands-crypto-meme.jpg',
    description: 'Doge killer. Community strong.',
    ...calculateCardStats({
      price: 0.000015,
      marketCap: 8_800_000_000,
      liquidity: 95_000_000,
      volume24h: 320_000_000,
      priceChange24h: 3.4,
    }),
    marketData: {
      price: 0.000015,
      marketCap: 8_800_000_000,
      liquidity: 95_000_000,
      volume24h: 320_000_000,
      priceChange24h: 3.4,
    },
  },
  {
    id: 'hodl-1',
    name: '$HODL',
    imageUrl: '/shiba-inu-dog-diamond-hands-crypto-meme.jpg',
    description: 'Never sells. True believer.',
    effect: 'taunt',
    ...calculateCardStats({
      price: 0.12,
      marketCap: 1_500_000,
      liquidity: 220_000,
      volume24h: 550_000,
      priceChange24h: 2.1,
    }),
    marketData: {
      price: 0.12,
      marketCap: 1_500_000,
      liquidity: 220_000,
      volume24h: 550_000,
      priceChange24h: 2.1,
    },
  },
  {
    id: 'fomo-1',
    name: '$FOMO',
    imageUrl: '/angry-newspaper-reader-panic-meme.jpg',
    description: 'Buys high. FOMO activated.',
    effect: 'charge',
    ...calculateCardStats({
      price: 0.0025,
      marketCap: 250_000,
      liquidity: 35_000,
      volume24h: 85_000,
      priceChange24h: 18.5,
    }),
    marketData: {
      price: 0.0025,
      marketCap: 250_000,
      liquidity: 35_000,
      volume24h: 85_000,
      priceChange24h: 18.5,
    },
  },
  {
    id: 'pump-1',
    name: '$PUMP',
    imageUrl: '/stonks-meme-man-suit-pointing-up.jpg',
    description: 'Artificial rally. Unsustainable gains.',
    ...calculateCardStats({
      price: 0.0055,
      marketCap: 550_000,
      liquidity: 75_000,
      volume24h: 180_000,
      priceChange24h: 45.7,
    }),
    marketData: {
      price: 0.0055,
      marketCap: 550_000,
      liquidity: 75_000,
      volume24h: 180_000,
      priceChange24h: 45.7,
    },
  },
  {
    id: 'dump-1',
    name: '$DUMP',
    imageUrl: '/wojak-meme-face-crying-trader.jpg',
    description: 'Rug pull incoming. Exit liquidity.',
    ...calculateCardStats({
      price: 0.00001,
      marketCap: 10_000,
      liquidity: 2_000,
      volume24h: 3_500,
      priceChange24h: -65.3,
    }),
    marketData: {
      price: 0.00001,
      marketCap: 10_000,
      liquidity: 2_000,
      volume24h: 3_500,
      priceChange24h: -65.3,
    },
  },
  {
    id: 'whale-1',
    name: '$WHALE',
    imageUrl: '/chad-muscular-bull-crypto-meme.jpg',
    description: 'Market maker. Moves prices.',
    effect: 'battlecry',
    ...calculateCardStats({
      price: 5.0,
      marketCap: 500_000_000,
      liquidity: 65_000_000,
      volume24h: 150_000_000,
      priceChange24h: 8.9,
    }),
    marketData: {
      price: 5.0,
      marketCap: 500_000_000,
      liquidity: 65_000_000,
      volume24h: 150_000_000,
      priceChange24h: 8.9,
    },
  },
  {
    id: 'vamp-1',
    name: '$VAMP',
    imageUrl: '/chad-muscular-bull-crypto-meme.jpg',
    description: 'Drains value. Feeds on losses.',
    effect: 'lifesteal',
    ...calculateCardStats({
      price: 0.75,
      marketCap: 18_000_000,
      liquidity: 2_500_000,
      volume24h: 6_800_000,
      priceChange24h: 14.2,
    }),
    marketData: {
      price: 0.75,
      marketCap: 18_000_000,
      liquidity: 2_500_000,
      volume24h: 6_800_000,
      priceChange24h: 14.2,
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
