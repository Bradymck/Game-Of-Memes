import { createPublicClient, createWalletClient, custom, http, parseEther } from 'viem';
import { base } from 'viem/chains';

/**
 * VibeMarket Pack Opening Integration
 *
 * This module enables Chaos Draft mode where players can:
 * 1. Bring unopened VibeMarket packs to matches
 * 2. Open them live using Pyth VRF
 * 3. Play with freshly revealed cards
 *
 * Based on: https://docs.wield.xyz/docs/vibemarket/developers
 */

// Minimal ABI for VibeMarket BoosterDrop contract
const BOOSTER_DROP_ABI = [
  {
    name: 'getEntropyFee',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'open',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'tokenIds', type: 'uint256[]' }],
    outputs: [],
  },
  {
    name: 'getTokenRarity',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'rarity', type: 'uint8' },
      { name: 'randomValue', type: 'uint256' }
    ],
  },
] as const;

export interface PackOpenResult {
  tokenId: string;
  rarity: number; // 1-5 (Common to Mythic)
  randomValue: bigint;
}

/**
 * Get the entropy fee required to open packs
 */
export async function getEntropyFee(packContractAddress: string): Promise<bigint> {
  const client = createPublicClient({
    chain: base,
    transport: http(),
  });

  const fee = await client.readContract({
    address: packContractAddress as `0x${string}`,
    abi: BOOSTER_DROP_ABI,
    functionName: 'getEntropyFee',
  });

  return fee;
}

/**
 * Open VibeMarket packs using Pyth VRF
 *
 * @param packContractAddress - The VibeMarket pack contract address
 * @param tokenIds - Array of unopened pack token IDs
 * @returns Transaction hash
 */
export async function openPacks(
  packContractAddress: string,
  tokenIds: string[]
): Promise<string> {
  // Get wallet client from browser (Privy/MetaMask)
  const walletClient = createWalletClient({
    chain: base,
    transport: custom((window as any).ethereum),
  });

  const [account] = await walletClient.getAddresses();

  // Get entropy fee
  const entropyFee = await getEntropyFee(packContractAddress);

  // Open packs with Pyth randomness
  const hash = await walletClient.writeContract({
    address: packContractAddress as `0x${string}`,
    abi: BOOSTER_DROP_ABI,
    functionName: 'open',
    args: [tokenIds.map(id => BigInt(id))],
    value: entropyFee,
    account,
  });

  return hash;
}

/**
 * Get rarity and randomness for opened pack
 */
export async function getPackResults(
  packContractAddress: string,
  tokenId: string
): Promise<PackOpenResult> {
  const client = createPublicClient({
    chain: base,
    transport: http(),
  });

  const [rarity, randomValue] = await client.readContract({
    address: packContractAddress as `0x${string}`,
    abi: BOOSTER_DROP_ABI,
    functionName: 'getTokenRarity',
    args: [BigInt(tokenId)],
  });

  return {
    tokenId,
    rarity: Number(rarity),
    randomValue,
  };
}

/**
 * Chaos Draft Flow:
 *
 * 1. Match starts, both players select unopened packs
 * 2. Call openPacks() for both players simultaneously
 * 3. Wait for Pyth VRF to generate randomness
 * 4. Call getPackResults() to get card rarities
 * 5. Load cards into game with stats based on rarity + randomValue
 * 6. Play match with freshly opened cards!
 * 7. Winner keeps opened cards, loser gets nerf votes
 */

export const CHAOS_DRAFT_EXAMPLE = `
// Example: Chaos Draft Match

// Step 1: Get player's unopened packs
const unopenedPacks = await fetchUserCards(playerAddress);
const packsOnly = unopenedPacks.filter(card =>
  card.metadata.attributes.find(a => a.value === "Unopened")
);

// Step 2: Player selects pack for match
const selectedPack = packsOnly[0];

// Step 3: Open pack with Pyth VRF
const txHash = await openPacks(
  selectedPack.contractAddress,
  [selectedPack.tokenId]
);

// Step 4: Wait for transaction + get results
await waitForTransaction(txHash);
const result = await getPackResults(
  selectedPack.contractAddress,
  selectedPack.tokenId
);

// Step 5: Generate card stats from randomness
const cardStats = generateStatsFromRarity(
  result.rarity,
  result.randomValue
);

// Step 6: Load into game and play!
startMatch(cardStats);
`;

/**
 * Rarity Levels (per VibeMarket docs):
 * 1 = Common
 * 2 = Rare
 * 3 = Epic
 * 4 = Legendary
 * 5 = Mythic
 */
export const RARITY_NAMES = ['Unknown', 'Common', 'Rare', 'Epic', 'Legendary', 'Mythic'];
