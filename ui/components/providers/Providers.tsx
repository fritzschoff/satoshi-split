'use client';

// Load polyfills first
import '@/lib/polyfills';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import {
  darkTheme,
  lightTheme,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi';
import '@rainbow-me/rainbowkit/styles.css';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { NexusProvider } from '@avail-project/nexus-widgets';
import { ThemeProvider, useTheme } from './ThemeProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      refetchOnWindowFocus: true,
      retry: 2,
    },
  },
});

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

function RainbowKitThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  const currentTheme =
    theme === 'dark'
      ? darkTheme({
          accentColor: '#3b82f6',
          accentColorForeground: '#ffffff',
          borderRadius: 'small',
          fontStack: 'system',
          overlayBlur: 'small',
        })
      : lightTheme({
          accentColor: '#2563eb',
          accentColorForeground: '#ffffff',
          borderRadius: 'small',
          fontStack: 'system',
          overlayBlur: 'small',
        });

  return (
    <RainbowKitProvider theme={currentTheme}>{children}</RainbowKitProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ThemeProvider>
      <NexusProvider
        config={{
          network: 'testnet',
          debug: process.env.NODE_ENV === 'development',
        }}
      >
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitThemeWrapper>
              {mounted && <WalletCookieSync />}
              {children}
            </RainbowKitThemeWrapper>
          </QueryClientProvider>
        </WagmiProvider>
      </NexusProvider>
    </ThemeProvider>
  );
}
