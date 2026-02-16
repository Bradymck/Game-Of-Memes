/**
 * Token Price API - DexScreener integration with caching
 * Free API, no auth needed: https://api.dexscreener.com/latest/dex/tokens/{address}
 */

import { MarketData } from "./marketStats";

const DEXSCREENER_BASE = "https://api.dexscreener.com/latest/dex/tokens";
const CACHE_TTL_MS = 30_000; // 30 seconds

interface CacheEntry {
  data: MarketData | null;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Fetch token market data from DexScreener
 * Returns null if no DEX pairs found or API fails
 */
export async function fetchTokenMarketData(
  tokenAddress: string,
): Promise<MarketData | null> {
  // Check cache first
  const cached = cache.get(tokenAddress);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const response = await fetch(`${DEXSCREENER_BASE}/${tokenAddress}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `DexScreener API error for ${tokenAddress}:`,
        response.status,
      );
      cache.set(tokenAddress, { data: null, timestamp: Date.now() });
      return null;
    }

    const data = await response.json();

    // DexScreener returns { pairs: [...] }
    if (!data.pairs || data.pairs.length === 0) {
      console.log(`No DEX pairs found for token ${tokenAddress}`);
      cache.set(tokenAddress, { data: null, timestamp: Date.now() });
      return null;
    }

    // Use the first pair (usually highest liquidity)
    const pair = data.pairs[0];

    const marketData: MarketData = {
      price: parseFloat(pair.priceUsd || "0"),
      marketCap: parseFloat(pair.fdv || pair.marketCap || "0"),
      liquidity: parseFloat(pair.liquidity?.usd || "0"),
      volume24h: parseFloat(pair.volume?.h24 || "0"),
      priceChange24h: parseFloat(pair.priceChange?.h24 || "0"),
    };

    // Cache the result
    cache.set(tokenAddress, { data: marketData, timestamp: Date.now() });

    return marketData;
  } catch (error) {
    console.error(`Failed to fetch market data for ${tokenAddress}:`, error);
    cache.set(tokenAddress, { data: null, timestamp: Date.now() });
    return null;
  }
}

/**
 * Clear the cache (useful for testing)
 */
export function clearCache(): void {
  cache.clear();
}
