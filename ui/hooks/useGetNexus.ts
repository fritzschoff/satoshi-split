'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import {
  useNexus,
  UserAsset,
  EthereumProvider,
  SUPPORTED_TOKENS,
  SUPPORTED_CHAINS_IDS,
} from '@avail-project/nexus-widgets';
import { SPLIT_MANAGER_ABI } from '@/constants/contract-abi';
import { Split } from '@/types/web3';

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

  const getBridgeFees = async (
    token: SUPPORTED_TOKENS,
    amount: string,
    toChainId: number
  ) => {
    return await nexus.simulateBridge({
      amount: Number(amount),
      chainId: toChainId as SUPPORTED_CHAINS_IDS,
      token: token,
    });
  };

  const bridge = async (
    token: SUPPORTED_TOKENS,
    amount: string,
    toChainId: number
  ) => {
    try {
      return await nexus.bridge({
        amount: Number(amount),
        chainId: toChainId as SUPPORTED_CHAINS_IDS,
        token: token,
      });
    } catch (error) {
      console.error('Error bridging:', error);
      setError(error instanceof Error ? error : new Error('Failed to bridge'));
      throw error;
    }
  };

  const simulateBridgeAndExecute = async (
    token: SUPPORTED_TOKENS,
    debt: string,
    split: Split,
    creditor: string
  ) => {
    try {
      const SEPOLIA_CHAIN_ID = 11155111;

      return await nexus.simulateBridgeAndExecute({
        amount: debt,
        toChainId: SEPOLIA_CHAIN_ID,
        token: token,
        execute: {
          contractAbi: SPLIT_MANAGER_ABI,
          functionName: 'payDebt',
          contractAddress: process.env
            .NEXT_PUBLIC_SPLIT_CONTRACT_ADDRESS as `0x${string}`,
          buildFunctionParams: () => {
            return {
              functionParams: [split.id, creditor, debt],
              ...(token === 'ETH' ? { value: debt } : {}),
            };
          },
          ...(token !== 'ETH'
            ? {
                tokenApproval: {
                  token: token,
                  amount: debt,
                },
              }
            : {}),
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

  const payDebt = async (
    token: SUPPORTED_TOKENS,
    debt: bigint,
    split: Split,
    creditor: string
  ) => {
    try {
      const SEPOLIA_CHAIN_ID = 11155111;

      const tokenBalance = unifiedBalance?.find(
        (asset) => asset.symbol === token
      );

      const debtAmount = Number(debt);
      const availableBalance = tokenBalance
        ? parseFloat(tokenBalance.balance)
        : 0;

      if (availableBalance < debtAmount) {
        throw new Error(
          `Insufficient ${token} balance. You have ${availableBalance} but need ${debtAmount}`
        );
      }

      return await nexus.bridgeAndExecute({
        amount: Number(debt),
        toChainId: SEPOLIA_CHAIN_ID,
        token: token,
        execute: {
          contractAbi: SPLIT_MANAGER_ABI,
          functionName: 'payDebt',
          contractAddress: process.env
            .NEXT_PUBLIC_SPLIT_CONTRACT_ADDRESS as `0x${string}`,
          buildFunctionParams: () => {
            return { functionParams: [split.id, creditor, debt] };
          },
        },
        waitForReceipt: true,
      });
    } catch (error) {
      console.error('Error paying debt:', error);
      setError(
        error instanceof Error ? error : new Error('Failed to pay debt')
      );
      throw error;
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
    payDebt,
    bridge,
    getBridgeFees,
  };
}
