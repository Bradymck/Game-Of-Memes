"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PackOpeningCeremony } from "@/components/pack-opening";

interface Batch {
  contractAddress: string;
  tokenIds: string[];
  name: string;
  image: string;
}

interface DraftOpeningFlowProps {
  initialPackId: string;
}

export function DraftOpeningFlow({ initialPackId }: DraftOpeningFlowProps) {
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [showNextPrompt, setShowNextPrompt] = useState(false);

  // Load batches from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("draftBatches");
      if (stored) {
        const parsed: Batch[] = JSON.parse(stored);
        setBatches(parsed);
      }
    } catch {
      // No batches stored — single pack mode
    }
  }, []);

  const currentBatch = batches[currentBatchIndex];
  const hasMoreBatches = currentBatchIndex < batches.length - 1;
  const packId = currentBatch
    ? `${currentBatch.contractAddress}-${currentBatch.tokenIds.join(",")}`
    : initialPackId;
  const packName = currentBatch?.name || `Pack #${initialPackId}`;
  const packImage = currentBatch?.image;

  // Cache pack image for game board card backs
  useEffect(() => {
    if (packImage) {
      localStorage.setItem("gom:playerPackImage", packImage);
    }
  }, [packImage]);

  const handleBatchComplete = useCallback(() => {
    if (hasMoreBatches) {
      setShowNextPrompt(true);
    } else {
      // All done — clean up and go back to draft
      sessionStorage.removeItem("draftBatches");
      router.push("/draft");
    }
  }, [hasMoreBatches, router]);

  const handleOpenNext = useCallback(() => {
    setShowNextPrompt(false);
    setCurrentBatchIndex((prev) => prev + 1);
  }, []);

  // Show "Open Next Pack" prompt between batches
  if (showNextPrompt && hasMoreBatches) {
    const nextBatch = batches[currentBatchIndex + 1];
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-white mb-4">Pack Complete!</h1>
          <p className="text-gray-400 mb-2">
            {currentBatchIndex + 1} of {batches.length} pack types opened
          </p>
          <p className="text-amber-400 font-bold text-lg mb-8">
            Next up: {nextBatch.name}
          </p>

          {/* Next pack preview */}
          {nextBatch.image && (
            <div className="w-40 h-56 mx-auto mb-8 rounded-xl overflow-hidden border-2 border-amber-500 shadow-lg shadow-amber-500/20">
              <img
                src={nextBatch.image}
                alt={nextBatch.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <button
            onClick={handleOpenNext}
            className="px-8 py-4 text-xl font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-xl shadow-lg shadow-amber-600/30 transition-all hover:scale-105 active:scale-95"
          >
            Open Next Pack
          </button>
        </div>
      </div>
    );
  }

  return (
    <PackOpeningCeremony
      key={packId}
      packId={packId}
      packName={packName}
      packImage={packImage}
      onBatchComplete={hasMoreBatches ? handleBatchComplete : undefined}
    />
  );
}
