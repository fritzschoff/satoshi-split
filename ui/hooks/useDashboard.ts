import { useMemo, useState } from 'react';
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

  const {
    unifiedBalance,
    initSDK,
    isInitialized,
    error,
    bridge,
    getBridgeFees,
    isInitializationLoading,
    myIntents,
  } = useGetNexus();

  const isLoading = isLoadingActivity || isLoadingSplits || isLoadingBridge;

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
        const {
          intent: {
            fees: { total },
          },
        } = await getBridgeFees(
          selectedToken,
          chainBalance.balance.toString(),
          sourceChainId
        );
        const maxAmount = Math.max(
          0,
          parseFloat(chainBalance.balance) - parseFloat(total)
        );
        setBridgeAmount(maxAmount.toString());
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
    try {
      const result = await bridge(
        selectedToken,
        bridgeAmount,
        destinationChainId
      );
      console.log(result);
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

  const bridgeActivityWithIntents = useMemo(() => {
    if (!myIntents || myIntents.length === 0 || !bridgeActivity)
      return bridgeActivity;

    const existingDepositsMap = new Map(
      bridgeActivity.BridgeDeposit.map((deposit) => [deposit.id, deposit])
    );

    const enrichedDeposits = myIntents.map((intent) => {
      const existingActivity = existingDepositsMap.get(intent.id.toString());

      const totalSourceAmount = intent.sources.reduce(
        (sum, source) => sum + source.value,
        BigInt(0)
      );
      const sourceChainIds = intent.sources.map((s) => s.chainID);
      const primarySourceChainId = sourceChainIds[0] || 0;

      const totalDestinationAmount = intent.destinations.reduce(
        (sum, dest) => sum + dest.value,
        BigInt(0)
      );

      const status = intent.fulfilled
        ? 'Fulfilled'
        : intent.refunded
        ? 'Refunded'
        : intent.deposited
        ? 'Deposited'
        : 'Pending';
      if (existingActivity) {
        return {
          ...existingActivity,
          intentId: intent.id.toString(),
          status,
          isPending: !intent.fulfilled && !intent.refunded,
          isFulfilled: intent.fulfilled,
          isDeposited: intent.deposited,
          isRefunded: intent.refunded,
          sourceChainIds,
          primarySourceChainId,
          sources: intent.sources.map((s) => ({
            chainId: s.chainID,
            tokenAddress: s.tokenAddress,
            amount: s.value.toString(),
            universe: s.universe,
          })),
          destinationChainId: intent.destinationChainID,
          destinationUniverse: intent.destinationUniverse,
          destinations: intent.destinations.map((d) => ({
            tokenAddress: d.tokenAddress,
            amount: d.value.toString(),
          })),
          sourceAmount: totalSourceAmount.toString(),
          destinationAmount: totalDestinationAmount.toString(),
          expiry: intent.expiry,
          expiryDate: new Date(intent.expiry * 1000).toISOString(),
        };
      } else {
        return {
          id: intent.id.toString(),
          intentId: intent.id.toString(),
          requestHash: '',
          from: address || '',
          gasRefunded: false,
          timestamp: 'not found',
          blockNumber: '0',
          txHash: '',
          chainId: primarySourceChainId,
          status,
          isPending: !intent.fulfilled && !intent.refunded,
          isFulfilled: intent.fulfilled,
          isDeposited: intent.deposited,
          isRefunded: intent.refunded,
          sourceChainIds,
          primarySourceChainId,
          sources: intent.sources.map((s) => ({
            chainId: s.chainID,
            tokenAddress: s.tokenAddress,
            amount: s.value.toString(),
            universe: s.universe,
          })),
          destinationChainId: intent.destinationChainID,
          destinationUniverse: intent.destinationUniverse,
          destinations: intent.destinations.map((d) => ({
            tokenAddress: d.tokenAddress,
            amount: d.value.toString(),
          })),
          sourceAmount: totalSourceAmount.toString(),
          destinationAmount: totalDestinationAmount.toString(),
          expiry: intent.expiry,
          expiryDate: new Date(intent.expiry * 1000).toISOString(),
        };
      }
    });

    const existingIds = new Set(enrichedDeposits.map((d) => d.id));
    const nonIntentDeposits = bridgeActivity.BridgeDeposit.filter(
      (deposit) => !existingIds.has(deposit.id)
    );

    const updatedBridgeActivity = {
      ...bridgeActivity,
      BridgeDeposit: [...enrichedDeposits, ...nonIntentDeposits].sort(
        (a, b) => {
          const timeA = new Date(a.timestamp || 0).getTime();
          const timeB = new Date(b.timestamp || 0).getTime();
          return timeB - timeA;
        }
      ),
    };

    return updatedBridgeActivity;
  }, [bridgeActivity, myIntents, address]);

  return {
    address,
    isConnected,
    chainId,
    userActivity,
    splits,
    bridgeActivity: bridgeActivityWithIntents,
    isLoading,
    unifiedBalance,
    initSDK,
    isInitialized,
    error,
    selectedToken,
    setSelectedToken,
    sourceChainId,
    destinationChainId,
    setDestinationChainId,
    bridgeAmount,
    setBridgeAmount,
    isBridging,
    bridgeError,
    handleSourceChainChange,
    handleMaxAmount,
    handleBridge,
    isInitializationLoading,
    myIntents,
  };
}
