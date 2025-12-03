'use client'

import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { getUnopenedPacksFromBaseScan } from '@/lib/basescanIndexer'

export interface UnopenedPack {
  id: string
  tokenId: string
  contractAddress: string
  name: string
  image: string
}

export interface PackCollection {
  contractAddress: string
  name: string
  image: string
  packs: UnopenedPack[]
  count: number
}

export function useBaseScanPacks() {
  const { authenticated, user } = usePrivy()
  const [packs, setPacks] = useState<UnopenedPack[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const walletAddress = user?.wallet?.address

  // Group by contract
  const collections: PackCollection[] = []
  const grouped = new Map<string, UnopenedPack[]>()

  packs.forEach(pack => {
    if (!grouped.has(pack.contractAddress)) {
      grouped.set(pack.contractAddress, [])
    }
    grouped.get(pack.contractAddress)!.push(pack)
  })

  grouped.forEach((packs, contract) => {
    const name = packs[0]?.name.replace(/#\d+$/, '').trim() || 'Unknown'
    collections.push({
      contractAddress: contract,
      name,
      image: packs[0]?.image || '/placeholder.jpg',
      packs,
      count: packs.length,
    })
  })

  const refetch = async () => {
    if (!walletAddress) return

    setLoading(true)
    setError(null)

    try {
      const result = await getUnopenedPacksFromBaseScan(walletAddress)
      setPacks(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authenticated && walletAddress) {
      refetch()
    } else {
      setPacks([])
    }
  }, [authenticated, walletAddress])

  return { packs, collections, loading, error, refetch }
}
