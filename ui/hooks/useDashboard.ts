import { useState } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { SUPPORTED_TOKENS } from '@avail-project/nexus-widgets';
import {
  useGetUserActivity,
  useGetUserSplits,
  useGetBridgeActivity,
} from './useGraphQLQueries';
import { useGetNexus } from './useGetNexus';

export function useDashboard() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  const { data: userActivity = null, isLoading: isLoadingActivity } =
    useGetUserActivity(address);
  const { data: splits = [], isLoading: isLoadingSplits } =
    useGetUserSplits(address);
  const { data: bridgeActivity = null, isLoading: isLoadingBridge } =
    useGetBridgeActivity(address);

  const isLoading = isLoadingActivity || isLoadingSplits || isLoadingBridge;

  const {
    unifiedBalance,
    initSDK,
    isInitialized,
    error,
    bridge,
    getBridgeFees,
  } = useGetNexus();

  const [selectedToken, setSelectedToken] = useState<SUPPORTED_TOKENS | null>(
    null
  );
  const [sourceChainId, setSourceChainId] = useState<number | null>(null);
  const [destinationChainId, setDestinationChainId] = useState<number | null>(
    null
  );
  const [bridgeAmount, setBridgeAmount] = useState<string>('');
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeError, setBridgeError] = useState<string | null>(null);

  const handleSourceChainChange = async (newChainId: number) => {
    setSourceChainId(newChainId);
    if (chainId !== newChainId && switchChain) {
      try {
        switchChain({ chainId: newChainId });
      } catch (error) {
        console.error('Error switching chain:', error);
        setBridgeError('Failed to switch chain');
      }
    }
  };

  const handleMaxAmount = async () => {
    if (selectedToken && sourceChainId && unifiedBalance) {
      const tokenBalance = unifiedBalance.find(
        (balance) => balance.symbol === selectedToken
      );
      const chainBalance = tokenBalance?.breakdown?.find(
        (item) => item.chain.id === sourceChainId
      );
      if (chainBalance) {
        const isETH = selectedToken.toUpperCase() === 'ETH';
        const isUSDC = selectedToken.toUpperCase() === 'USDC';

        if (isUSDC) {
          setBridgeAmount(chainBalance.balance);
        } else if (isETH) {
          const {
            intent: {
              fees: { total },
            },
          } = await getBridgeFees(
            selectedToken,
            (parseFloat(chainBalance.balance) - 1000000).toString(),
            sourceChainId
          );
          const parsedTotal = parseFloat(total);
          const balance = parseFloat(chainBalance.balance) - parsedTotal;
          if (balance < 0) {
            setBridgeError('Insufficient balance');
            return;
          }
          const maxAmount = Math.max(0, balance - parsedTotal);
          setBridgeAmount(maxAmount.toString());
        } else {
          setBridgeAmount(chainBalance.balance);
        }
      }
    }
  };

  const handleBridge = async () => {
    if (
      !selectedToken ||
      !sourceChainId ||
      !destinationChainId ||
      !bridgeAmount
    ) {
      setBridgeError('Please fill all fields');
      return;
    }

    if (chainId !== sourceChainId) {
      setBridgeError('Please switch to the source chain first');
      return;
    }

    setIsBridging(true);
    setBridgeError(null);
    console.log(selectedToken, bridgeAmount, destinationChainId);
    try {
      await bridge(selectedToken, bridgeAmount, destinationChainId);
      setBridgeAmount('');
      setSelectedToken(null);
      setSourceChainId(null);
      setDestinationChainId(null);
    } catch (error) {
      console.error('Bridge error:', error);
      setBridgeError(
        error instanceof Error ? error.message : 'Failed to bridge'
      );
    } finally {
      setIsBridging(false);
    }
  };

  return {
    address,
    isConnected,
    chainId,
    userActivity,
    splits,
    bridgeActivity,
    isLoading,
    unifiedBalance,
    initSDK,
    isInitialized,
    error,
    selectedToken,
    setSelectedToken,
    sourceChainId,
    setSourceChainId,
    destinationChainId,
    setDestinationChainId,
    bridgeAmount,
    setBridgeAmount,
    isBridging,
    bridgeError,
    handleSourceChainChange,
    handleMaxAmount,
    handleBridge,
  };
}
