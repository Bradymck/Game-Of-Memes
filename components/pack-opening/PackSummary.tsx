"use client";

import { useMemo } from "react";
import type { PackCard } from "@/lib/pack-opening-types";
import { RARITY_CONFIG } from "@/lib/pack-opening-types";
import { Button } from "@/components/ui/button";

interface PackSummaryProps {
  packName: string;
  cards: PackCard[];
  onPlayGame: () => void;
  onShare?: () => void;
}

export function PackSummary({
  packName,
  cards,
  onPlayGame,
  onShare,
}: PackSummaryProps) {
  // Calculate pack stats
  const stats = useMemo(() => {
    const rarityCount = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
      mythic: 0,
    };
    let totalAttack = 0;
    let totalHealth = 0;

    cards.forEach((card) => {
      rarityCount[card.rarity]++;
      totalAttack += card.attack;
      totalHealth += card.health;
    });

    const bestCard = cards.reduce((best, card) => {
      const rarityOrder = {
        common: 0,
        rare: 1,
        epic: 2,
        legendary: 3,
        mythic: 4,
      };
      return rarityOrder[card.rarity] > rarityOrder[best.rarity] ? card : best;
    }, cards[0]);

    return { rarityCount, totalAttack, totalHealth, bestCard };
  }, [cards]);

  // Generate rarity grid for sharing (like vibe.market)
  const generateShareText = (platform: "twitter" | "farcaster") => {
    const rarityEmojis: Record<string, string> = {
      common: "⬜",
      rare: "🟦",
      epic: "🟪",
      legendary: "🟨",
      mythic: "🌠",
    };

    const handle = platform === "twitter" ? "@Game_Of_Memes" : "Game of Memes";

    // Break cards into packs of 5 (simulating multiple pack opens)
    const packs: PackCard[][] = [];
    for (let i = 0; i < cards.length; i += 5) {
      packs.push(cards.slice(i, i + 5));
    }

    // Build the share text
    let shareText = `About to throw down on ${handle} 🃏\n\nMy Draft:`;

    // Add each pack with its grid
    packs.forEach((packCards, index) => {
      const grid = packCards
        .map((c) => rarityEmojis[c.rarity] || "⬜")
        .join("");

      // If multiple packs, label them
      if (packs.length > 1) {
        shareText += `\n[${packName} #${index + 1}]\n${grid}`;
      } else {
        shareText += `\n[${packName}]\n${grid}`;
      }
    });

    shareText += `\n\nCheck it out at GOM.GG 🔥`;

    return shareText;
  };

  const handleShare = async (platform: "twitter" | "farcaster" | "copy") => {
    const shareText = generateShareText(
      platform === "copy" ? "farcaster" : platform,
    );

    if (platform === "copy") {
      await navigator.clipboard.writeText(shareText);
      alert("Share text copied to clipboard!");
    } else if (platform === "twitter") {
      const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
      window.open(tweetUrl, "_blank");
    } else if (platform === "farcaster") {
      const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`;
      window.open(warpcastUrl, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center p-4 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Pack Opened!
        </h1>
        <p className="text-gray-400">{packName}</p>
      </div>

      {/* Cards display */}
      <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-8 max-w-4xl">
        {cards.map((card) => {
          const config = RARITY_CONFIG[card.rarity];
          return (
            <div
              key={card.id}
              className="relative w-28 h-36 md:w-36 md:h-48 rounded-xl overflow-hidden"
              style={{
                border: `3px solid ${config.color}`,
                boxShadow: `0 0 24px ${config.glowColor}, inset 0 0 12px ${config.glowColor}`,
              }}
            >
              {card.image ? (
                <img
                  src={card.image}
                  alt={card.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                  <span className="text-2xl">🎴</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stats summary */}
      <div className="bg-slate-900/80 rounded-xl p-4 md:p-6 mb-8 max-w-md w-full">
        <h2 className="text-lg font-bold text-white mb-4 text-center">
          Pack Stats
        </h2>

        {/* Rarity breakdown */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {(["common", "rare", "epic", "legendary", "mythic"] as const).map(
            (rarity) => (
              <div key={rarity} className="text-center">
                <div
                  className="text-2xl font-bold"
                  style={{ color: RARITY_CONFIG[rarity].color }}
                >
                  {stats.rarityCount[rarity]}
                </div>
                <div className="text-xs text-gray-400 capitalize">{rarity}</div>
              </div>
            ),
          )}
        </div>

        {/* Best card highlight */}
        {stats.bestCard && (
          <div className="border-t border-slate-700 pt-4 mt-4">
            <p className="text-sm text-gray-400 text-center mb-2">Best Pull</p>
            <div className="flex items-center justify-center gap-3">
              <div
                className="w-12 h-12 rounded-lg overflow-hidden"
                style={{
                  border: `2px solid ${RARITY_CONFIG[stats.bestCard.rarity].color}`,
                }}
              >
                {stats.bestCard.image ? (
                  <img
                    src={stats.bestCard.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                    🎴
                  </div>
                )}
              </div>
              <div>
                {stats.bestCard.ticker && (
                  <p className="font-bold text-white">
                    {stats.bestCard.ticker}
                  </p>
                )}
                <p
                  className="text-sm font-bold uppercase"
                  style={{ color: RARITY_CONFIG[stats.bestCard.rarity].color }}
                >
                  {stats.bestCard.rarity}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Share buttons */}
      <div className="flex gap-2 mb-4">
        <Button
          onClick={() => handleShare("twitter")}
          variant="outline"
          className="border-blue-500 text-blue-400 hover:bg-blue-500/20"
        >
          𝕏 Share
        </Button>
        <Button
          onClick={() => handleShare("farcaster")}
          variant="outline"
          className="border-purple-500 text-purple-400 hover:bg-purple-500/20"
        >
          🟪 Share
        </Button>
        <Button
          onClick={() => handleShare("copy")}
          variant="outline"
          className="border-gray-500 text-gray-400 hover:bg-gray-500/20"
        >
          📋 Copy
        </Button>
      </div>

      {/* Action button */}
      <div className="w-full max-w-md">
        <Button
          onClick={onPlayGame}
          className="w-full py-4 text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
        >
          ⚔️ Play with These Cards
        </Button>
      </div>
    </div>
  );
}
