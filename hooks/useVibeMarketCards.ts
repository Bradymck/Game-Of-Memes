'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { getOpenedCards, type OpenedCard } from '@/lib/openedCards';
import type { MemeCardData } from '@/lib/game-context';

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
    console.log('Fetching VibeMarket cards for:', user.wallet.address);
    getOpenedCards(user.wallet.address)
      .then((vibeCards: OpenedCard[]) => {
        console.log('Fetched cards:', vibeCards.length);
        // Convert opened cards to game cards
        const gameCards: MemeCardData[] = vibeCards.map((card: OpenedCard, index: number) => {
          // Map rarity number to rarity string
          const rarityMap: Record<number, string> = {
            1: 'common',
            2: 'rare',
            3: 'epic',
            4: 'legendary',
            5: 'legendary'
          };
          const rarity = rarityMap[card.rarity] || 'common';

          // Basic stats based on rarity for now
          const rarityStats = {
            common: { attack: 2, health: 2, mana: 2 },
            rare: { attack: 3, health: 3, mana: 3 },
            epic: { attack: 4, health: 5, mana: 4 },
            legendary: { attack: 6, health: 6, mana: 5 },
          };

          const stats = rarityStats[rarity as keyof typeof rarityStats] || rarityStats.common;

          return {
            id: `${card.contractAddress}-${card.tokenId}`,
            name: card.name,
            image: card.image,
            ticker: `#${card.tokenId}`,
            rarity: rarity as 'common' | 'rare' | 'epic' | 'legendary',
            ...stats,
            canAttack: false,
          };
        });

        setCards(gameCards);
      })
      .catch((error) => {
        console.error('Failed to load cards:', error);
        setCards([]);
      })
      .finally(() => setLoading(false));
  }, [authenticated, user?.wallet?.address]);

  return { cards, loading };
}
