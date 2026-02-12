import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

export const dynamic = "force-dynamic";

const WIELD_API_KEY = process.env.WIELD_API_KEY;
const BASE_RPC = "https://mainnet.base.org";

// BoosterDropV2 ABI — only the functions we need
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

// Cache collection metadata per contract address
const collectionCache = new Map<string, { name: string; image: string }>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ownerAddress = searchParams.get("owner");

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

  console.log("📦 Fetching packs for", ownerAddress);

  try {
    // Step 1: Use Wield API for token ID discovery
    // Wield knows which contracts/tokens exist, but its rarity data may be stale
    const wieldUrl = `https://build.wield.xyz/vibe/boosterbox/owner/${ownerAddress}?chainId=8453&limit=200`;
    const wieldResponse = await fetch(wieldUrl, {
      headers: { "API-KEY": WIELD_API_KEY, Accept: "application/json" },
      cache: "no-store",
    });

    if (!wieldResponse.ok) {
      const errorText = await wieldResponse.text();
      console.error("❌ Wield API error:", wieldResponse.status, errorText);
      return NextResponse.json(
        { error: `API error: ${wieldResponse.status}` },
        { status: wieldResponse.status },
      );
    }

    const data = await wieldResponse.json();
    const allItems = data?.boxes || data?.data || [];

    if (!Array.isArray(allItems) || allItems.length === 0) {
      return NextResponse.json({ packs: [] });
    }

    console.log(`📦 Wield returned ${allItems.length} tokens`);

    // Step 2: Verify on-chain with multicall (single RPC request)
    // The Wield API can be stale — tokens may be burned, transferred, or already opened.
    // On-chain reads give us the true state.
    const client = createPublicClient({
      chain: base,
      transport: http(BASE_RPC),
    });

    // Build multicall: ownerOf + getTokenRarity for each token
    const calls = allItems.flatMap((item: any) => [
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

    console.log(`🔗 Multicall: ${calls.length} calls in 1 RPC request...`);
    const results = await client.multicall({
      contracts: calls,
      allowFailure: true,
    });

    // Filter to truly unopened and owned tokens
    const unopenedItems: typeof allItems = [];
    for (let i = 0; i < allItems.length; i++) {
      const ownerResult = results[i * 2];
      const rarityResult = results[i * 2 + 1];

      const isOwned =
        ownerResult.status === "success" &&
        (ownerResult.result as string).toLowerCase() ===
          ownerAddress.toLowerCase();

      // getTokenRarity returns 0 for unopened packs, >0 for opened.
      // For freshly minted tokens, getTokenRarity may REVERT (status=failure)
      // because VRF hasn't been called yet — these are also unopened.
      const rarity =
        rarityResult.status === "success"
          ? Number((rarityResult.result as [number, bigint])[0])
          : 0; // Revert = fresh mint = unopened

      if (isOwned && rarity === 0) {
        unopenedItems.push(allItems[i]);
      }
    }

    console.log(
      `📦 ${unopenedItems.length} truly unopened of ${allItems.length} Wield tokens`,
    );

    if (unopenedItems.length === 0) {
      return NextResponse.json({ packs: [] });
    }

    // Step 3: Get collection metadata for display
    const uniqueContracts = [
      ...new Set(unopenedItems.map((item: any) => item.contractAddress)),
    ] as string[];

    for (const contractAddress of uniqueContracts) {
      if (collectionCache.has(contractAddress)) continue;

      const sample = unopenedItems.find(
        (item: any) => item.contractAddress === contractAddress,
      );
      if (!sample) continue;

      try {
        // Single tokenURI call per contract for metadata
        const tokenUri = (await client.readContract({
          address: contractAddress as `0x${string}`,
          abi: PACK_ABI,
          functionName: "tokenURI",
          args: [BigInt(sample.tokenId)],
        })) as string;

        const httpUri = ipfsToHttp(tokenUri);
        const metaResp = await fetch(httpUri, { cache: "no-store" });
        if (metaResp.ok) {
          const metadata = await metaResp.json();
          const rawImage = metadata.image || metadata.imageUrl || "";
          const image = rawImage ? ipfsToHttp(rawImage) : "/vibe.png";
          const name =
            metadata.name?.replace(/#\d+$/, "").trim() || "Unknown Pack";
          collectionCache.set(contractAddress, { name, image });
          console.log(
            `✅ ${contractAddress.slice(0, 10)}...: ${name} | ${image.slice(0, 60)}`,
          );
        }
      } catch (e: any) {
        console.error(
          `⚠️ Metadata failed for ${contractAddress.slice(0, 10)}...:`,
          e.message?.slice(0, 100),
        );
      }
    }

    // Build response
    const packs = unopenedItems.map((item: any) => {
      const meta = collectionCache.get(item.contractAddress) || {
        name: "Unknown Pack",
        image: "/vibe.png",
      };
      return {
        id: `${item.contractAddress}-${item.tokenId}`,
        tokenId: String(item.tokenId),
        contractAddress: item.contractAddress,
        name: `${meta.name} #${item.tokenId}`,
        image: meta.image,
      };
    });

    console.log(`✅ ${packs.length} packs ready (on-chain verified)`);
    return NextResponse.json({ packs });
  } catch (error: any) {
    console.error("Failed to fetch packs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
