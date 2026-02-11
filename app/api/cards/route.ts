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

async function getTokenURI(
  contractAddress: string,
  tokenId: string,
): Promise<string | null> {
  try {
    const paddedId = BigInt(tokenId).toString(16).padStart(64, "0");
    const response = await fetch(BASE_RPC, {
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
    });
    const data = await response.json();
    if (!data.result || data.result === "0x") return null;

    const hex = data.result.slice(2);
    const offset = parseInt(hex.slice(0, 64), 16) * 2;
    const length = parseInt(hex.slice(offset, offset + 64), 16);
    const strHex = hex.slice(offset + 64, offset + 64 + length * 2);
    return Buffer.from(strHex, "hex").toString("utf-8");
  } catch (e) {
    console.error(
      `Failed to read tokenURI for ${contractAddress}/${tokenId}:`,
      e,
    );
    return null;
  }
}

async function fetchTokenMetadata(
  contractAddress: string,
  tokenId: string,
): Promise<{ name: string; image: string } | null> {
  const uri = await getTokenURI(contractAddress, tokenId);
  if (!uri) return null;

  try {
    const httpUri = ipfsToHttp(uri);
    const res = await fetch(httpUri);
    if (!res.ok) return null;
    const meta = await res.json();
    return {
      name: meta.name || `Card #${tokenId}`,
      image: ipfsToHttp(meta.image || meta.imageUrl || ""),
    };
  } catch (e) {
    console.error(
      `Failed to fetch metadata for ${contractAddress}/${tokenId}:`,
      e,
    );
    return null;
  }
}

/**
 * GET /api/cards?owner={address}&contract={contractAddress}&tokens=1,2,3
 *
 * Polls the Wield API for revealed card metadata after VRF fulfillment.
 * Returns cards with rarity > 0 (revealed) and their metadata.
 * Falls back to on-chain tokenURI for cards missing images.
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
    const url = `https://build.wield.xyz/vibe/boosterbox/owner/${ownerAddress}?chainId=8453&limit=200`;

    const response = await fetch(url, {
      headers: {
        "API-KEY": WIELD_API_KEY,
        Accept: "application/json",
      },
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

    if (!Array.isArray(items)) {
      return NextResponse.json({ cards: [], revealed: 0, total: 0 });
    }

    // Filter to requested contract and token IDs
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

    const rarityMap: Record<number, string> = {
      1: "common",
      2: "rare",
      3: "epic",
      4: "legendary",
      5: "mythic",
    };

    // Separate revealed (rarity > 0) from unrevealed
    const revealedItems = matched.filter(
      (item: any) => item.rarity && item.rarity > 0,
    );

    // Build cards, fetching on-chain metadata for any missing images
    const revealed = await Promise.all(
      revealedItems.map(async (item: any) => {
        let name = item.name || `Card #${item.tokenId}`;
        let image = item.image || item.imageUrl || item.metadata?.image || "";
        const ticker =
          item.attributes?.find((a: any) => a.trait_type === "Ticker")?.value ||
          "";

        // If Wield API didn't return an image, fetch from on-chain tokenURI
        if (!image || image === "/placeholder.jpg") {
          console.log(
            `🔍 Card #${item.tokenId}: no image from API, fetching tokenURI...`,
          );
          const onChainMeta = await fetchTokenMetadata(
            item.contractAddress,
            String(item.tokenId),
          );
          if (onChainMeta) {
            name = onChainMeta.name || name;
            image = onChainMeta.image || image;
            console.log(
              `✅ Card #${item.tokenId}: got image from tokenURI:`,
              image,
            );
          }
        } else {
          image = ipfsToHttp(image);
        }

        return {
          id: `${item.contractAddress}-${item.tokenId}`,
          tokenId: String(item.tokenId),
          contractAddress: item.contractAddress,
          name,
          image: image || "/placeholder.jpg",
          rarity: rarityMap[item.rarity] || "common",
          ticker,
        };
      }),
    );

    return NextResponse.json({
      cards: revealed,
      revealed: revealed.length,
      total: tokenSet.size || matched.length,
    });
  } catch (error: any) {
    console.error("Failed to fetch cards:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
