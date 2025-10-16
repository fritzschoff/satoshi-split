'use client';

import { useEffect, useState } from 'react';
import { EthereumProvider, NexusSDK, UserAsset } from '@avail-project/nexus';
import { useAccount } from 'wagmi';
import { useNexus } from '@avail-project/nexus-widgets';

export function useGetNexus() {
  const [error, setError] = useState<Error | null>(null);
  const { address, isConnected, connector } = useAccount();
  const [unifiedBalance, setUnifiedBalance] = useState<UserAsset[] | null>(
    null
  );
  const {
    setProvider,
    initializeSdk,
    sdk: nexus,
    isSdkInitialized: isInitialized,
  } = useNexus();

  useEffect(() => {
    async function initializeNexus() {
      try {
        setError(null);

        if (isConnected && address && connector && !isInitialized) {
          const provider = await connector.getProvider();
          setProvider(provider as EthereumProvider);
          const isInitialized = await initializeSdk(
            provider as EthereumProvider
          );
          console.log(isInitialized);

          setInterval(() => {
            getUnifiedBalance();
          }, 1000);
        }
      } catch (err) {
        console.error('Error initializing Nexus SDK:', err);
        setError(
          err instanceof Error
            ? err
            : new Error('Failed to initialize Nexus SDK')
        );
      }
    }

    initializeNexus();
  }, [isConnected, address, connector]);

  const getUnifiedBalance = async () => {
    console.log(nexus, isInitialized);
    if (isInitialized && nexus) {
      try {
        console.log(nexus);
        const balances = await nexus.getUnifiedBalances();
        console.log('balances', balances);
        setUnifiedBalance(balances ?? null);
      } catch (error) {
        console.log('error', error);
        console.error('Error getting unified balance:', error);
        setError(
          error instanceof Error
            ? error
            : new Error('Failed to get unified balance')
        );
      }
    }
  };

  return {
    nexus,
    isInitialized,
    error,
    isConnected,
    unifiedBalance,
    getUnifiedBalance,
  };
}
