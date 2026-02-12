import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { getPackTokenAddress, getPackInfo } from "@/lib/vibemarket";
import { fetchTokenMarketData } from "@/lib/tokenPriceAPI";
import { calculateCardStats } from "@/lib/marketStats";

export const dynamic = "force-dynamic";

const WIELD_API_KEY = process.env.WIELD_API_KEY;
const BASE_RPC = "https://mainnet.base.org";

const PACK_ABI = [
  {
    name: "ownerOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "address" }],
  },
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

/**
 * GET /api/cards?owner={address}
 *
 * Returns ONLY truly opened cards verified on-chain.
 * Filters out unopened packs and cards without proper images.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ownerAddress = searchParams.get("owner");
  const contractFilter = searchParams.get("contract");
  const tokenFilter =
    searchParams
      .get("tokens")
      ?.split(",")
      .map((t) => t.trim()) || [];

  if (!ownerAddress) {
    return NextResponse.json(
      { error: "Missing owner address" },
      { status: 400 },
    );
  }

  if (!WIELD_API_KEY) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 },
    );
  }

  try {
    // Step 1: Get all tokens from Wield API
    const url = `https://build.wield.xyz/vibe/boosterbox/owner/${ownerAddress}?chainId=8453&limit=200`;
    const response = await fetch(url, {
      headers: { "API-KEY": WIELD_API_KEY, Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Wield API error:", response.status, errorText);
      return NextResponse.json(
        { error: `API error: ${response.status}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    const items = data?.boxes || data?.data || [];

    // Will fetch pack cover image via getPackInfo after we know the contract
    let wieldPackImage = "";

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        cards: [],
        revealed: 0,
        total: 0,
        packImage: "",
      });
    }

    // Apply contract/token filters if specified
    const tokenSet = new Set(tokenFilter);
    const matched = items.filter((item: any) => {
      if (
        contractFilter &&
        item.contractAddress?.toLowerCase() !== contractFilter.toLowerCase()
      )
        return false;
      if (tokenSet.size > 0 && !tokenSet.has(String(item.tokenId)))
        return false;
      return true;
    });

    // Step 2: On-chain verification via multicall
    // Only return cards that are TRULY opened (on-chain rarity > 0) and owned
    const client = createPublicClient({
      chain: base,
      transport: http(BASE_RPC),
    });

    const calls = matched.flatMap((item: any) => [
      {
        address: item.contractAddress as `0x${string}`,
        abi: PACK_ABI,
        functionName: "ownerOf" as const,
        args: [BigInt(item.tokenId)],
      },
      {
        address: item.contractAddress as `0x${string}`,
        abi: PACK_ABI,
        functionName: "getTokenRarity" as const,
        args: [BigInt(item.tokenId)],
      },
    ]);

    console.log(
      `🔗 Cards multicall: ${calls.length} calls for ${matched.length} tokens`,
    );
    const results = await client.multicall({
      contracts: calls,
      allowFailure: true,
    });

    // Filter: must be owned AND on-chain rarity > 0 (truly opened)
    const verifiedItems: any[] = [];
    const onChainRarities = new Map<string, number>();

    for (let i = 0; i < matched.length; i++) {
      const ownerResult = results[i * 2];
      const rarityResult = results[i * 2 + 1];

      const isOwned =
        ownerResult.status === "success" &&
        (ownerResult.result as string).toLowerCase() ===
          ownerAddress.toLowerCase();

      // On-chain rarity: > 0 means opened, 0 or revert means unopened
      const onChainRarity =
        rarityResult.status === "success"
          ? Number((rarityResult.result as [number, bigint])[0])
          : 0;

      if (isOwned && onChainRarity > 0) {
        verifiedItems.push(matched[i]);
        onChainRarities.set(String(matched[i].tokenId), onChainRarity);
      }
    }

    console.log(
      `📦 ${verifiedItems.length} verified opened cards of ${matched.length} total`,
    );

    if (verifiedItems.length === 0) {
      return NextResponse.json({ cards: [], revealed: 0, total: 0 });
    }

    // Step 3: Build card data with metadata
    const rarityMap: Record<number, string> = {
      1: "common",
      2: "rare",
      3: "epic",
      4: "legendary",
      5: "mythic",
    };

    // Step 3b: Fetch on-chain tokenURI for ALL verified cards.
    // Wield API returns the pack cover image for all cards — NOT the unique
    // revealed card art. On-chain tokenURI is the only reliable source.
    const uriCalls = verifiedItems.map((item: any) => ({
      address: item.contractAddress as `0x${string}`,
      abi: PACK_ABI,
      functionName: "tokenURI" as const,
      args: [BigInt(item.tokenId)],
    }));

    console.log(
      `🎨 Fetching tokenURI for ${uriCalls.length} cards via multicall`,
    );
    const uriResults = await client.multicall({
      contracts: uriCalls,
      allowFailure: true,
    });

    // Fetch metadata JSON from each tokenURI
    const metadataMap = new Map<
      number,
      { name: string; image: string; ticker: string }
    >();
    const metaPromises = uriResults.map(async (result, idx) => {
      if (result.status !== "success") return;
      try {
        const tokenUri = result.result as string;
        const httpUri = ipfsToHttp(tokenUri);
        const metaResp = await fetch(httpUri, { cache: "no-store" });
        if (metaResp.ok) {
          const meta = await metaResp.json();
          const image = ipfsToHttp(meta.image || meta.imageUrl || "");
          const ticker =
            meta.attributes?.find((a: any) => a.trait_type === "Ticker")
              ?.value || "";
          if (image && image !== "/placeholder.jpg") {
            metadataMap.set(idx, {
              name: meta.name || `Card #${verifiedItems[idx].tokenId}`,
              image,
              ticker,
            });
          }
        }
      } catch {
        // Skip failed metadata fetches
      }
    });

    await Promise.all(metaPromises);

    console.log(
      `🎨 Got on-chain metadata for ${metadataMap.size} of ${verifiedItems.length} cards`,
    );

    // Build card objects using on-chain metadata as primary source
    const cards = verifiedItems
      .map((item: any, idx: number) => {
        const onChainMeta = metadataMap.get(idx);
        const chainRarity = onChainRarities.get(String(item.tokenId)) || 1;

        // On-chain metadata is the source of truth for revealed card art
        const name = onChainMeta?.name || item.name || `Card #${item.tokenId}`;
        const image = onChainMeta?.image || "";
        const ticker = onChainMeta?.ticker || "";

        return {
          id: `${item.contractAddress}-${item.tokenId}`,
          tokenId: String(item.tokenId),
          contractAddress: item.contractAddress,
          name,
          image: image || "/placeholder.jpg",
          rarity: rarityMap[chainRarity] || "common",
          ticker,
        };
      })
      // FINAL FILTER: No ghost cards. Must have on-chain image.
      .filter((card) => card.image && card.image !== "/placeholder.jpg");

    console.log(
      `✅ ${cards.length} cards with images (filtered ${verifiedItems.length - cards.length} without)`,
    );

    // Step 4: Enrich with market data
    const packTokenCache = new Map<string, string | null>();

    const enrichedCards = await Promise.all(
      cards.map(async (card: any) => {
        let tokenAddress = packTokenCache.get(card.contractAddress);
        if (tokenAddress === undefined) {
          tokenAddress = await getPackTokenAddress(card.contractAddress);
          packTokenCache.set(card.contractAddress, tokenAddress);
        }

        const rarityStats = {
          common: { attack: 2, health: 2, mana: 2 },
          rare: { attack: 3, health: 3, mana: 3 },
          epic: { attack: 4, health: 5, mana: 4 },
          legendary: { attack: 6, health: 6, mana: 5 },
        };

        if (!tokenAddress) {
          const stats =
            rarityStats[card.rarity as keyof typeof rarityStats] ||
            rarityStats.common;
          return { ...card, ...stats };
        }

        const marketData = await fetchTokenMarketData(tokenAddress);
        if (!marketData) {
          const stats =
            rarityStats[card.rarity as keyof typeof rarityStats] ||
            rarityStats.common;
          return { ...card, ...stats };
        }

        const marketStats = calculateCardStats(marketData);
        return {
          ...card,
          attack: marketStats.attack,
          health: marketStats.health,
          mana: marketStats.mana,
          rarity: marketStats.rarity,
          marketData: {
            price: marketData.price,
            priceChange24h: marketData.priceChange24h,
            marketCap: marketData.marketCap,
          },
        };
      }),
    );

    // Fetch pack cover image: on-chain first (find unopened token), Wield fallback
    if (enrichedCards.length > 0) {
      const firstContract = enrichedCards[0].contractAddress as `0x${string}`;

      // Try on-chain: sample tokenIds 1-10, find one with rarity=0 (unopened = pack cover)
      try {
        const sampleIds = Array.from({ length: 10 }, (_, i) => i + 1);
        const sampleCalls = sampleIds.map((id) => ({
          address: firstContract,
          abi: PACK_ABI,
          functionName: "getTokenRarity" as const,
          args: [BigInt(id)],
        }));
        const sampleResults = await client.multicall({
          contracts: sampleCalls,
          allowFailure: true,
        });

        let unopenedTokenId: number | null = null;
        for (let i = 0; i < sampleIds.length; i++) {
          const r = sampleResults[i];
          if (r.status === "success") {
            const rarity = Number((r.result as [number, bigint])[0]);
            if (rarity === 0) {
              unopenedTokenId = sampleIds[i];
              break;
            }
          }
        }

        if (unopenedTokenId !== null) {
          const packUri = await client.readContract({
            address: firstContract,
            abi: PACK_ABI,
            functionName: "tokenURI",
            args: [BigInt(unopenedTokenId)],
          });
          const httpUri = ipfsToHttp(packUri as string);
          const metaResp = await fetch(httpUri, { cache: "no-store" });
          if (metaResp.ok) {
            const meta = await metaResp.json();
            wieldPackImage = ipfsToHttp(meta.image || meta.imageUrl || "");
            console.log(
              `🎨 Pack cover from on-chain token #${unopenedTokenId}`,
            );
          }
        }
      } catch {
        // On-chain pack cover detection failed, will try Wield
      }

      // Fallback: Wield API getPackInfo
      if (!wieldPackImage) {
        try {
          const packInfo = await getPackInfo(firstContract);
          const ci = packInfo?.contractInfo;
          wieldPackImage =
            ci?.packImage || ci?.imageUrl || ci?.featuredImageUrl || "";
          if (wieldPackImage) {
            console.log(`🎨 Pack cover from Wield API fallback`);
          }
        } catch {
          // Wield API may be rate-limited
        }
      }
    }

    return NextResponse.json({
      cards: enrichedCards,
      revealed: enrichedCards.length,
      total: matched.length,
      packImage: wieldPackImage,
    });
  } catch (error: any) {
    console.error("Failed to fetch cards:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
