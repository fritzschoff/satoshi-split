'use client';

import { useEffect, useState } from 'react';
import {
  useAccount,
  usePublicClient,
  useWaitForTransactionReceipt,
  useWalletClient,
  useWriteContract,
} from 'wagmi';
import {
  useNexus,
  UserAsset,
  EthereumProvider,
  SUPPORTED_TOKENS,
  SUPPORTED_CHAINS_IDS,
  RFF,
} from '@avail-project/nexus-widgets';
import { SPLIT_MANAGER_ABI } from '@/constants/contract-abi';
import { Split } from '@/types/web3';
import { erc20Abi } from 'viem';
import { getTokenAddress } from '@/utils/token';

export function useGetNexus() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [error, setError] = useState<Error | null>(null);
  const { isConnected, connector } = useAccount();
  const [unifiedBalance, setUnifiedBalance] = useState<UserAsset[] | null>(
    null
  );
  const [myIntents, setMyIntents] = useState<RFF[] | null>(null);
  const [isInitializationLoading, setIsInitializationLoading] = useState(false);
  const {
    setProvider,
    initializeSdk,
    sdk: nexus,
    isSdkInitialized: isInitialized,
  } = useNexus();

  const {
    writeContract: writeContractApprove,
    data: hashApprove,
    isPending: isPendingApprove,
    error: errorApprove,
  } = useWriteContract();
  const {
    isLoading: isConfirmingApprove,
    isSuccess: isSuccessApprove,
    data: receiptApprove,
  } = useWaitForTransactionReceipt({
    hash: hashApprove,
  });

  const {
    writeContract: writeContractPay,
    data: hashPay,
    isPending: isPendingPay,
    error: errorPay,
  } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess,
    data: receiptPay,
  } = useWaitForTransactionReceipt({
    hash: hashPay,
  });

  useEffect(() => {
    if (isInitialized && !myIntents) {
      getMyIntents();
    }
  }, [isInitialized]);

  const initSDK = async () => {
    setIsInitializationLoading(true);
    const provider = await connector?.getProvider();
    setProvider(provider as EthereumProvider);
    await initializeSdk(provider as EthereumProvider);
    getUnifiedBalance();
    setIsInitializationLoading(false);
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
    splitId: bigint,
    creditor: string
  ) => {
    try {
      const SEPOLIA_CHAIN_ID = 11155111;

      const tokenBalanceOnSepolia = unifiedBalance
        ?.find(
          (asset) =>
            asset.symbol === token &&
            asset.breakdown.find((item) => item.chain.id === SEPOLIA_CHAIN_ID)
        )
        ?.breakdown.find((item) => item.chain.id === SEPOLIA_CHAIN_ID);
      const availableBalanceOnSepolia = tokenBalanceOnSepolia
        ? BigInt(tokenBalanceOnSepolia.balance.replace('.', ''))
        : BigInt(0);

      if (availableBalanceOnSepolia < debt) {
        const tokenBalance = unifiedBalance?.find(
          (asset) => asset.symbol === token
        );
        const availableBalance = tokenBalance
          ? BigInt(tokenBalance.balance.replace('.', ''))
          : BigInt(0);

        if (availableBalance < debt) {
          throw new Error(
            `Insufficient ${token} balance. You have ${availableBalance} but need ${debt.toString()}`
          );
        }

        return await nexus.bridgeAndExecute({
          amount: debt.toString(),
          toChainId: SEPOLIA_CHAIN_ID,
          token: token,
          execute: {
            contractAbi: SPLIT_MANAGER_ABI,
            functionName: 'payDebt',
            contractAddress: process.env
              .NEXT_PUBLIC_SPLIT_CONTRACT_ADDRESS as `0x${string}`,
            buildFunctionParams: () => {
              return {
                functionParams: [splitId, creditor, debt],
                ...(token === 'ETH' ? { value: debt.toString() } : {}),
              };
            },
            ...(token !== 'ETH'
              ? {
                  tokenApproval: {
                    token: token,
                    amount: debt.toString(),
                  },
                }
              : {}),
          },
          waitForReceipt: true,
        });
      } else {
        if (token === 'USDC') {
          const allowance = await publicClient?.readContract({
            address: getTokenAddress(token) as `0x${string}`,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [
              address as `0x${string}`,
              process.env.NEXT_PUBLIC_SPLIT_CONTRACT_ADDRESS as `0x${string}`,
            ],
          });
          if (allowance && allowance < debt) {
            writeContractApprove({
              address: getTokenAddress(token) as `0x${string}`,
              abi: erc20Abi,
              functionName: 'approve',
              args: [
                process.env.NEXT_PUBLIC_SPLIT_CONTRACT_ADDRESS as `0x${string}`,
                debt,
              ],
            });
            if (isSuccessApprove) {
              writeContractPay({
                address: process.env
                  .NEXT_PUBLIC_SPLIT_CONTRACT_ADDRESS as `0x${string}`,
                abi: SPLIT_MANAGER_ABI,
                functionName: 'payDebt',
                args: [splitId, creditor as `0x${string}`, debt],
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error paying debt:', error);
      setError(
        error instanceof Error ? error : new Error('Failed to pay debt')
      );
      throw error;
    }
  };

  const getMyIntents = async () => {
    if (!nexus || !isInitialized) return [];
    const intents = await nexus.getMyIntents();
    setMyIntents(intents);
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
    isInitializationLoading,
    myIntents,
    getMyIntents,
  };
}
