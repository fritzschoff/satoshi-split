'use client';

import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { UserActivityMetrics } from '@/components/dashboard/UserActivityMetrics';
import { UnifiedBalanceSection } from '@/components/dashboard/UnifiedBalanceSection';
import { TransactionMetrics } from '@/components/dashboard/TransactionMetrics';
import { BridgeActivityCard } from '@/components/dashboard/BridgeActivityCard';
import { SplitsList } from '@/components/dashboard/SplitsList';
import { useDashboard } from '@/hooks/useDashboard';

export default function DashboardPage() {
  const {
    address,
    isConnected,
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
  } = useDashboard();

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
