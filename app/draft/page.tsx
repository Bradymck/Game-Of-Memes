"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import {
  useUnopenedPacks,
  type PackCollection,
} from "@/hooks/useUnopenedPacks";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/wallet-button";

const MAX_PACKS = 60;

export default function DraftIndexPage() {
  const router = useRouter();
  const { authenticated, login } = usePrivy();
  const { packs, collections, loading, error, refetch } = useUnopenedPacks();

  const [selectedCollection, setSelectedCollection] =
    useState<PackCollection | null>(null);
  const [count, setCount] = useState(0);

  // Auto-select first collection when loaded
  useEffect(() => {
    if (collections.length > 0 && !selectedCollection) {
      const first = collections[0];
      setSelectedCollection(first);
      setCount(Math.min(first.count, MAX_PACKS));
    }
  }, [collections]);

  const handleStartDraft = () => {
    if (!selectedCollection || count === 0) return;

    const tokenIds = selectedCollection.packs
      .slice(0, count)
      .map((p) => p.tokenId);
    const queryParams = new URLSearchParams();
    if (selectedCollection.image)
      queryParams.set("image", selectedCollection.image);
    queryParams.set("name", selectedCollection.name);
    const qs = queryParams.toString();
    router.push(
      `/draft/${selectedCollection.contractAddress}-${tokenIds.join(",")}${qs ? `?${qs}` : ""}`,
    );
  };

  const handleOpenRandom = () => {
    const randomId = Math.floor(Math.random() * 100000).toString();
    router.push(`/draft/demo-${randomId}`);
  };

  // Not connected
  if (!authenticated) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🎴</div>
          <h1 className="text-3xl font-bold text-white mb-4">Pack Opening</h1>
          <p className="text-gray-400 mb-8">
            Connect your wallet to see your unopened packs
          </p>
          <Button
            onClick={login}
            className="px-8 py-4 text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
          >
            Connect Wallet
          </Button>

          <div className="mt-8 pt-8 border-t border-slate-800">
            <p className="text-gray-500 text-sm mb-4">Or try a demo</p>
            <Button
              onClick={handleOpenRandom}
              variant="outline"
              className="border-purple-500 text-purple-400 hover:bg-purple-500/20"
            >
              Demo: Open Random Pack
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // Loading
  if (loading) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="animate-spin text-6xl mb-4">🎴</div>
          <p className="text-white text-xl font-bold mb-2">
            Loading your packs...
          </p>
          <p className="text-gray-400 text-sm">
            Scanning wallet for unopened packs
          </p>
          <p className="text-gray-500 text-xs mt-4">
            This may take a moment for wallets with many NFTs...
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <div
              className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      </main>
    );
  }

  // Error
  if (error) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Error Loading Packs
          </h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="border-amber-500 text-amber-400"
          >
            Try Again
          </Button>
        </div>
      </main>
    );
  }

  // No packs
  if (packs.length === 0) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">📦</div>
          <h1 className="text-3xl font-bold text-white mb-4">
            No Unopened Packs
          </h1>
          <p className="text-gray-400 mb-8">
            You don't have any unopened packs in your wallet. Mint some packs on
            Vibe Market to get started!
          </p>
          <a
            href="https://vibe.market"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors"
          >
            Get Packs on Vibe Market →
          </a>

          <div className="mt-8 pt-8 border-t border-slate-800">
            <p className="text-gray-500 text-sm mb-4">Or try a demo</p>
            <Button
              onClick={handleOpenRandom}
              variant="outline"
              className="border-purple-500 text-purple-400 hover:bg-purple-500/20"
            >
              Demo: Open Random Pack
            </Button>
          </div>

          <button
            onClick={() => router.push("/")}
            className="mt-6 text-amber-500 hover:text-amber-400 text-sm underline block mx-auto"
          >
            ← Back to Game
          </button>
        </div>
      </main>
    );
  }

  // Pack selection UI - single collection
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="max-w-sm w-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Open Packs</h1>
            <p className="text-gray-400 text-sm">
              Choose a pack collection to open
            </p>
          </div>
          <WalletButton />
        </div>

        {/* Collection selector */}
        {collections.length > 1 && (
          <select
            value={selectedCollection?.contractAddress || ""}
            onChange={(e) => {
              const col = collections.find(
                (c) => c.contractAddress === e.target.value,
              );
              setSelectedCollection(col || null);
              setCount(col ? Math.min(col.count, MAX_PACKS) : 0);
            }}
            className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 mb-4 border border-slate-600 focus:border-amber-500 focus:outline-none"
          >
            {collections.map((c) => (
              <option key={c.contractAddress} value={c.contractAddress}>
                {c.name} ({c.count} available)
              </option>
            ))}
          </select>
        )}

        {/* Pack preview */}
        {selectedCollection && (
          <div className="rounded-2xl border-2 border-amber-500 bg-slate-900 p-4 mb-6">
            <div className="aspect-[2/3] bg-gradient-to-br from-purple-900 to-slate-900 rounded-lg overflow-hidden mb-4 relative">
              {selectedCollection.image ? (
                <img
                  src={selectedCollection.image}
                  alt={selectedCollection.name}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl">🎴</span>
                </div>
              )}
              <div className="absolute top-2 right-2 bg-amber-500 text-black font-bold px-2 py-1 rounded-full text-sm">
                x{count}
              </div>
            </div>

            <p className="text-white font-bold text-center mb-3">
              {selectedCollection.name}
            </p>

            {/* Count slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Packs to open:</span>
                <span className="text-amber-400 font-bold">{count}</span>
              </div>
              <input
                type="range"
                min={1}
                max={Math.min(selectedCollection.count, MAX_PACKS)}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1</span>
                <span>{Math.min(selectedCollection.count, MAX_PACKS)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Open button */}
        <Button
          onClick={handleStartDraft}
          disabled={!selectedCollection || count === 0}
          className="w-full py-4 text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          Open {count} Pack{count !== 1 ? "s" : ""}
        </Button>

        {/* Footer */}
        <div className="flex justify-between items-center text-sm">
          <Button
            onClick={() => refetch()}
            variant="ghost"
            className="text-gray-400 hover:text-gray-300"
          >
            Refresh
          </Button>
          <Button
            onClick={handleOpenRandom}
            variant="ghost"
            className="text-purple-400 hover:text-purple-300"
          >
            Demo Pack
          </Button>
          <button
            onClick={() => router.push("/")}
            className="text-amber-500 hover:text-amber-400 underline"
          >
            Back
          </button>
        </div>
      </div>
    </main>
  );
}
