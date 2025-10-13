'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  sepolia,
  optimismSepolia,
  baseSepolia,
  arbitrumSepolia,
  avalancheFuji,
} from 'wagmi/chains';

// Define Polygon zkEVM Cardona testnet (not in wagmi by default)
export const polygonZkEvmCardona = {
  id: 2442,
  name: 'Polygon zkEVM Cardona',
  network: 'polygon-zkevm-cardona',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.cardona.zkevm-rpc.com'],
    },
    public: {
      http: ['https://rpc.cardona.zkevm-rpc.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Polygon zkEVM Cardona Explorer',
      url: 'https://cardona-zkevm.polygonscan.com',
    },
  },
  testnet: true,
} as const;

export const config = getDefaultConfig({
  appName: 'SatoshiSplit',
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [
    sepolia,
    optimismSepolia,
    baseSepolia,
    arbitrumSepolia,
    polygonZkEvmCardona as any,
    avalancheFuji,
  ],
  ssr: true,
});
