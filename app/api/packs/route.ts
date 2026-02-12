import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const WIELD_API_KEY = process.env.WIELD_API_KEY;
const BASE_RPC = "https://mainnet.base.org";
const TOKEN_URI_SELECTOR = "0xc87b56dd"; // tokenURI(uint256)

function ipfsToHttp(uri: string): string {
  if (uri.startsWith("ipfs://")) {
    return uri.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  return uri;
}

// Cache collection metadata per contract address
const collectionCache = new Map<string, { name: string; image: string }>();

async function getCollectionMetadata(
  contractAddress: string,
  tokenId: string,
): Promise<{ name: string; image: string }> {
  if (collectionCache.has(contractAddress)) {
    return collectionCache.get(contractAddress)!;
  }

  try {
    // ONE eth_call to get tokenURI
    const paddedId = BigInt(tokenId).toString(16).padStart(64, "0");
    const rpcResp = await fetch(BASE_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_call",
        params: [
          { to: contractAddress, data: `${TOKEN_URI_SELECTOR}${paddedId}` },
          "latest",
        ],
        id: 1,
      }),
      cache: "no-store",
    });
    const rpcData = await rpcResp.json();

    if (!rpcData.result || rpcData.result === "0x") {
      console.log(`⚠️ No tokenURI for ${contractAddress.slice(0, 10)}...`);
      return { name: "Unknown Pack", image: "/vibe.png" };
    }

    // Decode ABI-encoded string
    const hex = rpcData.result.slice(2);
    const offset = parseInt(hex.slice(0, 64), 16) * 2;
    const length = parseInt(hex.slice(offset, offset + 64), 16);
    const strHex = hex.slice(offset + 64, offset + 64 + length * 2);
    const tokenUri = Buffer.from(strHex, "hex").toString("utf-8");

    console.log(
      `🔍 tokenURI for ${contractAddress.slice(0, 10)}...: ${tokenUri.slice(0, 80)}`,
    );

    // Fetch metadata from the URI (usually a Wield API URL)
    const httpUri = ipfsToHttp(tokenUri);
    const metaResp = await fetch(httpUri, { cache: "no-store" });
    if (metaResp.ok) {
      const meta = await metaResp.json();
      const rawImage = meta.image || meta.imageUrl || "";
      const image = rawImage ? ipfsToHttp(rawImage) : "/vibe.png";
      const name = meta.name?.replace(/#\d+$/, "").trim() || "Unknown Pack";
      const metadata = { name, image };
      collectionCache.set(contractAddress, metadata);
      console.log(
        `✅ ${contractAddress.slice(0, 10)}...: ${name} | ${image.slice(0, 60)}`,
      );
      return metadata;
    }
  } catch (e: any) {
    console.error(
      `⚠️ Metadata failed for ${contractAddress.slice(0, 10)}...:`,
      e.message?.slice(0, 100),
    );
  }

  return { name: "Unknown Pack", image: "/vibe.png" };
}

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
    const allItems = data?.boxes || data?.data || [];

    if (!Array.isArray(allItems)) {
      return NextResponse.json({ packs: [] });
    }

    // Filter to unopened: rarity === 0
    const items = allItems.filter((item: any) => (item.rarity ?? -1) === 0);
    console.log(`📦 ${items.length} unopened of ${allItems.length} total`);

    // Get metadata for each unique contract (ONE RPC call per contract, sequential)
    const uniqueContracts = [
      ...new Set(items.map((item: any) => item.contractAddress)),
    ] as string[];
    for (const contract of uniqueContracts) {
      const sample = items.find(
        (item: any) => item.contractAddress === contract,
      );
      if (sample) {
        await getCollectionMetadata(contract, String(sample.tokenId));
      }
    }

    // Build response
    const packs = items.map((item: any) => {
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

    console.log(`✅ ${packs.length} packs ready`);
    return NextResponse.json({ packs });
  } catch (error: any) {
    console.error("Failed to fetch packs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
