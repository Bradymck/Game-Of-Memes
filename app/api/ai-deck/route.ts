import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { VIBEMARKET_CONTRACTS } from "@/lib/vibemarket-contracts";
import { getPackTokenAddress, getPackInfo } from "@/lib/vibemarket";
import { fetchTokenMarketData } from "@/lib/tokenPriceAPI";
import { calculateCardStats } from "@/lib/marketStats";

// Dynamic contract registry — seeds from hardcoded list, grows as players join
const knownContracts = new Set(
  VIBEMARKET_CONTRACTS.map((c) => c.toLowerCase()),
);

export const dynamic = "force-dynamic";

const BASE_RPC = "https://mainnet.base.org";

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
    outputs: [{ type: "string" }],
  },
] as const;

function ipfsToHttp(uri: string): string {
  if (uri.startsWith("ipfs://")) {
    return uri.replace("ipfs://", "https://nftstorage.link/ipfs/");
  }
  return uri;
}

// --- Caching ---

interface CollectionInfo {
  contractAddress: string;
  tokenAddress: string | null;
  marketCap: number;
  name: string;
}

interface CachedDeck {
  cards: any[];
  collectionName: string;
  contractAddress: string;
  packImage: string;
  timestamp: number;
}

const RANKING_CACHE_TTL = 60 * 60 * 1000; // 1 hour
let rankedCollections: CollectionInfo[] | null = null;
let rankingTimestamp = 0;

// Per-collection card cache (1 hour)
const deckCache = new Map<string, CachedDeck>();

const rarityMap: Record<number, string> = {
  1: "common",
  2: "rare",
  3: "epic",
  4: "legendary",
  5: "mythic",
};

/**
 * Rank all known VibeMarket collections by market cap.
 * Cached for 1 hour.
 */
async function getRankedCollections(): Promise<CollectionInfo[]> {
  if (rankedCollections && Date.now() - rankingTimestamp < RANKING_CACHE_TTL) {
    return rankedCollections;
  }

  console.log(
    `🏆 Ranking ${knownContracts.size} VibeMarket collections by market cap...`,
  );

  const results: CollectionInfo[] = [];

  for (const contract of knownContracts) {
    try {
      const tokenAddress = await getPackTokenAddress(contract);
      if (!tokenAddress) {
        console.log(`  ❌ ${contract.slice(0, 10)}... no token address`);
        continue;
      }

      const marketData = await fetchTokenMarketData(tokenAddress);
      const marketCap = marketData?.marketCap || 0;

      results.push({
        contractAddress: contract,
        tokenAddress,
        marketCap,
        name: "", // Will be filled from card metadata
      });

      console.log(
        `  ✅ ${contract.slice(0, 10)}... mcap=$${marketCap.toLocaleString()}`,
      );
    } catch (e: any) {
      console.error(`  ❌ ${contract.slice(0, 10)}... error:`, e.message);
    }
  }

  // Sort by market cap descending, take top 10
  results.sort((a, b) => b.marketCap - a.marketCap);
  rankedCollections = results.slice(0, 10);
  rankingTimestamp = Date.now();

  console.log(`🏆 Ranked ${rankedCollections.length} collections`);

  return rankedCollections;
}

/**
 * Fetch opened cards from a collection by sampling tokenIds 1-50.
 * Returns card data with on-chain metadata.
 */
