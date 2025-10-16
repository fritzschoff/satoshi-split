'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import {
  useNexus,
  UserAsset,
  EthereumProvider,
} from '@avail-project/nexus-widgets';

export function useGetNexus() {
  const [error, setError] = useState<Error | null>(null);
  const { isConnected, connector } = useAccount();
  const [unifiedBalance, setUnifiedBalance] = useState<UserAsset[] | null>(
    null
  );
  const {
    setProvider,
    initializeSdk,
    sdk: nexus,
    isSdkInitialized: isInitialized,
  } = useNexus();

  const initSDK = async () => {
    const provider = await connector?.getProvider();
    setProvider(provider as EthereumProvider);
    await initializeSdk(provider as EthereumProvider);
    getUnifiedBalance();
  };

  const getUnifiedBalance = async () => {
    try {
      const balances = await nexus.getUnifiedBalances();
      setUnifiedBalance(balances ?? null);
    } catch (error) {
      console.error('Error getting unified balance:', error);
      setError(
        error instanceof Error
          ? error
          : new Error('Failed to get unified balance')
      );
    }
  };

  return {
    nexus,
    isInitialized,
    error,
    isConnected,
    unifiedBalance,
    getUnifiedBalance,
    initSDK,
  };
}
