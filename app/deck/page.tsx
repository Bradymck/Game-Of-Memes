'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useOpenedCards } from '@/hooks/useOpenedCards'
import { Button } from '@/components/ui/button'

const DECK_SIZE = 30

export default function DeckBuilderPage() {
  const router = useRouter()
  const { authenticated, login } = usePrivy()
  const { cards, loading, error } = useOpenedCards()
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set())

  const toggleCard = (cardId: string) => {
    const newSelected = new Set(selectedCards)
    if (newSelected.has(cardId)) {
      newSelected.delete(cardId)
    } else if (newSelected.size < DECK_SIZE) {
      newSelected.add(cardId)
    }
    setSelectedCards(newSelected)
  }

  const handleStartMatch = () => {
    if (selectedCards.size >= DECK_SIZE) {
      const deckList = Array.from(selectedCards).join(',')
      router.push(`/?deck=${deckList}`)
    }
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Deck Builder</h1>
          <p className="text-gray-400 mb-6">Connect wallet to build your deck</p>
          <Button onClick={login} className="bg-amber-600 hover:bg-amber-500">
            Connect Wallet
          </Button>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🎴</div>
          <p className="text-white">Loading your cards...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => router.push('/')}>Back to Game</Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Deck Builder</h1>
          <p className="text-gray-400">
            Select {DECK_SIZE} cards • {selectedCards.size}/{DECK_SIZE} selected
          </p>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {cards.map(card => (
            <button
              key={card.id}
              onClick={() => toggleCard(card.id)}
              className={`relative aspect-[2/3] rounded-lg overflow-hidden transition-all ${
                selectedCards.has(card.id)
                  ? 'ring-4 ring-amber-500 scale-105'
                  : 'hover:scale-105 opacity-70'
              }`}
            >
              <img
                src={card.image}
                alt={card.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="text-white text-xs font-bold truncate">{card.name}</p>
                <p className="text-amber-400 text-xs">Rarity {card.rarity}</p>
              </div>
              {selectedCards.has(card.id) && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-black font-bold text-sm">
                  ✓
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="text-white">
              <span className="text-2xl font-bold text-amber-400">{selectedCards.size}</span>
              <span className="text-gray-400">/{DECK_SIZE} cards</span>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={() => setSelectedCards(new Set())}
                variant="outline"
                className="border-slate-600"
              >
                Clear
              </Button>
              <Button
                onClick={handleStartMatch}
                disabled={selectedCards.size < DECK_SIZE}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50"
              >
                {selectedCards.size < DECK_SIZE
                  ? `Need ${DECK_SIZE - selectedCards.size} more`
                  : 'Start Match →'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
