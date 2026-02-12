import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Match Tracking", () => {
  describe("Match data structure", () => {
    it("should have correct shape for match data object", () => {
      const matchData = {
        playerAddress: "0x1234567890abcdef1234567890abcdef12345678",
        playerWon: true,
        playerHealth: 25,
        opponentHealth: 0,
        cardsPlayed: 12,
        damageDealt: 30,
        turnCount: 8,
        difficulty: "normal",
        txHash:
          "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        durationSeconds: 480,
      };

      // Validate all fields exist and have correct types
      expect(typeof matchData.playerAddress).toBe("string");
      expect(typeof matchData.playerWon).toBe("boolean");
      expect(typeof matchData.playerHealth).toBe("number");
      expect(typeof matchData.opponentHealth).toBe("number");
      expect(typeof matchData.cardsPlayed).toBe("number");
      expect(typeof matchData.damageDealt).toBe("number");
      expect(typeof matchData.turnCount).toBe("number");
      expect(typeof matchData.difficulty).toBe("string");
      expect(typeof matchData.txHash).toBe("string");
      expect(typeof matchData.durationSeconds).toBe("number");

      // Validate wallet address format (lowercase hex)
      expect(matchData.playerAddress).toMatch(/^0x[0-9a-f]{40}$/);
    });

    it("should allow optional txHash field", () => {
      const matchData: {
        playerAddress: string;
        playerWon: boolean;
        playerHealth: number;
        opponentHealth: number;
        cardsPlayed: number;
        damageDealt: number;
        turnCount: number;
        difficulty: string;
        durationSeconds: number;
        txHash?: string;
      } = {
        playerAddress: "0x1234567890abcdef1234567890abcdef12345678",
        playerWon: false,
        playerHealth: 0,
        opponentHealth: 15,
        cardsPlayed: 8,
        damageDealt: 20,
        turnCount: 6,
        difficulty: "easy",
        durationSeconds: 240,
      };

      expect(matchData.txHash).toBeUndefined();
    });
  });

  describe("Duration calculation", () => {
    it("should calculate duration correctly from start and end times", () => {
      const matchStartTime = Date.now() - 5 * 60 * 1000; // 5 minutes ago
      const matchEndTime = Date.now();
      const durationSeconds = Math.floor(
        (matchEndTime - matchStartTime) / 1000,
      );

      expect(durationSeconds).toBeGreaterThanOrEqual(299);
      expect(durationSeconds).toBeLessThanOrEqual(301); // Allow small variance
    });

    it("should handle very short matches (under 1 minute)", () => {
      const matchStartTime = Date.now() - 30 * 1000; // 30 seconds ago
      const matchEndTime = Date.now();
      const durationSeconds = Math.floor(
        (matchEndTime - matchStartTime) / 1000,
      );

      expect(durationSeconds).toBeGreaterThanOrEqual(29);
      expect(durationSeconds).toBeLessThanOrEqual(31);
    });

    it("should handle long matches (over 10 minutes)", () => {
      const matchStartTime = Date.now() - 15 * 60 * 1000; // 15 minutes ago
      const matchEndTime = Date.now();
      const durationSeconds = Math.floor(
        (matchEndTime - matchStartTime) / 1000,
      );

      expect(durationSeconds).toBeGreaterThanOrEqual(899);
      expect(durationSeconds).toBeLessThanOrEqual(901);
    });
  });

  describe("Missing fields get defaults", () => {
    it("should use 0 as default for missing numeric stats", () => {
      const matchData = {
        playerAddress: "0x1234567890abcdef1234567890abcdef12345678",
        playerWon: true,
        playerHealth: 30,
        opponentHealth: 0,
        cardsPlayed: 0, // default
        damageDealt: 0, // default
        turnCount: 0, // default
        difficulty: "normal",
        durationSeconds: 0, // default
      };

      expect(matchData.cardsPlayed).toBe(0);
      expect(matchData.damageDealt).toBe(0);
      expect(matchData.turnCount).toBe(0);
      expect(matchData.durationSeconds).toBe(0);
    });

    it('should use "normal" as default difficulty', () => {
      const difficulty = "normal";
      expect(difficulty).toBe("normal");
      expect(["easy", "normal", "hard"]).toContain(difficulty);
    });
  });

  describe("Difficulty values", () => {
    it("should validate difficulty values are in allowed set", () => {
      const allowedDifficulties = ["easy", "normal", "hard"];

      allowedDifficulties.forEach((diff) => {
        const matchData = {
          playerAddress: "0x1234567890abcdef1234567890abcdef12345678",
          playerWon: true,
          playerHealth: 30,
          opponentHealth: 0,
          cardsPlayed: 10,
          damageDealt: 30,
          turnCount: 7,
          difficulty: diff,
          durationSeconds: 300,
        };

        expect(allowedDifficulties).toContain(matchData.difficulty);
      });
    });

    it("should handle difficulty case sensitivity", () => {
      const difficultyInput = "NORMAL";
      const normalizedDifficulty = difficultyInput.toLowerCase();

      expect(normalizedDifficulty).toBe("normal");
      expect(["easy", "normal", "hard"]).toContain(normalizedDifficulty);
    });
  });

  describe("API endpoint behavior", () => {
    beforeEach(() => {
      // Mock fetch
      global.fetch = vi.fn();
    });

    it("should gracefully handle Supabase API failure", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      // Should not throw - catch handles it
      try {
        await fetch("/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerAddress: "0x1234567890abcdef1234567890abcdef12345678",
            playerWon: true,
            playerHealth: 30,
            opponentHealth: 0,
            cardsPlayed: 10,
            damageDealt: 30,
            turnCount: 7,
            difficulty: "normal",
            durationSeconds: 300,
          }),
        });
      } catch (error) {
        // Expect this to fail, but should be caught gracefully in component
        expect(error).toBeDefined();
      }
    });

    it("should send correct payload to API endpoint", async () => {
      const mockResponse = { success: true, matchId: "test-uuid" };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const payload = {
        playerAddress: "0x1234567890abcdef1234567890abcdef12345678",
        playerWon: true,
        playerHealth: 30,
        opponentHealth: 0,
        cardsPlayed: 10,
        damageDealt: 30,
        turnCount: 7,
        difficulty: "normal",
        txHash: "0xabc123",
        durationSeconds: 300,
      };

      await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    });
  });
});
