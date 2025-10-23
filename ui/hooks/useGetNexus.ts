'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import {
  useNexus,
  UserAsset,
  EthereumProvider,
  SUPPORTED_CHAINS_IDS,
  RFF,
  SUPPORTED_TOKENS,
} from '@avail-project/nexus-widgets';
import { SPLIT_MANAGER_ABI } from '@/constants/contract-abi';
import { erc20Abi, formatUnits, parseUnits } from 'viem';
import { getTokenAddress, getTokenDecimals } from '@/utils/token';
import { CHAIN_NAMES } from '@/constants/chains';
import { useQueryClient } from '@tanstack/react-query';
import { sepolia } from 'viem/chains';

export function useGetNexus() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const walletClient = useWalletClient();
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
  const queryClient = useQueryClient();

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

  const getAllowance = async () => {
    return nexus.getAllowance(11155111, ['ETH', 'USDC']);
  };

  const setAllowance = async (amount: bigint) => {
    return nexus.setAllowance(11155111, ['ETH', 'USDC'], amount);
  };

  const getBridgeFees = async (
    token: SUPPORTED_TOKENS,
    amount: string,
    toChainId: number
  ) => {
    return await nexus.simulateBridge({
      amount: formatUnits(BigInt(amount), getTokenDecimals(token)),
      chainId: toChainId as SUPPORTED_CHAINS_IDS,
      token: token,
    });
  };

  const bridge = async (
    token: SUPPORTED_TOKENS,
    amount: string,
    toChainId: number,
    fromChainId?: number
  ) => {
    const fromChain = fromChainId
      ? [fromChainId]
      : Object.keys(CHAIN_NAMES)
          .filter((key) => key !== toChainId.toString())
          .map((key) => parseInt(key));
    try {
      return await nexus.bridge({
        amount: Number(amount),
        chainId: toChainId as SUPPORTED_CHAINS_IDS,
        token: token,
        sourceChains: fromChain,
      });
    } catch (error) {
      console.error('Error bridging:', error);
      setError(error instanceof Error ? error : new Error('Failed to bridge'));
      throw error;
    }
  };

  const payDebt = async (
    token: SUPPORTED_TOKENS,
    debt: bigint,
    splitId: bigint,
    creditor: string
  ) => {
    try {
      if (!walletClient.data) {
        throw new Error('Wallet client not available');
      }

      if (token !== 'ETH') {
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
          const approveHash = await walletClient.data.writeContract({
            address: getTokenAddress(token) as `0x${string}`,
            abi: erc20Abi,
            functionName: 'approve',
            args: [
              process.env.NEXT_PUBLIC_SPLIT_CONTRACT_ADDRESS as `0x${string}`,
              debt,
            ],
            chain: sepolia,
          });

          await publicClient?.waitForTransactionReceipt({
            hash: approveHash,
          });
        }
      }

      const payDebtHash = await walletClient.data.writeContract({
        address: process.env
          .NEXT_PUBLIC_SPLIT_CONTRACT_ADDRESS as `0x${string}`,
        abi: SPLIT_MANAGER_ABI,
        functionName: 'payDebt',
        args: [
          splitId,
          creditor as `0x${string}`,
          address as `0x${string}`,
          debt,
        ],
        value: token === 'ETH' ? debt : undefined,
        chain: sepolia,
      });

      const receipt = await publicClient?.waitForTransactionReceipt({
        hash: payDebtHash,
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['debtorDebts', splitId.toString(), address],
        }),
        queryClient.invalidateQueries({
          queryKey: ['splitDetails', splitId.toString()],
        }),
        queryClient.invalidateQueries({
          queryKey: ['splitSpendings', splitId.toString()],
        }),
      ]);

      return receipt;
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

  const bridgeAndExecute = async (
    splitId: bigint,
    creditor: string,
    token: SUPPORTED_TOKENS,
    amount: string
  ) => {
    const allowance = await getAllowance();
    if (
      allowance.find((item) => item.token === token)!.allowance < BigInt(amount)
    ) {
      await setAllowance(BigInt(amount));
    }
    return await nexus.bridgeAndExecute({
      amount: Number(amount),
      toChainId: 11155111 as SUPPORTED_CHAINS_IDS,
      token: token,
      execute: {
        contractAddress: process.env
          .NEXT_PUBLIC_SPLIT_CONTRACT_ADDRESS as `0x${string}`,
        contractAbi: SPLIT_MANAGER_ABI,
        functionName: 'payDebt',
        buildFunctionParams: (token: SUPPORTED_TOKENS, amount: string) => {
          return {
            functionParams: [
              splitId,
              creditor,
              address,
              parseUnits(amount.replace('.', ''), 18).toString(),
            ],
            value:
              token === 'ETH'
                ? parseUnits(amount.replace('.', ''), 18).toString()
                : undefined,
          };
        },
        // ...(token !== 'ETH'
        //   ? {
        //       tokenApproval: {
        //         token: token,
        //         amount: amount,
        //       },
        //     }
        //   : {}),
      },
    });
  };

  const checkBalanceAndPlan = useCallback(
    async (debt: bigint, token: string): Promise<string> => {
      try {
        if (!unifiedBalance) {
          await getUnifiedBalance();
        }

        if (!unifiedBalance) {
          return 'Unable to fetch balance information. Please try again.';
        }

        const tokenBalance = unifiedBalance.find(
          (balance) => balance.symbol.toLowerCase() === token.toLowerCase()
        );

        const sepoliaBalance = tokenBalance?.breakdown.find(
          (item) => item.chain.id === 11155111
        );

        const balanceInWei = BigInt(
          sepoliaBalance?.balance.replace('.', '') || '0'
        );
        const hasEnoughOnSepolia = sepoliaBalance && balanceInWei >= debt;

        if (hasEnoughOnSepolia) {
          return `You have sufficient ${token} balance on Sepolia to pay this debt. No bridging required.`;
        }

        const otherChainsBalances = unifiedBalance.filter(
          (balance) =>
            balance.symbol.toLowerCase() === token.toLowerCase() &&
            balance.breakdown.some((item) => item.chain.id !== 11155111)
        );

        if (otherChainsBalances.length === 0) {
          const totalBalance = unifiedBalance
            .filter((balance) =>
              balance.breakdown.some((item) => item.chain.id !== 11155111)
            )
            .reduce((sum, balance) => sum + BigInt(balance.balance), BigInt(0));

          if (totalBalance < debt) {
            return `Insufficient ${token} balance across all chains. You need ${debt.toString()} but have ${totalBalance.toString()}.`;
          }
        }

        const chainsWithBalances = otherChainsBalances
          .map((balance) => balance.breakdown.map((item) => item.chain.id))
          .flat();
        const availableChains = chainsWithBalances
          .map((chain) => CHAIN_NAMES[chain as keyof typeof CHAIN_NAMES])
          .join(', ');

        const {
          intent: {
            fees: { total: feeAmount },
          },
        } = await getBridgeFees(
          token as SUPPORTED_TOKENS,
          debt.toString(),
          11155111
        );

        return (
          `You need to bridge ${token} from one of these chains: ${availableChains} to Sepolia.\n\n` +
          `Bridge Details:\n` +
          `• Amount: ${formatUnits(debt, getTokenDecimals(token))} ${token}\n` +
          `• Destination: Sepolia\n` +
          `• Estimated Fee: ${feeAmount}\n\n` +
          `After bridging, you'll be able to pay the debt.`
        );
      } catch (error) {
        console.error('Error checking balance and planning:', error);
        return 'Error checking balance. Please try again.';
      }
    },
    [unifiedBalance, nexus]
  );

  return {
    nexus,
    isInitialized,
    error,
    isConnected,
    unifiedBalance,
    getUnifiedBalance,
    initSDK,
    payDebt,
    bridge,
    getBridgeFees,
    isInitializationLoading,
    myIntents,
    getMyIntents,
    checkBalanceAndPlan,
    bridgeAndExecute,
  };
}
