"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { MessageCircle, Users, X } from "lucide-react"

interface Friend {
  id: string
  name: string
  avatar?: string
  status: "online" | "offline" | "in-game"
}

export function ChatMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"chat" | "friends">("friends")

  // Mock friends data - replace with real data later
  const friends: Friend[] = [
    { id: "1", name: "PepeMaster", status: "online" },
    { id: "2", name: "DogeKing", status: "in-game" },
    { id: "3", name: "WojakWarrior", status: "offline" },
  ]

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
          "w-80 h-96",
          "bg-gradient-to-b from-slate-800 to-slate-900",
          "border-3 border-amber-600",
          "rounded-2xl shadow-2xl",
          "transition-all duration-300",
          "overflow-hidden",
          isOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 to-amber-800 px-4 py-3 border-b-2 border-amber-600">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("friends")}
                className={cn(
                  "px-4 py-2 rounded-lg font-bold text-sm transition-all",
                  activeTab === "friends"
                    ? "bg-amber-900/80 text-amber-100"
                    : "text-amber-300 hover:bg-amber-800/50"
                )}
              >
                <Users className="w-4 h-4 inline mr-1" />
                Friends
              </button>
              <button
                onClick={() => setActiveTab("chat")}
                className={cn(
                  "px-4 py-2 rounded-lg font-bold text-sm transition-all",
                  activeTab === "chat"
                    ? "bg-amber-900/80 text-amber-100"
                    : "text-amber-300 hover:bg-amber-800/50"
                )}
              >
                <MessageCircle className="w-4 h-4 inline mr-1" />
                Chat
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
        <div className="p-4 h-[calc(100%-60px)] overflow-y-auto">
          {activeTab === "friends" ? (
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
          ) : (
            <div className="space-y-3">
              {/* Chat messages */}
              <div className="text-center py-8 text-amber-300/50 text-sm">
                Chat coming soon...
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
