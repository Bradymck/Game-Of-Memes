"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import type { MemeCardData } from "@/lib/game-context";

export function useVibeMarketCards() {
  const { authenticated, user } = usePrivy();
  const [cards, setCards] = useState<MemeCardData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authenticated || !user?.wallet?.address) {
      setCards([]);
      return;
    }

    setLoading(true);
    console.log("Fetching VibeMarket cards for:", user.wallet.address);

    fetch(`/api/cards?owner=${user.wallet.address}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          throw new Error(data.error);
        }

        const apiCards = data.cards || [];
        console.log("Fetched cards from API:", apiCards.length);

        const rarityStats = {
          common: { attack: 2, health: 2, mana: 2 },
          rare: { attack: 3, health: 3, mana: 3 },
          epic: { attack: 4, health: 5, mana: 4 },
          legendary: { attack: 6, health: 6, mana: 5 },
        };

        const gameCards: MemeCardData[] = apiCards.map((card: any) => {
          const rarity = card.rarity || "common";
          const stats =
            rarityStats[rarity as keyof typeof rarityStats] ||
            rarityStats.common;

          return {
            id: card.id,
            name: card.name,
            image: card.image,
            ticker: card.ticker || `#${card.tokenId}`,
            rarity: rarity as "common" | "rare" | "epic" | "legendary",
            ...stats,
            canAttack: false,
          };
        });

        setCards(gameCards);
      })
      .catch((error) => {
        console.error("Failed to load cards:", error);
        setCards([]);
      })
      .finally(() => setLoading(false));
  }, [authenticated, user?.wallet?.address]);

  return { cards, loading };
}
