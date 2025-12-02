'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { getSoulBalance, getPlayerStats } from '@/lib/soulContract';

export function useSouls() {
  const { authenticated, user } = usePrivy();
  const [souls, setSouls] = useState<number>(0);
  const [stats, setStats] = useState<{
    souls: number;
    matches: number;
    wins: number;
    losses: number;
    winRate: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authenticated || !user?.wallet?.address) {
      setSouls(0);
      setStats(null);
      return;
    }

    setLoading(true);
    getSoulBalance(user.wallet.address)
      .then((balance) => {
        setSouls(Number(balance));
      })
      .catch((error) => {
        console.error('Failed to load soul balance:', error);
        setSouls(0);
      })
      .finally(() => setLoading(false));
  }, [authenticated, user?.wallet?.address]);

  const refreshStats = async () => {
    if (!user?.wallet?.address) return;

    setLoading(true);
    try {
      const playerStats = await getPlayerStats(user.wallet.address);
      setStats(playerStats);
      setSouls(playerStats.souls);
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    souls,
    stats,
    loading,
    refreshStats,
  };
}
