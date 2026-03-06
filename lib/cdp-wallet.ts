import { CdpClient } from '@coinbase/cdp-sdk';
import { encodeFunctionData } from 'viem';

/**
 * CDP AgentKit Wallet Integration
 *
 * Server-side wallet management for voice players via Coinbase Developer Platform.
 * Each voice player gets an MPC agent wallet with gas-free transactions on Base.
 *
 * Contracts:
 * - Soul Token (SoulTokenV2): 0xE391939D6061697f72D197792d2360c81204B7fe
 * - AquaPrime NFT: 0x3e7A0f61A9889BFC6b8A9f356F9CC57299762369
 * - Moonstone Token: 0x491607a777AedAb22e5409820eF5386fBFE7F360
 */

const SOUL_CONTRACT_ADDRESS = '0xE391939D6061697f72D197792d2360c81204B7fe' as const;

const SOUL_ABI = [
  {
    name: 'recordGameLoss',
    type: 'function' as const,
    stateMutability: 'nonpayable' as const,
    inputs: [],
    outputs: [],
  },
  {
    name: 'recordGameWin',
    type: 'function' as const,
    stateMutability: 'nonpayable' as const,
    inputs: [],
    outputs: [],
  },
  {
    name: 'getGameStats',
    type: 'function' as const,
    stateMutability: 'view' as const,
    inputs: [{ name: 'player', type: 'address' as const }],
    outputs: [
      { name: 'losses', type: 'uint256' as const },
      { name: 'wins', type: 'uint256' as const },
      { name: 'matches', type: 'uint256' as const },
      { name: 'winRate', type: 'uint256' as const },
    ],
  },
  {
    name: 'balanceOf',
    type: 'function' as const,
    stateMutability: 'view' as const,
    inputs: [{ name: 'account', type: 'address' as const }],
    outputs: [{ type: 'uint256' as const }],
  },
] as const;

// Singleton CDP client
let cdpClient: CdpClient | null = null;

function getCdpClient(): CdpClient {
  if (!cdpClient) {
    const apiKeyId = process.env.CDP_API_KEY_ID || process.env.COINBASE_CDP_API_KEY_ID;
    const apiKeySecret = process.env.CDP_API_KEY_SECRET || process.env.COINBASE_CDP_API_KEY_SECRET;
    if (!apiKeyId || !apiKeySecret) {
      throw new Error('CDP_API_KEY_ID and CDP_API_KEY_SECRET (or COINBASE_ prefixed) must be set');
    }
    const walletSecret = process.env.CDP_WALLET_SECRET || '';

    cdpClient = new CdpClient({
      apiKeyId,
      apiKeySecret,
      ...(walletSecret ? { walletSecret } : {}),
    });
  }
  return cdpClient;
}

/**
 * Create a new CDP agent wallet for a voice player
 */
export async function createPlayerWallet(): Promise<{
  address: string;
  accountId: string;
}> {
  const cdp = getCdpClient();
  const account = await cdp.evm.createAccount();
  return {
    address: account.address,
    accountId: account.address,
  };
}

/**
 * Record a game result on the Soul Token contract
 */
export async function recordGameResult(
  walletAddress: string,
  won: boolean,
): Promise<string> {
  const cdp = getCdpClient();
  const fnName = won ? 'recordGameWin' : 'recordGameLoss';

  const data = encodeFunctionData({
    abi: SOUL_ABI,
    functionName: fnName,
  });

  const tx = await cdp.evm.sendTransaction({
    address: walletAddress as `0x${string}`,
    transaction: {
      to: SOUL_CONTRACT_ADDRESS,
      data,
    },
    network: 'base',
  });

  return tx.transactionHash;
}

/**
 * Get on-chain player stats from Soul Token.
 * Reuses the existing soulContract.ts read functions.
 */
export async function getOnChainStats(walletAddress: string) {
  // Use the existing getPlayerStats from soulContract.ts
  const { getPlayerStats } = await import('./soulContract');
  return getPlayerStats(walletAddress);
}
