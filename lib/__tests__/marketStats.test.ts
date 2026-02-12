import { describe, it, expect } from "vitest";
import {
  calculateAttack,
  calculateDefense,
  calculateCost,
  calculateRarity,
  calculateCardStats,
  isCardPlayable,
  formatMarketCap,
  formatPrice,
  type MarketData,
} from "../marketStats";

describe("marketStats", () => {
  describe("calculateAttack", () => {
    it("should calculate attack based on price milestones", () => {
      expect(calculateAttack(0.00005)).toBe(1);
      expect(calculateAttack(0.0001)).toBe(2);
      expect(calculateAttack(0.001)).toBe(3);
      expect(calculateAttack(0.01)).toBe(4);
      expect(calculateAttack(0.1)).toBe(5);
      expect(calculateAttack(1)).toBe(6);
      expect(calculateAttack(10)).toBe(7);
      expect(calculateAttack(100)).toBe(7);
    });
  });

  describe("calculateDefense", () => {
    it("should calculate defense based on market cap milestones", () => {
      expect(calculateDefense(5_000)).toBe(1);
      expect(calculateDefense(10_000)).toBe(2);
      expect(calculateDefense(100_000)).toBe(3);
      expect(calculateDefense(1_000_000)).toBe(4);
      expect(calculateDefense(10_000_000)).toBe(5);
      expect(calculateDefense(100_000_000)).toBe(6);
      expect(calculateDefense(1_000_000_000)).toBe(6);
    });
  });

  describe("calculateCost", () => {
    it("should calculate mana cost based on total stats", () => {
      expect(calculateCost(1, 1)).toBe(1); // total 2
      expect(calculateCost(2, 1)).toBe(2); // total 3
      expect(calculateCost(2, 2)).toBe(3); // total 4
      expect(calculateCost(3, 3)).toBe(4); // total 6
      expect(calculateCost(4, 4)).toBe(6); // total 8
      expect(calculateCost(5, 5)).toBe(8); // total 10
      expect(calculateCost(6, 6)).toBe(10); // total 12
      expect(calculateCost(7, 6)).toBe(10); // total 13
    });
  });

  describe("calculateRarity", () => {
    it("should calculate rarity based on market cap and liquidity", () => {
      expect(calculateRarity(10_000, 1_000)).toBe("common");
      expect(calculateRarity(1_000_000, 100_000)).toBe("epic"); // log10(1M) + log10(100k) = 6 + 5 = 11 -> epic
      expect(calculateRarity(10_000_000, 1_000_000)).toBe("legendary"); // log10(10M) + log10(1M) = 7 + 6 = 13 -> legendary
      expect(calculateRarity(100_000_000, 10_000_000)).toBe("legendary");
    });
  });

  describe("calculateCardStats", () => {
    it("should calculate all stats from market data", () => {
      const marketData: MarketData = {
        price: 0.05,
        marketCap: 5_000_000,
        liquidity: 500_000,
        volume24h: 100_000,
        priceChange24h: 10.5,
      };

      const stats = calculateCardStats(marketData);

      expect(stats.attack).toBe(4); // price 0.05 -> 4 (0.01 milestone)
      expect(stats.health).toBe(4); // mcap 5M -> 4 (1M milestone)
      expect(stats.mana).toBe(6); // total 8 -> 6
      expect(stats.rarity).toBe("legendary"); // mcap 5M + liq 500k -> score 12.4 -> legendary
      expect(stats.isPlayable).toBe(true); // liq > 5k
    });

    it("should handle low liquidity tokens", () => {
      const marketData: MarketData = {
        price: 1,
        marketCap: 10_000,
        liquidity: 1_000,
        volume24h: 100,
        priceChange24h: 0,
      };

      const stats = calculateCardStats(marketData);

      expect(stats.isPlayable).toBe(false); // liq < 5k
    });
  });

  describe("isCardPlayable", () => {
    it("should require minimum $5k liquidity", () => {
      expect(isCardPlayable(4_999)).toBe(false);
      expect(isCardPlayable(5_000)).toBe(true);
      expect(isCardPlayable(10_000)).toBe(true);
    });
  });

  describe("formatMarketCap", () => {
    it("should format market cap with appropriate units", () => {
      expect(formatMarketCap(500)).toBe("$500");
      expect(formatMarketCap(5_000)).toBe("$5.0K");
      expect(formatMarketCap(5_500_000)).toBe("$5.50M");
      expect(formatMarketCap(2_300_000_000)).toBe("$2.30B");
    });
  });

  describe("formatPrice", () => {
    it("should format price with appropriate decimal places", () => {
      expect(formatPrice(0.000001234)).toBe("$0.000001");
      expect(formatPrice(0.0012345)).toBe("$0.001234"); // 4 decimals for 0.01 < price < 1
      expect(formatPrice(0.123456)).toBe("$0.1235");
      expect(formatPrice(1.234567)).toBe("$1.23");
      expect(formatPrice(123.456)).toBe("$123.46");
    });
  });
});
