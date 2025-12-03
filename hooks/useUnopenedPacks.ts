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

  const walletAddress = user?.wallet?.address

  // Group by contract
  const collections = useMemo(() => {
    const grouped = new Map<string, UnopenedPack[]>()

    packs.forEach(pack => {
      if (!grouped.has(pack.contractAddress)) {
        grouped.set(pack.contractAddress, [])
      }
      grouped.get(pack.contractAddress)!.push(pack)
    })

    const result: PackCollection[] = []
    grouped.forEach((packs, contract) => {
      const name = packs[0]?.name.replace(/#\d+$/, '').trim() || 'Unknown'
      result.push({
        contractAddress: contract,
        name,
        image: packs[0]?.image || '/placeholder.jpg',
        packs,
        count: packs.length,
      })
    })

    return result
  }, [packs])

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
