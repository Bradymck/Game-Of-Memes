"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWallets } from "@privy-io/react-auth";
import type { PackOpeningState, PackCard } from "@/lib/pack-opening-types";
import { usePythVRF } from "@/hooks/usePythVRF";
import { VRFWaitingState } from "./VRFWaitingState";
import { CardFlipReveal } from "./CardFlipReveal";
import { PackSummary } from "./PackSummary";

interface PackOpeningCeremonyProps {
  packId: string;
  packName?: string;
  packImage?: string;
  onBatchComplete?: () => void;
}

export function PackOpeningCeremony({
  packId,
  packName = "Mystery Pack",
  packImage,
  onBatchComplete,
}: PackOpeningCeremonyProps) {
  const router = useRouter();
  const { wallets } = useWallets();
  const [state, setState] = useState<PackOpeningState>("LOADING");
  const [cards, setCards] = useState<PackCard[]>([]);
  const [currentRevealIndex, setCurrentRevealIndex] = useState(-1);
  const [revealedCount, setRevealedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const handleVRFConfirmed = useCallback((confirmedCards: PackCard[]) => {
    setCards(confirmedCards);
    setState("READY_TO_REVEAL");
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    console.error("Pack opening error:", errorMessage);
    setError(errorMessage);
    setState("LOADING"); // Reset to show error
  }, []);

  const { status, startPolling } = usePythVRF({
    packId,
    onConfirmed: handleVRFConfirmed,
    onError: handleError,
  });

  // Demo packs don't need wallet
  const isDemo = packId.startsWith("demo-");

  // Start VRF polling when wallet is ready (or immediately for demo packs)
  useEffect(() => {
    // Skip if already started
    if (hasStarted) return;

    // For demo packs, start immediately
    // For real packs, wait for wallet to be available
    if (isDemo || wallets.length > 0) {
      setHasStarted(true);
      setState("VRF_CONFIRMING");
      startPolling();
    }
  }, [wallets.length, isDemo, hasStarted, startPolling]);

  // Handle card flip completion
  const handleCardFlipComplete = useCallback(() => {
    setRevealedCount((prev) => {
      const newCount = prev + 1;
      if (newCount >= cards.length) {
        // All cards revealed
        setTimeout(() => setState("COMPLETE"), 500);
      }
      return newCount;
    });
  }, [cards.length]);

  // Start revealing cards
  const startReveal = useCallback(() => {
    setState("REVEALING");
    setCurrentRevealIndex(0);
  }, []);

  // Auto-advance to next card
  useEffect(() => {
    if (state === "REVEALING" && currentRevealIndex < cards.length - 1) {
      const timer = setTimeout(() => {
        setCurrentRevealIndex((prev) => prev + 1);
      }, 800); // Delay between card reveals
      return () => clearTimeout(timer);
    }
  }, [state, currentRevealIndex, cards.length]);

  // Navigation handlers
  const handlePlayGame = () => {
    // Store drafted cards in sessionStorage so the game can use them immediately
    // instead of waiting for the Wield API to propagate
    if (cards.length > 0) {
      sessionStorage.setItem("draftedCards", JSON.stringify(cards));
    }
    router.push("/");
  };
  const handleShare = async () => {
    // TODO: Implement social sharing with html2canvas
    const shareText = `Just opened a pack in Game of Memes! Got ${cards.filter((c) => c.rarity === "legendary").length} legendary cards! 🎴`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Game of Memes - Pack Opening",
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText + " " + window.location.href);
      alert("Copied to clipboard!");
    }
  };

  // Show error if there is one
  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-900/30 border-2 border-red-500 rounded-2xl p-6 text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">
            ❌ Pack Opening Failed
          </h1>
          <p className="text-gray-300 mb-6 whitespace-pre-wrap">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push("/draft")}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-colors"
            >
              ← Back to Draft
            </button>
            <button
              onClick={() => {
                setError(null);
                setState("VRF_CONFIRMING");
                startPolling();
              }}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold transition-colors"
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render based on state
  switch (state) {
    case "LOADING":
    case "VRF_CONFIRMING":
      return <VRFWaitingState packName={packName} />;

    case "READY_TO_REVEAL":
      return (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Your Cards Are Ready!
            </h1>
            <p className="text-gray-400 mb-8">{cards.length} cards await...</p>
          </div>

          {/* Stacked cards preview */}
          <div className="relative w-40 h-56 mb-8">
            {cards.map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-xl overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)",
                  border: "2px solid #4c1d95",
                  transform: `translateY(${-i * 4}px) rotate(${(i - 2) * 3}deg)`,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                }}
              >
                {packImage ? (
                  <img
                    src={packImage}
                    alt={packName}
                    className="w-full h-full object-cover scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl">🎴</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={startReveal}
            className="px-8 py-4 text-xl font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-xl shadow-lg shadow-amber-600/30 transition-all hover:scale-105 active:scale-95"
          >
            ✨ Reveal Cards ✨
          </button>
        </div>
      );

    case "REVEALING":
      return (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-8">
            Revealing... ({revealedCount}/{cards.length})
          </h1>

          {/* Cards in a fan formation */}
          <div className="flex items-end justify-center gap-2 md:gap-4 flex-wrap">
            {cards.map((card, index) => (
              <CardFlipReveal
                key={card.id}
                card={card}
                index={index}
                isActive={index <= currentRevealIndex}
                onFlipComplete={handleCardFlipComplete}
                packImage={packImage}
              />
            ))}
          </div>

          {/* Skip button */}
          <button
            onClick={() => {
              setCurrentRevealIndex(cards.length - 1);
              setRevealedCount(cards.length);
              setTimeout(() => setState("COMPLETE"), 600);
            }}
            className="mt-8 text-gray-500 hover:text-gray-300 text-sm underline"
          >
            Skip Animation
          </button>
        </div>
      );

    case "COMPLETE":
      return (
        <PackSummary
          packName={packName}
          cards={cards}
          onPlayGame={handlePlayGame}
          onShare={handleShare}
        />
      );

    default:
      return null;
  }
}
