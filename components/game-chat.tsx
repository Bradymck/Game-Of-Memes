"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { getGameHistory } from "@/lib/xmtp"
import { usePrivy } from "@privy-io/react-auth"

export function GameChat() {
  const { user } = usePrivy()
  const [messages, setMessages] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load game history when chat opens
  useEffect(() => {
    async function loadHistory() {
      if (!isOpen || !user?.wallet?.address) return

      setLoading(true)
      try {
        const history = await getGameHistory(user.wallet.address)
        setMessages(history)
      } catch (error) {
        console.error('Failed to load game history:', error)
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [isOpen, user?.wallet?.address])

  return (
    <>
      {/* Chat Toggle Button - Bottom Right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 border-2 border-purple-300 shadow-xl flex items-center justify-center transition-all hover:scale-110"
      >
        <span className="text-2xl">{isOpen ? '✕' : '💬'}</span>
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-96 h-[500px] bg-gradient-to-b from-slate-900 to-slate-950 border-4 border-purple-500/50 rounded-xl shadow-2xl flex flex-col">
          {/* Header */}
          <div className="bg-purple-900/40 border-b border-purple-500/30 px-4 py-3 rounded-t-lg">
            <h3 className="text-purple-200 font-bold">Game History</h3>
            <p className="text-purple-400/70 text-xs">Your matches on XMTP</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading && (
              <div className="text-center text-purple-300/50 py-8">
                Loading history...
              </div>
            )}

            {!loading && messages.length === 0 && (
              <div className="text-center text-purple-300/50 py-8">
                <p className="text-4xl mb-2">🎮</p>
                <p>No games played yet!</p>
                <p className="text-xs mt-2">Play a match to see it logged here</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "p-3 rounded-lg border",
                  msg.result === 'VICTORY'
                    ? "bg-amber-900/20 border-amber-500/30"
                    : "bg-purple-900/20 border-purple-500/30"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "font-bold",
                    msg.result === 'VICTORY' ? "text-amber-400" : "text-purple-300"
                  )}>
                    {msg.result}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-gray-400">
                  <div>Cards Played: {msg.stats?.cardsPlayed}</div>
                  <div>Damage Dealt: {msg.stats?.damageDealt}</div>
                  {msg.soulsEarned > 0 && (
                    <div className="text-purple-400 font-bold">
                      +{msg.soulsEarned} Soul Earned 👻
                    </div>
                  )}
                </div>

                {msg.txHash && (
                  <a
                    href={`https://basescan.org/tx/${msg.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 block mt-2 truncate"
                  >
                    View on BaseScan →
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="bg-purple-900/20 border-t border-purple-500/30 px-4 py-2 rounded-b-lg">
            <p className="text-xs text-purple-400/70 text-center">
              Powered by XMTP • Fully auditable
            </p>
          </div>
        </div>
      )}
    </>
  )
}