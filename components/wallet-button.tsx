'use client';

import { usePrivy } from '@privy-io/react-auth';

export function WalletButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();

  if (!ready) {
    return (
      <button className="px-4 py-2 bg-purple-600 rounded-lg text-white text-sm opacity-50">
        Loading...
      </button>
    );
  }

  if (authenticated && user) {
    return (
      <button
        onClick={logout}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm transition-colors"
      >
        {user.wallet?.address?.slice(0, 6)}...{user.wallet?.address?.slice(-4)}
      </button>
    );
  }

  return (
    <button
      onClick={login}
      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-white font-bold transition-all shadow-lg hover:shadow-xl"
    >
      Connect Wallet
    </button>
  );
}
