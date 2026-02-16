"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";

export interface UnopenedPack {
  id: string;
  tokenId: string;
  contractAddress: string;
  name: string;
  image: string;
}

export interface PackCollection {
  contractAddress: string;
  name: string;
  image: string;
  packs: UnopenedPack[];
  count: number;
}

export function useUnopenedPacks() {
  const { authenticated, user } = usePrivy();
  const pathname = usePathname();
  const [packs, setPacks] = useState<UnopenedPack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the active wallet address
  const walletAddress = user?.wallet?.address;

  console.log("📍 Active wallet:", walletAddress);
  console.log("📍 User object:", user);

  // Group by contract
  const collections = useMemo(() => {
    console.log("🔄 useMemo running with packs:", packs.length, packs);
    const grouped = new Map<string, UnopenedPack[]>();

    packs.forEach((pack) => {
      console.log("Processing pack:", pack.contractAddress, pack.name);
      if (!grouped.has(pack.contractAddress)) {
        grouped.set(pack.contractAddress, []);
      }
      grouped.get(pack.contractAddress)!.push(pack);
    });

    console.log(
      "Grouped map size:",
      grouped.size,
      "keys:",
      Array.from(grouped.keys()),
    );

    const result: PackCollection[] = [];
    grouped.forEach((collectionPacks, contract) => {
      const name =
        collectionPacks[0]?.name.replace(/#\d+$/, "").trim() || "Unknown";
      result.push({
        contractAddress: contract,
        name,
        image: collectionPacks[0]?.image || "/placeholder.jpg",
        packs: collectionPacks,
        count: collectionPacks.length,
      });
    });

    console.log(
      "📦 Collections grouped:",
      result.map((c) => ({
        name: c.name,
        count: c.count,
        contract: c.contractAddress,
      })),
    );

    return result;
  }, [packs]);

  const refetch = useCallback(async () => {
    if (!walletAddress) {
      console.warn("No wallet address found in useUnopenedPacks");
      return;
    }

    console.log("🔍 useUnopenedPacks fetching for wallet:", walletAddress);
    console.log("📍 Full user object wallet:", user?.wallet);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/packs?owner=${walletAddress}`);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const result = data.packs || [];
      console.log("📦 useUnopenedPacks received packs:", result.length, result);
      setPacks(result);
    } catch (err: any) {
      console.error("❌ useUnopenedPacks error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [walletAddress, user?.wallet]);

  // Refetch on mount, wallet change, AND navigation (pathname change)
  useEffect(() => {
    if (authenticated && walletAddress) {
      refetch();
    } else {
      setPacks([]);
    }
  }, [authenticated, walletAddress, pathname, refetch]);

  return { packs, collections, loading, error, refetch };
}
