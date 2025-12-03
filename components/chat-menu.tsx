"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { MessageCircle, Users, X, Send } from "lucide-react"
import { getGameHistory } from "@/lib/xmtp"
import { usePrivy } from "@privy-io/react-auth"

interface Friend {
  id: string
  name: string
  avatar?: string
  status: "online" | "offline" | "in-game"
}

export function ChatMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"chat" | "friends" | "log">("log") // Default to log tab
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const { user } = usePrivy()

  // Mock friends data - for future PVP
  const friends: Friend[] = []

  // Load and poll for messages
  useEffect(() => {
    async function loadHistory() {
      if (!isOpen || !user?.wallet?.address) return
      if (activeTab !== 'chat' && activeTab !== 'log') return

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

    // Poll for new messages every 3 seconds when chat/log is open
    const interval = setInterval(() => {
      if (isOpen && (activeTab === 'chat' || activeTab === 'log')) {
        loadHistory()
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [isOpen, activeTab, user?.wallet?.address])

  // Send chat message
  const sendMessage = async () => {
    if (!chatInput.trim() || !user?.wallet?.address) return

    const message = {
      type: 'chat_message',
      timestamp: Date.now(),
      player: user.wallet.address,
      message: chatInput,
    }

    // Save to localStorage (same as game results)
    try {
      const key = `game_history_${user.wallet.address}`
      const existing = localStorage.getItem(key)
      const history = existing ? JSON.parse(existing) : []
      history.push(message)
      localStorage.setItem(key, JSON.stringify(history))

      // Update UI immediately
      setMessages(history)
      setChatInput("")
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  return (
    <>
      {/* Hearthstone-style Button - Bottom Left */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-8 left-8 z-50",
          "w-16 h-16 rounded-2xl",
          "bg-gradient-to-br from-amber-600 to-amber-800",
          "border-3 border-amber-400",
          "shadow-xl shadow-amber-900/50",
          "flex items-center justify-center",
          "transition-all duration-300 hover:scale-110 active:scale-95",
          "hover:shadow-2xl hover:shadow-amber-500/50",
          isOpen && "ring-4 ring-amber-400/50"
        )}
      >
        <Users className="w-8 h-8 text-white drop-shadow-lg" />
        {/* Online indicator */}
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full shadow-lg">
          <span className="text-[10px] font-bold text-white">3</span>
        </div>
      </button>

      {/* Chat Panel - Slides in from bottom-left */}
      <div
        className={cn(
          "fixed bottom-28 left-8 z-40",
          "w-80 h-[500px]",
          "bg-gradient-to-b from-slate-800 to-slate-900",
          "border-3 border-amber-600",
          "rounded-2xl shadow-2xl",
          "transition-all duration-300",
          "overflow-hidden flex flex-col",
          isOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 to-amber-800 px-4 py-3 border-b-2 border-amber-600 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab("log")}
                className={cn(
                  "px-3 py-2 rounded-lg font-bold text-xs transition-all",
                  activeTab === "log"
                    ? "bg-amber-900/80 text-amber-100"
                    : "text-amber-300 hover:bg-amber-800/50"
                )}
              >
                📜 Log
              </button>
              <button
                onClick={() => setActiveTab("chat")}
                className={cn(
                  "px-3 py-2 rounded-lg font-bold text-xs transition-all",
                  activeTab === "chat"
                    ? "bg-amber-900/80 text-amber-100"
                    : "text-amber-300 hover:bg-amber-800/50"
                )}
              >
                💬 Chat
              </button>
              <button
                onClick={() => setActiveTab("friends")}
                className={cn(
                  "px-3 py-2 rounded-lg font-bold text-xs transition-all",
                  activeTab === "friends"
                    ? "bg-amber-900/80 text-amber-100"
                    : "text-amber-300 hover:bg-amber-800/50"
                )}
              >
                👥 Friends
              </button>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-amber-200 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {activeTab === "log" ? (
            <div className="space-y-2">
              {/* Game Log - All events */}
              {loading && (
                <div className="text-center py-8 text-amber-300/50">
                  Loading game log...
                </div>
              )}

              {!loading && messages.length === 0 && (
                <div className="text-center py-8 text-amber-300/50">
                  <p className="text-4xl mb-2">📜</p>
                  <p className="text-sm">No events logged yet!</p>
                  <p className="text-xs mt-2 text-amber-400/40">
                    Play a match to see the audit trail
                  </p>
                </div>
              )}

              {!loading && messages.map((msg, i) => {
                // Show ALL message types in log
                if (msg.type === 'game_of_memes_result') {
                  return (
                    <div key={i} className={cn(
                      "p-3 rounded-lg border text-sm",
                      msg.result === 'VICTORY'
                        ? "bg-amber-900/20 border-amber-500/30"
                        : "bg-purple-900/20 border-purple-500/30"
                    )}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                          "font-bold text-sm",
                          msg.result === 'VICTORY' ? "text-amber-400" : "text-purple-300"
                        )}>
                          {msg.result === 'VICTORY' ? '🏆 Victory' : '👻 Defeat'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Cards: {msg.stats?.cardsPlayed} • Damage: {msg.stats?.damageDealt}
                        {msg.soulsEarned > 0 && <span className="text-purple-400 font-bold ml-2">+{msg.soulsEarned} Soul</span>}
                      </div>
                      {msg.txHash && (
                        <a
                          href={`https://basescan.org/tx/${msg.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 block mt-1 truncate"
                        >
                          View tx →
                        </a>
                      )}
                    </div>
                  )
                }

                // Game actions
                if (msg.type && ['play_card', 'attack_minion', 'attack_hero', 'end_turn', 'card_draw', 'minion_death'].includes(msg.type)) {
                  const shortActor = msg.actor ? `${msg.actor.slice(0, 6)}...${msg.actor.slice(-4)}` : 'Player';
                  return (
                    <div key={i} className="p-2 rounded bg-slate-700/30 border border-slate-600/50 text-xs">
                      <span className="text-amber-400">{shortActor}:</span>{' '}
                      <span className="text-gray-300">{msg.type.replace(/_/g, ' ')}</span>
                      {msg.data?.cardName && <span className="text-purple-300 ml-1">({msg.data.cardName})</span>}
                      <span className="text-gray-500 ml-2 text-[10px]">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  )
                }

                return null
              })}
            </div>
          ) : activeTab === "friends" ? (
            <div className="space-y-2">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors cursor-pointer border border-slate-600"
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {friend.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    {/* Status indicator */}
                    <div
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-800",
                        friend.status === "online" && "bg-green-500",
                        friend.status === "in-game" && "bg-yellow-500",
                        friend.status === "offline" && "bg-gray-500"
                      )}
                    />
                  </div>

                  {/* Name & Status */}
                  <div className="flex-1">
                    <div className="text-amber-100 font-semibold text-sm">
                      {friend.name}
                    </div>
                    <div className="text-amber-300/60 text-xs capitalize">
                      {friend.status === "in-game" ? "Playing..." : friend.status}
                    </div>
                  </div>

                  {/* Actions */}
                  <button className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors">
                    Challenge
                  </button>
                </div>
              ))}

              {friends.length === 0 && (
                <div className="text-center py-8 text-amber-300/50">
                  No friends online
                </div>
              )}
            </div>
          ) : activeTab === "chat" ? (
            <div className="space-y-3">
              {/* Chat - Only chat_message types */}
              {loading && (
                <div className="text-center py-8 text-amber-300/50">
                  Loading chat...
                </div>
              )}

              {!loading && messages.filter(m => m.type === 'chat_message').length === 0 && (
                <div className="text-center py-8 text-amber-300/50">
                  <p className="text-4xl mb-2">💬</p>
                  <p className="text-sm">No messages yet!</p>
                  <p className="text-xs mt-2 text-amber-400/40">
                    Type below to start chatting
                  </p>
                </div>
              )}

              {!loading && messages.filter(m => m.type === 'chat_message').map((msg, i) => (
                <div key={i} className="p-3 rounded bg-blue-900/20 border border-blue-500/30">
                  <div className="text-xs text-blue-300 font-semibold mb-1">
                    {msg.player?.slice(0, 6)}...{msg.player?.slice(-4)}
                  </div>
                  <div className="text-sm text-white">{msg.message}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Chat Input - Only show in chat tab */}
        {activeTab === "chat" && (
          <div className="flex-shrink-0 p-3 bg-slate-900 border-t-2 border-amber-600">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2 bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg transition-all flex items-center gap-1"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
