'use client';

// Load polyfills first
import '@/lib/polyfills';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { darkTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi';
import '@rainbow-me/rainbowkit/styles.css';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { NexusProvider } from '@avail-project/nexus-widgets';

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
    <NexusProvider config={{ network: 'testnet' }}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: '#000000',
              accentColorForeground: '#ffffff',
              borderRadius: 'small',
              fontStack: 'system',
              overlayBlur: 'small',
            })}
          >
            {mounted && <WalletCookieSync />}
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </NexusProvider>
  );
}
