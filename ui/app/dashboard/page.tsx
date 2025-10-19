'use client';

import { useAccount, useSwitchChain } from 'wagmi';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  graphqlClient,
  getUserActivityQuery,
  getUserSplitsQuery,
  getUserBridgeActivityQuery,
} from '@/lib/graphql-client';
import { BridgeActivity, Split, UserActivity } from '@/types/web3';
import { useGetNexus } from '@/hooks/useGetNexus';
import { SUPPORTED_TOKENS } from '@avail-project/nexus-widgets';
import { UserActivityMetrics } from '@/components/dashboard/UserActivityMetrics';
import { UnifiedBalanceSection } from '@/components/dashboard/UnifiedBalanceSection';
import { TransactionMetrics } from '@/components/dashboard/TransactionMetrics';
import { BridgeActivityCard } from '@/components/dashboard/BridgeActivityCard';
import { SplitsList } from '@/components/dashboard/SplitsList';

export default function DashboardPage() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [splits, setSplits] = useState<Split[]>([]);
  const [bridgeActivity, setBridgeActivity] = useState<BridgeActivity | null>(
    null
  );

  const [isLoading, setIsLoading] = useState(true);
  const { unifiedBalance, initSDK, isInitialized, error, bridge } =
    useGetNexus();

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

  useEffect(() => {
    async function fetchData() {
      if (!address) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const lowerAddress = address.toLowerCase();

        const activityData: Record<'UserActivity', UserActivity[]> =
          await graphqlClient.request(getUserActivityQuery, {
            address: lowerAddress,
          });

        if (activityData?.UserActivity) {
          setUserActivity(activityData.UserActivity[0]);
        }

        const splitsData: Record<'Split', Split[]> =
          await graphqlClient.request(getUserSplitsQuery, {
            address: lowerAddress,
          });

        if (splitsData?.Split) {
          setSplits(splitsData.Split);
        }

        const bridgeData: BridgeActivity = await graphqlClient.request(
          getUserBridgeActivityQuery,
          {
            address: lowerAddress,
            limit: 10,
          }
        );

        if (bridgeData) {
          setBridgeActivity(bridgeData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [address]);

  const handleSourceChainChange = async (newChainId: number) => {
    setSourceChainId(newChainId);
    if (chainId !== newChainId && switchChain) {
      try {
        await switchChain({ chainId: newChainId });
      } catch (error) {
        console.error('Error switching chain:', error);
        setBridgeError('Failed to switch chain');
      }
    }
  };

  const handleMaxAmount = () => {
    if (selectedToken && sourceChainId && unifiedBalance) {
      const tokenBalance = unifiedBalance.find(
        (balance) => balance.symbol === selectedToken
      );
      const chainBalance = tokenBalance?.breakdown?.find(
        (item) => item.chain.id === sourceChainId
      );
      if (chainBalance) {
        setBridgeAmount(chainBalance.balance);
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

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Please connect your wallet to view your dashboard
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <Link href="/create-split">
            <Button>Create New Split</Button>
          </Link>
        </div>

        <UserActivityMetrics userActivity={userActivity} />

        <UnifiedBalanceSection
          unifiedBalance={unifiedBalance}
          isInitialized={isInitialized}
          error={error}
          selectedToken={selectedToken}
          sourceChainId={sourceChainId}
          destinationChainId={destinationChainId}
          bridgeAmount={bridgeAmount}
          isBridging={isBridging}
          bridgeError={bridgeError}
          onInitSDK={initSDK}
          onSetSelectedToken={setSelectedToken}
          onSetSourceChainId={setSourceChainId}
          onSetDestinationChainId={setDestinationChainId}
          onSetBridgeAmount={setBridgeAmount}
          onMaxAmount={handleMaxAmount}
          onBridge={handleBridge}
          onSourceChainChange={handleSourceChainChange}
        />

        <TransactionMetrics
          userActivity={userActivity}
          splits={splits}
          bridgeActivity={bridgeActivity}
        />

        {bridgeActivity &&
          (bridgeActivity.BridgeDeposit.length > 0 ||
            bridgeActivity.BridgeFill.length > 0 ||
            bridgeActivity.BridgeWithdraw.length > 0) && (
            <div className="mb-8">
              <BridgeActivityCard bridgeActivity={bridgeActivity} />
            </div>
          )}

        <SplitsList splits={splits} currentAddress={address} />
      </div>
    </div>
  );
}
