'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { fetchUserCards, type VibeMarketCard } from '@/lib/vibemarket';
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
    fetchUserCards(user.wallet.address)
      .then((vibeCards) => {
        console.log('Fetched cards:', vibeCards.length);
        // Convert VibeMarket cards to game cards
        const gameCards: MemeCardData[] = vibeCards.map((card, index) => {
          // Extract rarity from attributes
          const rarityAttr = card.metadata.attributes?.find(
            (a) => a.trait_type.toLowerCase() === 'rarity'
          );
          const rarity = (rarityAttr?.value?.toLowerCase() as any) || 'common';

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
            name: card.metadata.name || `Card #${card.tokenId}`,
            image: card.metadata.image || '/placeholder.jpg',
            ticker: `#${card.tokenId}`,
            rarity,
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
