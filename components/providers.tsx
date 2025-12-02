'use client';

import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { baseSepolia } from 'viem/chains';

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

if (!PRIVY_APP_ID) {
  throw new Error('NEXT_PUBLIC_PRIVY_APP_ID is required');
}

export function Providers({ children }: { children: React.ReactNode }) {
  const privyConfig = React.useMemo(() => ({
    loginMethods: ['wallet' as const, 'google' as const],
    appearance: {
      theme: 'dark' as const,
      accentColor: '#8B5CF6',
    },
    embeddedWallets: {
      createOnLogin: 'off' as const,
    },
    defaultChain: baseSepolia,
    supportedChains: [baseSepolia],
    showWalletLoginFirst: true,
  }), []);

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={privyConfig}
    >
      {children}
    </PrivyProvider>
  );
}
