'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import {
  useNexus,
  UserAsset,
  EthereumProvider,
  SUPPORTED_TOKENS,
} from '@avail-project/nexus-widgets';
import { SPLIT_MANAGER_ABI } from '@/constants/contract-abi';

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

  const simulateBridgeAndExecute = async (
    token: SUPPORTED_TOKENS,
    amount: string,
    splitId: string,
    creditor: string
  ) => {
    try {
      return await nexus.simulateBridgeAndExecute({
        amount,
        toChainId: 11155111,
        token: token,
        execute: {
          contractAbi: SPLIT_MANAGER_ABI,
          functionName: 'payDebt',
          contractAddress: process.env
            .NEXT_PUBLIC_SPLIT_CONTRACT_ADDRESS as `0x${string}`,
          value: token === 'ETH' ? amount : undefined,
          buildFunctionParams: (params) => {
            return {
              functionParams: [splitId, creditor, amount],
              value: params === 'ETH' ? amount : undefined,
            };
          },
        },
      });
    } catch (error) {
      console.error('Error simulating bridge and execute:', error);
      setError(
        error instanceof Error
          ? error
          : new Error('Failed to simulate bridge and execute')
      );
    }
  };

  const bridgeAndExecute = async (
    token: SUPPORTED_TOKENS,
    amount: string,
    splitId: string,
    creditor: string
  ) => {
    try {
      return await nexus.bridgeAndExecute({
        amount,
        toChainId: 11155420,
        token: token,
        execute: {
          contractAbi: SPLIT_MANAGER_ABI,
          functionName: 'payDebt',
          contractAddress: process.env
            .NEXT_PUBLIC_SPLIT_CONTRACT_ADDRESS as `0x${string}`,
          value: token === 'ETH' ? amount : undefined,
          buildFunctionParams: (params) => {
            return {
              functionParams: [splitId, creditor, amount],
              value: params === 'ETH' ? amount : undefined,
            };
          },
        },
      });
    } catch (error) {
      console.error('Error bridging and executing:', error);
      setError(
        error instanceof Error
          ? error
          : new Error('Failed to bridge and execute')
      );
    }
  };

  const simulateBridge = async (token: SUPPORTED_TOKENS, amount: string) => {
    try {
      return await nexus.simulateBridge({
        token,
        amount,
        chainId: 11155420,
        sourceChains: [11155111],
      });
    } catch (error) {
      console.error('Error simulating bridge:', error);
      setError(
        error instanceof Error ? error : new Error('Failed to simulate bridge')
      );
    }
  };

  const bridge = async (token: SUPPORTED_TOKENS, amount: string) => {
    try {
      return await nexus.bridge({
        token,
        amount,
        chainId: 11155420,
        sourceChains: [11155111],
      });
    } catch (error) {
      console.error('Error bridging:', error);
      setError(error instanceof Error ? error : new Error('Failed to bridge'));
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
    simulateBridgeAndExecute,
    bridgeAndExecute,
    bridge,
    simulateBridge,
  };
}
