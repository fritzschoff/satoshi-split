'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  arbitrumSepolia,
  baseSepolia,
  mainnet,
  monadTestnet,
  optimismSepolia,
  polygonAmoy,
  sepolia,
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'SatoshiSplit',
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [
    sepolia,
    mainnet,
    optimismSepolia,
    monadTestnet,
    arbitrumSepolia,
    polygonAmoy,
    baseSepolia,
  ],
  ssr: true,
});
