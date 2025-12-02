"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { recordWin, recordLoss } from "@/lib/soulContract"
import { useSouls } from "@/hooks/useSouls"

interface GameOverScreenProps {
  playerWon: boolean
  playerHealth: number
  opponentHealth: number
  cardsPlayed: number
  damageDealt: number
  onPlayAgain: () => void
}

export function GameOverScreen({
  playerWon,
  playerHealth,
  opponentHealth,
  cardsPlayed,
  damageDealt,
  onPlayAgain,
}: GameOverScreenProps) {
  const [recordingResult, setRecordingResult] = useState<'idle' | 'recording' | 'success' | 'error'>('idle');
  const { refreshStats } = useSouls();

  // Record match result on-chain when screen appears
  useEffect(() => {
    async function recordMatchResult() {
      if (recordingResult !== 'idle') return; // Already recorded

      setRecordingResult('recording');
      try {
        if (playerWon) {
          await recordWin();
        } else {
          await recordLoss();
        }
        setRecordingResult('success');
        // Refresh soul balance
        await refreshStats();
      } catch (error) {
        console.error('Failed to record match result:', error);
        setRecordingResult('error');
      }
    }

    recordMatchResult();
  }, [playerWon, recordingResult, refreshStats]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative max-w-lg w-full mx-4">
        {/* Victory/Defeat Banner */}
        <div
          className={cn(
            "relative rounded-t-2xl p-8 text-center border-4",
            playerWon
              ? "bg-gradient-to-b from-amber-500 to-amber-700 border-amber-400"
              : "bg-gradient-to-b from-red-900 to-red-950 border-red-700"
          )}
        >
          <h1 className="text-6xl font-bold text-white drop-shadow-lg mb-2">
            {playerWon ? "VICTORY!" : "DEFEAT"}
          </h1>
          <p className="text-xl text-white/90">
            {playerWon ? "You crushed your opponent!" : "Better luck next time..."}
          </p>
        </div>

        {/* Stats Card */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-4 border-slate-700 rounded-b-2xl p-6">
          <div className="space-y-4">
            {/* Final Health */}
            <div className="flex justify-between items-center text-white">
              <span className="text-lg">Your Health:</span>
              <span className="text-2xl font-bold text-green-400">{playerHealth}</span>
            </div>
            <div className="flex justify-between items-center text-white">
              <span className="text-lg">Opponent Health:</span>
              <span className="text-2xl font-bold text-red-400">{opponentHealth}</span>
            </div>

            <div className="border-t border-slate-700 my-4" />

            {/* Match Stats */}
            <div className="flex justify-between items-center text-white/80">
              <span>Cards Played:</span>
              <span className="font-bold">{cardsPlayed}</span>
            </div>
            <div className="flex justify-between items-center text-white/80">
              <span>Total Damage Dealt:</span>
              <span className="font-bold">{damageDealt}</span>
            </div>

            {/* Soul Reward (for losers) */}
            {!playerWon && (
              <>
                <div className="border-t border-slate-700 my-4" />
                <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-4 text-center">
                  <div className="text-5xl mb-2">👻</div>
                  <p className="text-purple-200 text-sm mb-2">
                    {recordingResult === 'recording' && 'Recording result on-chain...'}
                    {recordingResult === 'success' && 'You earned +1 Soul!'}
                    {recordingResult === 'error' && 'Failed to record (try again)'}
                    {recordingResult === 'idle' && 'Preparing to award soul...'}
                  </p>
                  <p className="text-purple-300/70 text-xs">
                    More lives than a cat, eh? 🐱
                  </p>
                  {recordingResult === 'success' && (
                    <p className="text-purple-400/80 text-xs mt-2 italic">
                      Future voting power unlocked
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Play Again Button */}
            <button
              onClick={onPlayAgain}
              className={cn(
                "w-full py-4 rounded-lg font-bold text-xl transition-all duration-200",
                "shadow-lg hover:shadow-xl hover:scale-105",
                playerWon
                  ? "bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white"
                  : "bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white"
              )}
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}