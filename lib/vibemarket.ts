import { createPublicClient, http, parseAbiItem, getAddress } from "viem";
import { base } from "viem/chains";
import { getOwnedTokenIdsFromTransfers } from "./transferIndexer";

const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const VIBEMARKET_API_BASE = "https://build.wield.xyz/vibe/boosterbox";
const WIELD_API_KEY = process.env.WIELD_API_KEY;

// ERC721 + VibeMarket ABI for checking pack status
const PACK_CONTRACT_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "tokenOfOwnerByIndex",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "index", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }],
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
] as const;

export interface VibeMarketCard {
  tokenId: string;
  contractAddress: string;
  metadata: {
    name: string;
    image: string;
    attributes: {
      trait_type: string;
      value: string;
    }[];
  };
}

// Fetch cards owned by user using Alchemy NFT API
export async function fetchUserCards(
  address: string,
): Promise<VibeMarketCard[]> {
  try {
    const url = `https://base-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_KEY}/getNFTsForOwner?owner=${address}&withMetadata=true`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch NFTs");
    const data = await response.json();

    // Filter for VibeMarket NFTs only (check description for vibe.market)
    // AND exclude unopened packs
    const vibeMarketNFTs = data.ownedNfts.filter((nft: any) => {
      const description =
        nft.raw?.metadata?.description || nft.description || "";
      const isVibeMarket = description.toLowerCase().includes("vibe.market");

      // Check if it's an unopened pack
      const rarityAttr = nft.raw?.metadata?.attributes?.find(
        (a: any) => a.trait_type?.toLowerCase() === "rarity",
      );
      const isUnopened = rarityAttr?.value?.toLowerCase() === "unopened";

      return isVibeMarket && !isUnopened;
    });

    console.log(
      "Filtered VibeMarket NFTs:",
      vibeMarketNFTs.length,
      "of",
      data.ownedNfts.length,
    );

    // Convert Alchemy NFT format to VibeMarket format
    return vibeMarketNFTs.map((nft: any) => ({
      tokenId: nft.tokenId,
      contractAddress: nft.contract.address,
      metadata: {
        name: nft.name || nft.title || `Card #${nft.tokenId}`,
        image:
          nft.image?.cachedUrl ||
          nft.image?.originalUrl ||
          nft.image?.thumbnailUrl ||
          "/placeholder.jpg",
        attributes: nft.raw?.metadata?.attributes || [],
      },
    }));
  } catch (error) {
    console.error("Error fetching cards:", error);
    return [];
  }
}

/**
 * Get accurate pack count directly from contract using balanceOf()
 * This bypasses Alchemy's indexer and gets the TRUE on-chain count
 */
export async function getContractPackCount(
  contractAddress: string,
  ownerAddress: string,
): Promise<number> {
  try {
    const client = createPublicClient({
      chain: base,
      transport: http(`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
    });

    const balance = await client.readContract({
      address: contractAddress as `0x${string}`,
      abi: PACK_CONTRACT_ABI,
      functionName: "balanceOf",
      args: [ownerAddress as `0x${string}`],
    });

    return Number(balance);
  } catch (error) {
    console.error("Error getting contract balance:", error);
    return 0;
  }
}

/**
 * Check if a token is actually unopened by calling getTokenRarity()
 * Returns true if rarity = 0 (unopened), false if opened
 */
export async function isTokenUnopened(
  contractAddress: string,
  tokenId: string,
): Promise<boolean> {
  try {
    const client = createPublicClient({
      chain: base,
      transport: http(`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
    });

    const [rarity] = await client.readContract({
      address: contractAddress as `0x${string}`,
      abi: PACK_CONTRACT_ABI,
      functionName: "getTokenRarity",
      args: [BigInt(tokenId)],
    });

    // Rarity 0 = unopened
    const unopened = Number(rarity) === 0;
    console.log(`Token ${tokenId}: rarity=${rarity}, unopened=${unopened}`);
    return unopened;
  } catch (error) {
    // If it throws, assume unopened
    console.log(`Token ${tokenId}: getTokenRarity() threw, assuming unopened`);
    return true;
  }
}

/**
 * Get all UNOPENED token IDs using Transfer event indexing
 * This is 100% ACCURATE - reads blockchain events directly like BaseScan!
 */
export async function getOwnedTokenIds(
  contractAddress: string,
  ownerAddress: string,
): Promise<string[]> {
  try {
    // Step 1: Use Transfer event indexer to get ALL tokens you own
    const ownedTokenIds = await getOwnedTokenIdsFromTransfers(
      contractAddress,
      ownerAddress,
    );

    console.log(
      `📦 Transfer indexer found ${ownedTokenIds.length} owned tokens`,
    );

    // Step 2: Check which ones are unopened using getTokenRarity()
    const unopenedTokenIds: string[] = [];

    console.log(
      `🔍 Checking unopened status for ${ownedTokenIds.length} tokens...`,
    );

    for (let i = 0; i < ownedTokenIds.length; i++) {
      const tokenId = ownedTokenIds[i];
      const isUnopened = await isTokenUnopened(contractAddress, tokenId);
      if (isUnopened) {
        unopenedTokenIds.push(tokenId);
      }

      if ((i + 1) % 10 === 0) {
        console.log(
          `📊 Checked ${i + 1}/${ownedTokenIds.length} tokens, ${unopenedTokenIds.length} unopened so far`,
        );
      }
    }

    console.log(
      `✅ ${unopenedTokenIds.length} unopened of ${ownedTokenIds.length} owned tokens`,
    );
    return unopenedTokenIds;
  } catch (error) {
    console.error("Error getting owned token IDs:", error);
    return [];
  }
}

// Fetch ONLY unopened packs - force fresh ownership check
export async function fetchUnopenedPacks(
  address: string,
  forceRefresh = false,
): Promise<VibeMarketCard[]> {
  try {
    // ALWAYS force refresh to get current ownership (not cached old data)
    let url = `https://base-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_KEY}/getNFTsForOwner?owner=${address}&withMetadata=true&pageSize=100&refreshCache=true`;

    console.log("🔍 Fetching FRESH NFT ownership for:", address);

    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch NFTs");
    const data = await response.json();

    let allNfts = data.ownedNfts;
    let pageKey = data.pageKey;

    // Paginate to get ALL NFTs
    while (pageKey) {
      const nextUrl = `${url}&pageKey=${pageKey}`;
      const nextResponse = await fetch(nextUrl);
      const nextData = await nextResponse.json();
      allNfts = [...allNfts, ...nextData.ownedNfts];
      pageKey = nextData.pageKey;
      console.log(`📄 Page loaded, total so far: ${allNfts.length}`);
    }

    // Step 3: Filter for VibeMarket unopened packs
    const unopenedPacks = allNfts.filter((nft: any) => {
      const description =
        nft.raw?.metadata?.description || nft.description || "";
      const isVibeMarket = description.toLowerCase().includes("vibe.market");

      // Look for Status attribute (not Rarity!)
      const statusAttr = nft.raw?.metadata?.attributes?.find(
        (a: any) => a.trait_type?.toLowerCase() === "status",
      );
      const isMinted = statusAttr?.value?.toLowerCase() === "minted";

      return isVibeMarket && isMinted;
    });

    console.log(`✅ Found ${unopenedPacks.length} unopened VibeMarket packs`);

    return unopenedPacks.map((nft: any) => ({
      tokenId: nft.tokenId,
      contractAddress: nft.contract.address,
      metadata: {
        name: nft.name || nft.title || `Pack #${nft.tokenId}`,
        image:
          nft.image?.cachedUrl ||
          nft.image?.originalUrl ||
          nft.image?.thumbnailUrl ||
          "/placeholder.jpg",
        attributes: nft.raw?.metadata?.attributes || [],
      },
    }));
  } catch (error) {
    console.error("Error fetching packs:", error);
    return [];
  }
}

// Get pack contract info (includes ERC20 token address)
export async function getPackInfo(contractAddress: string) {
  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (WIELD_API_KEY) {
      headers["API-KEY"] = WIELD_API_KEY;
    }

    const response = await fetch(
      `${VIBEMARKET_API_BASE}/contractAddress/${contractAddress}`,
      { headers },
    );
    if (!response.ok) throw new Error("Failed to fetch pack info");
    return await response.json();
  } catch (error) {
    console.error("Error fetching pack info:", error);
    return null;
  }
}

