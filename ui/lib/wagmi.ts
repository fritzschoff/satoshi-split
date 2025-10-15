'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  sepolia,
  optimismSepolia,
  baseSepolia,
  arbitrumSepolia,
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'SatoshiSplit',
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [sepolia, optimismSepolia, baseSepolia, arbitrumSepolia],
  ssr: true,
});
