'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useUnopenedPacks, type PackCollection } from '@/hooks/useUnopenedPacks'
import { Button } from '@/components/ui/button'
import { WalletButton } from '@/components/wallet-button'

interface DeckSlot {
  collection: PackCollection | null
  count: number
}

const MIN_PACKS = 25
const MAX_PACKS = 60 // Max deck size

export default function DraftIndexPage() {
  const router = useRouter()
  const { authenticated, login } = usePrivy()
  const { packs, collections, loading, error, refetch } = useUnopenedPacks()
  
  // 3 deck slots for mixing packs
  const [slots, setSlots] = useState<DeckSlot[]>([
    { collection: null, count: MIN_PACKS },
    { collection: null, count: 0 },
    { collection: null, count: 0 },
  ])

  // Auto-select first collection when loaded
  useEffect(() => {
    if (collections.length > 0 && !slots[0].collection) {
      setSlots(prev => [{
        ...prev[0],
        collection: collections[0],
        count: Math.min(collections[0].count, MIN_PACKS)
      }, prev[1], prev[2]])
    }
  }, [collections])

  const updateSlot = (index: number, updates: Partial<DeckSlot>) => {
    setSlots(prev => prev.map((slot, i) => 
      i === index ? { ...slot, ...updates } : slot
    ))
  }

  const getTotalPacks = () => slots.reduce((sum, slot) => sum + (slot.collection ? slot.count : 0), 0)

  const handleStartDraft = () => {
    // Build pack list from slots (grouped by contract)
    const packsByContract = new Map<string, string[]>()
    
    slots.forEach(slot => {
      if (slot.collection && slot.count > 0) {
        const packsToAdd = slot.collection.packs.slice(0, slot.count)
        packsToAdd.forEach(p => {
          if (!packsByContract.has(p.contractAddress)) {
            packsByContract.set(p.contractAddress, [])
          }
          packsByContract.get(p.contractAddress)!.push(p.tokenId)
        })
      }
    })

    if (packsByContract.size === 0) return

    // VibeMarket only allows opening one contract at a time
    // If multiple contracts selected, open the first batch
    // TODO: Add multi-batch flow for opening packs from different contracts
    const [contractAddress, tokenIds] = Array.from(packsByContract.entries())[0]
    
    if (packsByContract.size > 1) {
      console.warn('Multiple pack contracts selected - only opening first batch')
    }
    
    router.push(`/draft/${contractAddress}-${tokenIds.join(',')}`)
  }

  const handleOpenRandom = () => {
    const randomId = Math.floor(Math.random() * 100000).toString()
    router.push(`/draft/demo-${randomId}`)
  }

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
    )
  }

  // Loading
  if (loading) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="animate-spin text-6xl mb-4">🎴</div>
          <p className="text-white text-xl font-bold mb-2">Loading your packs...</p>
          <p className="text-gray-400 text-sm">Scanning wallet for unopened packs</p>
          <p className="text-gray-500 text-xs mt-4">
            This may take a moment for wallets with many NFTs...
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </main>
    )
  }

  // Error
  if (error) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">Error Loading Packs</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button onClick={() => refetch()} variant="outline" className="border-amber-500 text-amber-400">
            Try Again
          </Button>
        </div>
      </main>
    )
  }

  // No packs
  if (packs.length === 0) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">📦</div>
          <h1 className="text-3xl font-bold text-white mb-4">No Unopened Packs</h1>
          <p className="text-gray-400 mb-8">
            You don't have any unopened packs in your wallet. 
            Mint some packs on Vibe Market to get started!
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
            onClick={() => router.push('/')}
            className="mt-6 text-amber-500 hover:text-amber-400 text-sm underline block mx-auto"
          >
            ← Back to Game
          </button>
        </div>
      </main>
    )
  }

  // Deck Builder UI - 3 slots to mix packs
  return (
    <main className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header with Wallet Button */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Build Your Draft Deck
            </h1>
            <p className="text-gray-400">
              Select up to 3 pack collections to mix ({MIN_PACKS}-{MAX_PACKS} packs per slot)
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <WalletButton />
          </div>
        </div>

        {/* 3 Deck Slots */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {slots.map((slot, index) => (
            <div
              key={index}
              className={`rounded-2xl border-2 p-4 transition-all ${
                slot.collection 
                  ? 'border-amber-500 bg-slate-900' 
                  : 'border-slate-700 bg-slate-900/50 border-dashed'
              }`}
            >
              {/* Collection Dropdown */}
              <label className="block text-sm text-gray-400 mb-2">
                Slot {index + 1}
              </label>
              <select
                value={slot.collection?.contractAddress || ''}
                onChange={(e) => {
                  const selected = collections.find(c => c.contractAddress === e.target.value)
                  updateSlot(index, { 
                    collection: selected || null,
                    count: selected ? Math.min(selected.count, MIN_PACKS) : 0
                  })
                }}
                className="w-full bg-slate-800 text-white rounded-lg px-3 py-2 mb-4 border border-slate-600 focus:border-amber-500 focus:outline-none"
              >
                <option value="">-- Select Pack --</option>
                {collections.map(c => (
                  <option key={c.contractAddress} value={c.contractAddress}>
                    {c.name} ({c.count} available)
                  </option>
                ))}
              </select>

              {/* Pack Preview */}
              {slot.collection ? (
                <>
                  <div className="aspect-[2/3] bg-gradient-to-br from-purple-900 to-slate-900 rounded-lg overflow-hidden mb-4 relative">
                    {slot.collection.image ? (
                      <img
                        src={slot.collection.image}
                        alt={slot.collection.name}
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-6xl">🎴</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-amber-500 text-black font-bold px-2 py-1 rounded-full text-sm">
                      ×{slot.count}
                    </div>
                  </div>

                  {/* Count Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Packs to include:</span>
                      <span className="text-amber-400 font-bold">{slot.count}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={Math.min(
                        slot.collection.count,
                        MAX_PACKS - getTotalPacks() + slot.count // Remaining deck space
                      )}
                      value={slot.count}
                      onChange={(e) => updateSlot(index, { count: parseInt(e.target.value) })}
                      className="w-full accent-amber-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0</span>
                      <span>{Math.min(slot.collection.count, MAX_PACKS - getTotalPacks() + slot.count)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="aspect-[2/3] bg-slate-800/50 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500 text-sm">No pack selected</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary & Start */}
        <div className="bg-slate-900 rounded-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-gray-400 text-sm">Deck Size:</p>
              <p className="text-3xl font-bold text-amber-400">
                {getTotalPacks()}<span className="text-gray-500">/{MAX_PACKS}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Min: {MIN_PACKS} • Max: {MAX_PACKS}
              </p>
            </div>
            
            <div className="flex gap-4">
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="border-slate-600 text-gray-400"
              >
                🔄 Refresh
              </Button>
              <Button
                onClick={handleStartDraft}
                disabled={getTotalPacks() < MIN_PACKS}
                className="px-8 py-4 text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {getTotalPacks() < MIN_PACKS 
                  ? `Need ${MIN_PACKS - getTotalPacks()} more packs` 
                  : 'Start Draft →'}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="flex justify-center gap-6 text-sm">
          <Button
            onClick={handleOpenRandom}
            variant="ghost"
            className="text-purple-400 hover:text-purple-300"
          >
            Demo Pack
          </Button>
          <button
            onClick={() => router.push('/')}
            className="text-amber-500 hover:text-amber-400 underline"
          >
            ← Back to Game
          </button>
        </div>
      </div>
    </main>
  )
}
