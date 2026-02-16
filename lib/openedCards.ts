import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

const VIBEMARKET_CONTRACTS = [
  '0x20306f3C373A445A0C607Bb0eB5Df15d29952FA4',
  '0x3eA4861190176BcB192764B1496EbEB7e38bC366',
  '0xEa6045410D3024b5Fb22AA531c13A31Dae0a56Ea',
  '0xF14C1dC8Ce5fE65413379F76c43fA1460C31E728',
  '0xc0B02E8e9f56A449CcCDc83AE053B887f2E6eBDd',
  '0xfF18ff973337BCc07d4B5a8Fa741b904014a1172',
];

const PACK_ABI = [
  {
    name: "getTokenRarity",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "rarity", type: "uint8" },
      { name: "randomValue", type: "uint256" },
    ],
  },
  {
    name: "tokenURI",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

function ipfsToHttp(uri: string): string {
  if (uri.startsWith("ipfs://")) {
    return uri.replace("ipfs://", "https://nftstorage.link/ipfs/");
  }
  return uri;
}

export interface OpenedCard {
  id: string;
  tokenId: string;
  contractAddress: string;
  name: string;
  image: string;
  rarity: number;
}

/**
 * Get OPENED cards using Transfer indexer + on-chain rarity check
 */
export async function getOpenedCards(ownerAddress: string): Promise<OpenedCard[]> {
  console.log('🎴 Indexing opened cards...');

  const client = createPublicClient({
    chain: base,
    transport: http("https://mainnet.base.org"),
  });

  const allCards: OpenedCard[] = [];

  for (const contract of VIBEMARKET_CONTRACTS) {
    try {
      // Get Transfer events
      const transfersTo = await client.getLogs({
        address: contract as `0x${string}`,
        event: { type: 'event', name: 'Transfer', inputs: [
          { indexed: true, name: 'from', type: 'address' },
          { indexed: true, name: 'to', type: 'address' },
          { indexed: true, name: 'tokenId', type: 'uint256' }
        ]},
        args: { to: ownerAddress as `0x${string}` },
        fromBlock: 'earliest',
        toBlock: 'latest',
      });

      const transfersFrom = await client.getLogs({
        address: contract as `0x${string}`,
        event: { type: 'event', name: 'Transfer', inputs: [
          { indexed: true, name: 'from', type: 'address' },
          { indexed: true, name: 'to', type: 'address' },
          { indexed: true, name: 'tokenId', type: 'uint256' }
        ]},
        args: { from: ownerAddress as `0x${string}` },
        fromBlock: 'earliest',
        toBlock: 'latest',
      });

      const received = new Set(transfersTo.map(log => log.args.tokenId!.toString()));
      const sent = new Set(transfersFrom.map(log => log.args.tokenId!.toString()));
      const owned: string[] = [];
      received.forEach(tokenId => {
        if (!sent.has(tokenId)) owned.push(tokenId);
      });

      console.log(`📦 ${contract}: ${owned.length} owned, checking rarity...`);

      // Check rarity - only include rarity 1-5 (opened cards)
      for (const tokenId of owned) {
        try {
          const [rarity] = await client.readContract({
            address: contract as `0x${string}`,
            abi: PACK_ABI,
            functionName: 'getTokenRarity',
            args: [BigInt(tokenId)],
          });

          if (Number(rarity) >= 1 && Number(rarity) <= 5) {
            // Fetch metadata
            const metaUrl = `https://base-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_KEY}/getNFTMetadata?contractAddress=${contract}&tokenId=${tokenId}`;
            const metaResponse = await fetch(metaUrl);
            const metaData = await metaResponse.json();

            allCards.push({
              id: `${contract}-${tokenId}`,
              tokenId,
              contractAddress: contract,
              name: metaData.name || `Card #${tokenId}`,
              image: metaData.image?.cachedUrl || metaData.image?.originalUrl || '/placeholder.jpg',
              rarity: Number(rarity),
            });
          }
        } catch {
          // Skip
        }
      }
    } catch (error) {
      console.error(`Error for ${contract}:`, error);
    }
  }

  console.log(
    `✅ Found ${allCards.length} opened cards across ${VIBEMARKET_CONTRACTS.length} VibeMarket contracts`
  );
  return allCards;
}
