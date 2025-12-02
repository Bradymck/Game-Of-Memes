/**
 * Calculate game stats from market data
 * Stats are IMMUTABLE during match (snapshot at deck build)
 * Only update between matches based on milestones
 */

export interface MarketData {
  price: number;
  marketCap: number;
  liquidity: number;
  volume24h: number;
  priceChange24h: number;
  holderCount?: number;
}

// Attack based on price milestones
export function calculateAttack(price: number): number {
  if (price >= 10) return 7;
  if (price >= 1) return 6;
  if (price >= 0.1) return 5;
  if (price >= 0.01) return 4;
  if (price >= 0.001) return 3;
  if (price >= 0.0001) return 2;
  return 1;
}

// Defense based on market cap milestones
export function calculateDefense(marketCap: number): number {
  if (marketCap >= 100_000_000) return 6; // $100M+
  if (marketCap >= 10_000_000) return 5;  // $10M+
  if (marketCap >= 1_000_000) return 4;   // $1M+
  if (marketCap >= 100_000) return 3;     // $100k+
  if (marketCap >= 10_000) return 2;      // $10k+
  return 1;
}

// Cost based on combined power
export function calculateCost(attack: number, defense: number): number {
  const totalStats = attack + defense;
  if (totalStats >= 12) return 10;
  if (totalStats >= 10) return 8;
  if (totalStats >= 8) return 6;
  if (totalStats >= 6) return 4;
  if (totalStats >= 4) return 3;
  if (totalStats >= 3) return 2;
  return 1;
}

// Rarity based on liquidity + market cap
export function calculateRarity(
  marketCap: number,
  liquidity: number
): 'common' | 'rare' | 'epic' | 'legendary' {
  const score = Math.log10(marketCap) + Math.log10(liquidity);

  if (score >= 12) return 'legendary'; // $100M mcap + $10M liq
  if (score >= 10) return 'epic';      // $10M mcap + $1M liq
  if (score >= 8) return 'rare';       // $1M mcap + $100k liq
  return 'common';
}

// Card is playable if liquidity is sufficient
export function isCardPlayable(liquidity: number): boolean {
  return liquidity >= 5000; // Min $5k liquidity to prevent scams
}

// Calculate all stats from market data
export function calculateCardStats(marketData: MarketData) {
  const attack = calculateAttack(marketData.price);
  const defense = calculateDefense(marketData.marketCap);
  const cost = calculateCost(attack, defense);
  const rarity = calculateRarity(marketData.marketCap, marketData.liquidity);

  return {
    attack,
    health: defense, // v0 uses 'health' not 'defense'
    mana: cost,      // v0 uses 'mana' not 'cost'
    rarity,
    isPlayable: isCardPlayable(marketData.liquidity),
  };
}

// For display: format market data
export function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1_000_000_000) return `$${(marketCap / 1_000_000_000).toFixed(2)}B`;
  if (marketCap >= 1_000_000) return `$${(marketCap / 1_000_000).toFixed(2)}M`;
  if (marketCap >= 1_000) return `$${(marketCap / 1_000).toFixed(1)}K`;
  return `$${marketCap.toFixed(0)}`;
}

export function formatPrice(price: number): string {
  if (price >= 1) return `$${price.toFixed(2)}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(6)}`;
}