// Extract ERC20 token address from pack metadata
export async function getPackTokenAddress(
  contractAddress: string,
): Promise<string | null> {
  try {
    const packInfo = await getPackInfo(contractAddress);
    if (!packInfo) return null;

    // Wield API may return the token address in various fields
    // Common fields: tokenAddress, erc20Address, token, baseToken
    const tokenAddress =
      packInfo.tokenAddress ||
      packInfo.erc20Address ||
      packInfo.token ||
      packInfo.baseToken;

    if (tokenAddress && typeof tokenAddress === "string") {
      return tokenAddress;
    }

    console.log(`No token address found for pack ${contractAddress}`);
    return null;
  } catch (error) {
    console.error(
      `Error getting token address for pack ${contractAddress}:`,
      error,
    );
    return null;
  }
}

/**
 * Fetch unopened packs from Vibe Market API
 * Uses the correct endpoint: /owner/{address}
 * This provides real-time data without waiting for Alchemy indexing
 */
export async function fetchUnopenedPacksFromVibeMarket(
  address: string,
): Promise<VibeMarketCard[]> {
  try {
    // Convert address to checksum format (required by Vibe Market API)
    const checksumAddress = getAddress(address);
    console.log("🔍 Fetching packs from Vibe Market API for:", checksumAddress);
    const url = `${VIBEMARKET_API_BASE}/owner/${checksumAddress}`;
    console.log("API URL:", url);

    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    // Add API key if available
    if (WIELD_API_KEY) {
      headers["API-KEY"] = WIELD_API_KEY;
      console.log("Using Wield API key for authentication");
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      console.error(
        "Vibe Market API response not OK:",
        response.status,
        response.statusText,
      );
      throw new Error(`Vibe Market API error: ${response.status}`);
    }

    const result = await response.json();
    console.log(
      "Vibe Market API raw response:",
      JSON.stringify(result, null, 2),
    );

    // API returns { success: true, data: [...] }
    if (!result.success || !result.data) {
      console.warn("Unexpected API response structure:", result);
      throw new Error("Unexpected API response structure");
    }

    const boosterBoxes = Array.isArray(result.data) ? result.data : [];
    console.log(
      `Found ${boosterBoxes.length} total BoosterBoxes from Vibe Market`,
    );

    // Filter for unopened packs (rarity = 0)
    const unopenedPacks = boosterBoxes.filter((box: any) => {
      const isUnopened = box.rarity === 0;
      if (isUnopened) {
        console.log("Found unopened pack:", box.tokenId, box.contractAddress);
      }
      return isUnopened;
    });

    console.log(
      `✅ Vibe Market API found ${unopenedPacks.length} unopened packs`,
    );

    return unopenedPacks.map((box: any) => ({
      tokenId: box.tokenId.toString(),
      contractAddress: box.contractAddress,
      metadata: {
        name: box.name || `Pack #${box.tokenId}`,
        image: box.image || "/vibe.png",
        attributes: box.attributes || [],
      },
    }));
  } catch (error) {
    console.error("Error fetching from Vibe Market API:", error);
    throw error;
  }
}
