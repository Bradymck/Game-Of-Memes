'use client'

import { useState, useEffect, useMemo } from 'react'
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

export function useUnopenedPacks() {
  const { authenticated, user } = usePrivy()
  const [packs, setPacks] = useState<UnopenedPack[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get the active wallet address
  const walletAddress = user?.wallet?.address

  console.log('📍 Active wallet:', walletAddress)
  console.log('📍 User object:', user)

  // Group by contract
  const collections = useMemo(() => {
    console.log('🔄 useMemo running with packs:', packs.length, packs)
    const grouped = new Map<string, UnopenedPack[]>()

    packs.forEach(pack => {
      console.log('Processing pack:', pack.contractAddress, pack.name)
      if (!grouped.has(pack.contractAddress)) {
        grouped.set(pack.contractAddress, [])
      }
      grouped.get(pack.contractAddress)!.push(pack)
    })

    console.log('Grouped map size:', grouped.size, 'keys:', Array.from(grouped.keys()))

    const result: PackCollection[] = []
    grouped.forEach((collectionPacks, contract) => {
      const name = collectionPacks[0]?.name.replace(/#\d+$/, '').trim() || 'Unknown'
      result.push({
        contractAddress: contract,
        name,
        image: collectionPacks[0]?.image || '/placeholder.jpg',
        packs: collectionPacks,
        count: collectionPacks.length,
      })
    })

    console.log('📦 Collections grouped:', result.map(c => ({ name: c.name, count: c.count, contract: c.contractAddress })))

    return result
  }, [packs])

  const refetch = async () => {
    if (!walletAddress) {
      console.warn('No wallet address found in useUnopenedPacks')
      return
    }

    console.log('🔍 useUnopenedPacks fetching for wallet:', walletAddress)
    console.log('📍 Full user object wallet:', user?.wallet)
    setLoading(true)
    setError(null)

    try {
      const result = await getUnopenedPacksFromBaseScan(walletAddress)
      console.log('📦 useUnopenedPacks received packs:', result.length, result)
      setPacks(result)
    } catch (err: any) {
      console.error('❌ useUnopenedPacks error:', err)
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
