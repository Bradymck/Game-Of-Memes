import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

const VIBEMARKET_CONTRACTS = [
  "0x20306f3C373A445A0C607Bb0eB5Df15d29952FA4",
  "0x3eA4861190176BcB192764B1496EbEB7e38bC366",
  "0xEa6045410D3024b5Fb22AA531c13A31Dae0a56Ea",
  "0xF14C1dC8Ce5fE65413379F76c43fA1460C31E728",
  "0xc0B02E8e9f56A449CcCDc83AE053B887f2E6eBDd",
  "0xfF18ff973337BCc07d4B5a8Fa741b904014a1172",
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
    return uri.replace("ipfs://", "https://ipfs.io/ipfs/");
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
 * Get OPENED cards using Transfer indexer + on-chain rarity check.
 * Uses public Base RPC (no Alchemy key required).
 */
export async function getOpenedCards(
  ownerAddress: string,
): Promise<OpenedCard[]> {
  console.log("🎴 Indexing opened cards...");

  const client = createPublicClient({
    chain: base,
    transport: http("https://mainnet.base.org"),
  });

  const allCards: OpenedCard[] = [];

  // Get current block to set a reasonable range (public RPCs limit log ranges)
  let currentBlock: bigint;
  try {
    currentBlock = await client.getBlockNumber();
  } catch {
    console.error("Failed to get block number");
    return [];
  }

  // ~30 days of blocks on Base (2s blocks) - covers recent activity
  const fromBlock = currentBlock - 1_300_000n;

  for (const contract of VIBEMARKET_CONTRACTS) {
    try {
      // Get Transfer events within a reasonable block range
      const transfersTo = await client.getLogs({
        address: contract as `0x${string}`,
        event: {
          type: "event",
          name: "Transfer",
          inputs: [
            { indexed: true, name: "from", type: "address" },
            { indexed: true, name: "to", type: "address" },
            { indexed: true, name: "tokenId", type: "uint256" },
          ],
        },
        args: { to: ownerAddress as `0x${string}` },
        fromBlock,
        toBlock: "latest",
      });

      const transfersFrom = await client.getLogs({
        address: contract as `0x${string}`,
        event: {
          type: "event",
          name: "Transfer",
          inputs: [
            { indexed: true, name: "from", type: "address" },
            { indexed: true, name: "to", type: "address" },
            { indexed: true, name: "tokenId", type: "uint256" },
          ],
        },
        args: { from: ownerAddress as `0x${string}` },
        fromBlock,
        toBlock: "latest",
      });

      const received = new Set(
        transfersTo.map((log) => log.args.tokenId!.toString()),
      );
      const sent = new Set(
        transfersFrom.map((log) => log.args.tokenId!.toString()),
      );
      const owned: string[] = [];
      received.forEach((tokenId) => {
        if (!sent.has(tokenId)) owned.push(tokenId);
      });

      console.log(
        `📦 ${contract.slice(0, 8)}...: ${owned.length} owned, checking rarity...`,
      );

      // Check rarity - only include rarity 1-5 (opened cards)
      for (const tokenId of owned) {
        try {
          const [rarity] = await client.readContract({
            address: contract as `0x${string}`,
            abi: PACK_ABI,
            functionName: "getTokenRarity",
            args: [BigInt(tokenId)],
          });

          if (Number(rarity) >= 1 && Number(rarity) <= 5) {
            // Fetch metadata from on-chain tokenURI
            let name = `Card #${tokenId}`;
            let image = "/placeholder.jpg";

            try {
              const tokenUri = await client.readContract({
                address: contract as `0x${string}`,
                abi: PACK_ABI,
                functionName: "tokenURI",
                args: [BigInt(tokenId)],
              });

              const httpUri = ipfsToHttp(tokenUri);
              const metaResponse = await fetch(httpUri);
              const metaData = await metaResponse.json();
              name = metaData.name || name;
              image = ipfsToHttp(metaData.image || metaData.imageUrl || image);
            } catch {
              // Metadata fetch failed, use defaults
            }

            allCards.push({
              id: `${contract}-${tokenId}`,
              tokenId,
              contractAddress: contract,
              name,
              image,
              rarity: Number(rarity),
            });
          }
        } catch {
          // Skip
        }
      }
    } catch (error) {
      console.error(`Error for ${contract.slice(0, 8)}...:`, error);
    }
  }

  console.log(`✅ Found ${allCards.length} opened cards`);
  return allCards;
}
