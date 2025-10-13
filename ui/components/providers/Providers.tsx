'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi';
import '@rainbow-me/rainbowkit/styles.css';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

const queryClient = new QueryClient();

function WalletCookieSync() {
  const { address, isConnected } = useAccount();

  useEffect(() => {
    if (isConnected && address) {
      fetch('/api/wallet/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
    } else {
      fetch('/api/wallet/clear', { method: 'POST' });
    }
  }, [address, isConnected]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {mounted && <WalletCookieSync />}
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
