import { CdpClient } from '@coinbase/cdp-sdk';
import { encodeFunctionData } from 'viem';

const cdp = new CdpClient({
  apiKeyId: process.env.COINBASE_CDP_API_KEY_ID || '',
  apiKeySecret: process.env.COINBASE_CDP_API_KEY_SECRET || '',
  walletSecret: process.env.CDP_WALLET_SECRET || '',
});

const SOUL = '0xE391939D6061697f72D197792d2360c81204B7fe' as const;
const ABI = [{ name: 'recordGameWin', type: 'function' as const, stateMutability: 'nonpayable' as const, inputs: [] as const, outputs: [] as const }];

async function test() {
  // Create EOA owner
  const owner = await cdp.evm.createAccount();
  console.log('Owner EOA:', owner.address);

  // Create smart account — pass account OBJECT for gas sponsorship
  const smart = await cdp.evm.createSmartAccount({ owner: owner as any });
  console.log('Smart Account:', smart.address);

  // Send a sponsored user operation to record a game win
  const data = encodeFunctionData({ abi: ABI, functionName: 'recordGameWin' });

  console.log('Sending sponsored user operation...');
  const result = await smart.sendUserOperation({
    network: 'base',
    calls: [{ to: SOUL, data, value: BigInt(0) }],
  });
  console.log('UserOp hash:', result.userOpHash);

  const final = await smart.waitForUserOperation({
    userOpHash: result.userOpHash,
    network: 'base',
  });
  console.log('Status:', final.status);
  console.log('TX Hash:', final.transactionHash);
}

test().catch(err => {
  console.error('ERROR:', err.message);
  if (err.response) console.error('Response:', err.response.data || err.response.statusText);
});
