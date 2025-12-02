import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { base } from 'viem/chains';

/**
 * Unified Soul Token Integration (SoulTokenV2)
 *
 * Deployed at: 0xE391939D6061697f72D197792d2360c81204B7fe
 * Network: Base Mainnet
 *
 * The Reverse Loop:
 * - Lose match → recordGameLoss() → Earn 1 SOUL token (ERC20, soulbound)
 * - Burn AquaPrime NFT → burnARIForSoul() → Earn 1 SOUL token
 * - Souls used for voting across entire ecosystem
 * - Fully on-chain, zero centralization
 */

const SOUL_CONTRACT_ADDRESS = '0xE391939D6061697f72D197792d2360c81204B7fe' as `0x${string}`;

const SOUL_CONTRACT_ABI = [
  // Game of Memes functions
  {
    name: 'recordGameLoss',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'recordGameWin',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'getGameStats',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [
      { name: 'losses', type: 'uint256' },
      { name: 'wins', type: 'uint256' },
      { name: 'matches', type: 'uint256' },
      { name: 'winRate', type: 'uint256' },
    ],
  },
  // ERC20 balance function
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const;

/**
 * Get soul balance for an address (ERC20 balance)
 */
export async function getSoulBalance(address: string): Promise<bigint> {
  const client = createPublicClient({
    chain: base,
    transport: http(),
  });

  const balance = await client.readContract({
    address: SOUL_CONTRACT_ADDRESS,
    abi: SOUL_CONTRACT_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
  });

  return balance;
}

/**
 * Get player game stats (wins, losses, win rate)
 */
export async function getPlayerStats(address: string) {
  const client = createPublicClient({
    chain: base,
    transport: http(),
  });

  const result = await client.readContract({
    address: SOUL_CONTRACT_ADDRESS,
    abi: SOUL_CONTRACT_ABI,
    functionName: 'getGameStats',
    args: [address as `0x${string}`],
  });

  const [losses, wins, matches, winRate] = result as readonly [bigint, bigint, bigint, bigint];

  // Also get soul balance
  const soulBalance = await getSoulBalance(address);

  return {
    souls: Number(soulBalance) / 1e18, // Convert from wei to tokens
    matches: Number(matches),
    wins: Number(wins),
    losses: Number(losses),
    winRate: Number(winRate) / 100, // Convert from basis points to percentage
  };
}

/**
 * Record a loss and earn a soul (instant mint)
 */
export async function recordLoss(): Promise<string> {
  // Switch to Base mainnet if needed
  try {
    await (window as any).ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x2105' }], // Base mainnet (8453)
    });
  } catch (error: any) {
    // Chain doesn't exist, add it
    if (error.code === 4902) {
      await (window as any).ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x2105',
          chainName: 'Base',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://mainnet.base.org'],
          blockExplorerUrls: ['https://basescan.org'],
        }],
      });
    }
  }

  const walletClient = createWalletClient({
    chain: base,
    transport: custom((window as any).ethereum),
  });

  const [account] = await walletClient.getAddresses();

  const hash = await walletClient.writeContract({
    address: SOUL_CONTRACT_ADDRESS,
    abi: SOUL_CONTRACT_ABI,
    functionName: 'recordGameLoss',
    args: [],
    account,
  });

  return hash;
}

/**
 * Record a win (no soul earned, just tracking)
 */
export async function recordWin(): Promise<string> {
  const walletClient = createWalletClient({
    chain: base,
    transport: custom((window as any).ethereum),
  });

  const [account] = await walletClient.getAddresses();

  const hash = await walletClient.writeContract({
    address: SOUL_CONTRACT_ADDRESS,
    abi: SOUL_CONTRACT_ABI,
    functionName: 'recordGameWin',
    args: [],
    account,
  });

  return hash;
}