async function fetchCollectionCards(
  contractAddress: string,
): Promise<{ cards: any[]; collectionName: string; packImage: string }> {
  // Check cache
  const cached = deckCache.get(contractAddress);
  if (cached && Date.now() - cached.timestamp < RANKING_CACHE_TTL) {
    return {
      cards: cached.cards,
      collectionName: cached.collectionName,
      packImage: cached.packImage,
    };
  }

  const client = createPublicClient({
    chain: base,
    transport: http(BASE_RPC),
  });

  // Step 1: Check rarity for tokenIds 1-50 via multicall
  const tokenIds = Array.from({ length: 50 }, (_, i) => i + 1);
  const rarityCalls = tokenIds.map((id) => ({
    address: contractAddress as `0x${string}`,
    abi: PACK_ABI,
    functionName: "getTokenRarity" as const,
    args: [BigInt(id)],
  }));

  console.log(
    `🔍 Sampling 50 tokenIds from ${contractAddress.slice(0, 10)}...`,
  );
  const rarityResults = await client.multicall({
    contracts: rarityCalls,
    allowFailure: true,
  });

  // Find opened cards (rarity > 0) and one unopened (rarity = 0) for pack cover
  const openedTokens: { id: number; rarity: number }[] = [];
  let unopenedTokenId: number | null = null;
  for (let i = 0; i < tokenIds.length; i++) {
    const result = rarityResults[i];
    if (result.status === "success") {
      const rarity = Number((result.result as [number, bigint])[0]);
      if (rarity > 0) {
        openedTokens.push({ id: tokenIds[i], rarity });
      } else if (unopenedTokenId === null) {
        unopenedTokenId = tokenIds[i];
      }
    }
  }

  console.log(
    `📦 Found ${openedTokens.length} opened cards in ${contractAddress.slice(0, 10)}...`,
  );

  if (openedTokens.length === 0) {
    return { cards: [], collectionName: "Unknown", packImage: "" };
  }

  // Fetch pack cover image from an unopened token's tokenURI
  let packImage = "";
  if (unopenedTokenId !== null) {
    try {
      const packUri = await client.readContract({
        address: contractAddress as `0x${string}`,
        abi: PACK_ABI,
        functionName: "tokenURI",
        args: [BigInt(unopenedTokenId)],
      });
      const httpUri = ipfsToHttp(packUri as string);
      const metaResp = await fetch(httpUri, { cache: "no-store" });
      if (metaResp.ok) {
        const meta = await metaResp.json();
        packImage = ipfsToHttp(meta.image || meta.imageUrl || "");
        console.log(
          `🎨 Pack cover from token #${unopenedTokenId}: ${packImage.slice(0, 60)}...`,
        );
      }
    } catch {
      console.log(
        `⚠️ Could not fetch pack cover from token #${unopenedTokenId}`,
      );
    }
  }

  // Fallback: try Wield API for pack cover image
  if (!packImage) {
    try {
      const packInfo = await getPackInfo(contractAddress);
      const ci = packInfo?.contractInfo;
      packImage = ci?.packImage || ci?.imageUrl || ci?.featuredImageUrl || "";
      if (packImage) {
        console.log(
          `🎨 Pack cover from Wield API: ${packImage.slice(0, 60)}...`,
        );
      }
    } catch {
      // Wield API may be rate-limited, continue without pack image
    }
  }

  // Step 2: Fetch tokenURI for opened cards via multicall
  const uriCalls = openedTokens.map((t) => ({
    address: contractAddress as `0x${string}`,
    abi: PACK_ABI,
    functionName: "tokenURI" as const,
    args: [BigInt(t.id)],
  }));

  const uriResults = await client.multicall({
    contracts: uriCalls,
    allowFailure: true,
  });

  // Step 3: Fetch metadata from each tokenURI
  const cards: any[] = [];
  let collectionName = "Unknown";

  const metaPromises = uriResults.map(async (result, idx) => {
    if (result.status !== "success") return;
    try {
      const tokenUri = result.result as string;
      const httpUri = ipfsToHttp(tokenUri);
      const metaResp = await fetch(httpUri, { cache: "no-store" });
      if (!metaResp.ok) return;

      const meta = await metaResp.json();
      const image = ipfsToHttp(meta.image || meta.imageUrl || "");
      if (!image || image === "/placeholder.jpg") return;

      // Extract collection name from first card
      if (collectionName === "Unknown" && meta.name) {
        collectionName = meta.name.replace(/#\d+$/, "").trim();
      }

      const ticker =
        meta.attributes?.find((a: any) => a.trait_type === "Ticker")?.value ||
        "";

      cards.push({
        id: `${contractAddress}-${openedTokens[idx].id}`,
        tokenId: String(openedTokens[idx].id),
        contractAddress,
        name: meta.name || `Card #${openedTokens[idx].id}`,
        image,
        rarity: rarityMap[openedTokens[idx].rarity] || "common",
        ticker,
        onChainRarity: openedTokens[idx].rarity,
      });
    } catch {
      // Skip failed metadata
    }
  });

  await Promise.all(metaPromises);

  console.log(
    `🎨 Got metadata for ${cards.length} cards from "${collectionName}"`,
  );

  // Cache the result
  deckCache.set(contractAddress, {
    cards,
    collectionName,
    contractAddress,
    packImage,
    timestamp: Date.now(),
  });

  return { cards, collectionName, packImage };
}

/**
 * GET /api/ai-deck
 *
 * Returns a 25-card AI deck from a randomly selected top VibeMarket collection.
 * Falls back to random collection if Wield API ranking fails.
 */
export async function GET(request: NextRequest) {
  try {
    // Parse exclude param (player's contract to avoid)
    const { searchParams } = new URL(request.url);
    const excludeContract = searchParams.get("exclude")?.toLowerCase() || "";

    // Auto-register: if the player's contract isn't in our set, add it
    if (excludeContract && !knownContracts.has(excludeContract)) {
      knownContracts.add(excludeContract);
      // Invalidate ranking cache so the new contract gets ranked
      rankedCollections = null;
      rankingTimestamp = 0;
      console.log(
        `🆕 Auto-registered new contract: ${excludeContract.slice(0, 10)}... (${knownContracts.size} total)`,
      );
    }

    // Step 1: Try to get ranked collections (may fail if Wield API is down)
    let collections: CollectionInfo[] = [];
    try {
      collections = await getRankedCollections();
    } catch (e: any) {
      console.log(`⚠️ Ranking failed (${e.message}), using random fallback`);
    }

    // Step 2: Pick a collection — ranked if available, random otherwise
    // Filter out the player's collection
    let pickContract: string;
    let pickTokenAddress: string | null = null;

    if (collections.length > 0) {
      const eligible = excludeContract
        ? collections.filter(
            (c) => c.contractAddress.toLowerCase() !== excludeContract,
          )
        : collections;
      const pool = eligible.length > 0 ? eligible : collections; // fallback if all excluded
      const pick = pool[Math.floor(Math.random() * pool.length)];
      pickContract = pick.contractAddress;
      pickTokenAddress = pick.tokenAddress;
    } else {
      // Fallback: pick a random contract from known set, excluding player's
      const allContracts = [...knownContracts];
      const eligible = excludeContract
        ? allContracts.filter((c) => c !== excludeContract)
        : allContracts;
      const pool = eligible.length > 0 ? eligible : allContracts;
      pickContract = pool[Math.floor(Math.random() * pool.length)];
      console.log(`🎲 Random fallback: ${pickContract.slice(0, 10)}...`);
    }

    // Step 3: Get cards from that collection (on-chain, no Wield needed)
    const { cards, collectionName, packImage } =
      await fetchCollectionCards(pickContract);

    if (cards.length === 0) {
      // Try other collections until we find one with cards (skip excluded if possible)
      const candidates =
        collections.length > 0
          ? collections.map((c) => c.contractAddress)
          : [...knownContracts];

      // Sort: try non-excluded contracts first
      const sorted = [...candidates].sort((a, b) => {
        const aExcluded = a.toLowerCase() === excludeContract ? 1 : 0;
        const bExcluded = b.toLowerCase() === excludeContract ? 1 : 0;
        return aExcluded - bExcluded;
      });

      for (const contract of sorted) {
        if (contract === pickContract) continue;
        const fb = await fetchCollectionCards(contract);
        if (fb.cards.length > 0) {
          const tokenAddr =
            collections.find((c) => c.contractAddress === contract)
              ?.tokenAddress || null;
          return buildDeckResponse(
            fb.cards,
            fb.collectionName,
            contract,
            tokenAddr,
            fb.packImage,
          );
        }
      }
      return NextResponse.json(
        { error: "No opened cards found in any collection" },
        { status: 503 },
      );
    }

    return buildDeckResponse(
      cards,
      collectionName,
      pickContract,
      pickTokenAddress,
      packImage,
    );
  } catch (error: any) {
    console.error("AI deck error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function buildDeckResponse(
  cards: any[],
  collectionName: string,
  contractAddress: string,
  tokenAddress: string | null,
  packImage: string,
) {
  // Enrich with market stats
  let marketData = null;
  if (tokenAddress) {
    marketData = await fetchTokenMarketData(tokenAddress);
  }

  const enrichedCards = cards.map((card) => {
    if (marketData) {
      const stats = calculateCardStats(marketData);
      return {
        ...card,
        attack: stats.attack,
        health: stats.health,
        mana: stats.mana,
        rarity: stats.rarity,
      };
    }

    // Fallback: rarity-based stats
    const rarityStats: Record<
      string,
      { attack: number; health: number; mana: number }
    > = {
      common: { attack: 2, health: 2, mana: 2 },
      rare: { attack: 3, health: 3, mana: 3 },
      epic: { attack: 4, health: 5, mana: 4 },
      legendary: { attack: 6, health: 6, mana: 5 },
    };
    const stats = rarityStats[card.rarity] || rarityStats.common;
    return { ...card, ...stats };
  });

  // Pad to 25 cards if needed (duplicate with unique IDs)
  let deck = [...enrichedCards];
  let dupIdx = 0;
  while (deck.length < 25) {
    const source = enrichedCards[dupIdx % enrichedCards.length];
    deck.push({ ...source, id: `${source.id}-ai-${dupIdx}` });
    dupIdx++;
  }

  // Trim to exactly 25
  deck = deck.slice(0, 25);

  console.log(
    `✅ AI deck: ${deck.length} cards from "${collectionName}" (${contractAddress.slice(0, 10)}...)`,
  );

  return NextResponse.json({
    cards: deck,
    collectionName,
    contractAddress,
    packImage,
  });
}
