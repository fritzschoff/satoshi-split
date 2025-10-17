'use client';

import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
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
import Image from 'next/image';
import {
  SUPPORTED_CHAINS,
  SUPPORTED_TOKENS_BY_SYMBOL,
} from '@/constants/tokens';

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [splits, setSplits] = useState<Split[]>([]);
  const [bridgeActivity, setBridgeActivity] = useState<BridgeActivity | null>(
    null
  );

  const [isLoading, setIsLoading] = useState(true);
  const {
    unifiedBalance,
    initSDK,
    isInitialized,
    error,
    simulateBridgeAndExecute,
    bridgeAndExecute,
    bridge,
    simulateBridge,
  } = useGetNexus();
  console.log(unifiedBalance);
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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Spent (ETH)
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {userActivity
                  ? `${(Number(userActivity.totalSpentETH) / 1e18).toFixed(
                      4
                    )} ETH`
                  : '0.0000 ETH'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Spent (USD)
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {userActivity
                  ? `$${(Number(userActivity.totalSpentUSD) / 1e6).toFixed(2)}`
                  : '$0.00'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Received (ETH)
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {userActivity
                  ? `${(Number(userActivity.totalReceivedETH) / 1e18).toFixed(
                      4
                    )} ETH`
                  : '0.0000 ETH'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Received (USD)
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {userActivity
                  ? `$${(Number(userActivity.totalReceivedUSD) / 1e6).toFixed(
                      2
                    )}`
                  : '$0.00'}
              </div>
            </CardContent>
          </Card>
        </div>
        {isInitialized ? (
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Balance (ETH)
                </div>
                <div className="text-[10px] text-gray-600 dark:text-gray-400 mb-1">
                  provided by Avail Nexus SDK
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {unifiedBalance?.find((balance) => balance.symbol === 'ETH')
                    ?.balance ?? '0'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Balance (USD)
                </div>
                <div className="text-[10px] text-gray-600 dark:text-gray-400 mb-1">
                  provided by Avail Nexus SDK
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {`$${Number(
                    (unifiedBalance?.find(
                      (balance) => balance.symbol === 'USDC'
                    )?.balanceInFiat ?? 0) +
                      (unifiedBalance?.find(
                        (balance) => balance.symbol === 'USDT'
                      )?.balanceInFiat ?? 0)
                  ).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                </div>
              </CardContent>
            </Card>

            {unifiedBalance
              ?.filter((balance) =>
                SUPPORTED_TOKENS_BY_SYMBOL.includes(
                  balance.symbol as (typeof SUPPORTED_TOKENS_BY_SYMBOL)[number]
                )
              )
              .map((balance) => (
                <Card key={balance.symbol}>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Token Symbol
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      {balance.symbol}
                    </div>

                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          Balance
                        </div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {balance.balance}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          Balance in Fiat
                        </div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          $
                          {Number(balance.balanceInFiat).toLocaleString(
                            'en-US',
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          Icon
                        </div>
                        <Image
                          src={balance.icon ?? ''}
                          alt={balance.symbol ?? ''}
                          width={20}
                          height={20}
                        />
                      </div>

                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          Decimals
                        </div>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {balance.decimals}
                        </div>
                      </div>

                      {balance.breakdown && balance.breakdown.length > 0 && (
                        <details className="mt-4">
                          <summary className="cursor-pointer text-xs text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                            View Breakdown (
                            {
                              balance.breakdown.filter(
                                (item) =>
                                  SUPPORTED_CHAINS.includes(item.chain.id) &&
                                  SUPPORTED_TOKENS_BY_SYMBOL.includes(
                                    balance.symbol as (typeof SUPPORTED_TOKENS_BY_SYMBOL)[number]
                                  )
                              ).length
                            }{' '}
                            chains)
                          </summary>
                          <div className="mt-2 space-y-2 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
                            {balance.breakdown
                              .filter(
                                (item) =>
                                  SUPPORTED_CHAINS.includes(item.chain.id) &&
                                  SUPPORTED_TOKENS_BY_SYMBOL.includes(
                                    balance.symbol as (typeof SUPPORTED_TOKENS_BY_SYMBOL)[number]
                                  )
                              )
                              .map((item, index) => (
                                <div
                                  key={index}
                                  className="text-xs space-y-1 pb-2"
                                >
                                  <div className="font-medium text-gray-700 dark:text-gray-300">
                                    {item.chain.name}
                                  </div>
                                  <div className="text-gray-600 dark:text-gray-400">
                                    Balance: {item.balance}{' '}
                                  </div>
                                  <div className="text-gray-600 dark:text-gray-400">
                                    Fiat: $
                                    {Number(item.balanceInFiat).toLocaleString(
                                      'en-US',
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </details>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-full mb-8">
            <p className="text-red-500">{error.message}</p>
          </div>
        ) : (
          <div className="flex justify-center items-center h-full mb-8">
            <Button onClick={initSDK}>Sign Message to fetch balances</Button>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Transactions
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {userActivity?.transactionCount || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Active Splits
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {splits.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Bridge Deposits
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {bridgeActivity?.BridgeDeposit.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Bridge Withdrawals
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {bridgeActivity?.BridgeWithdraw.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {bridgeActivity &&
          (bridgeActivity.BridgeDeposit.length > 0 ||
            bridgeActivity.BridgeFill.length > 0 ||
            bridgeActivity.BridgeWithdraw.length > 0) && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Bridge Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {bridgeActivity.BridgeDeposit.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Recent Deposits
                      </h3>
                      <div className="space-y-2">
                        {bridgeActivity.BridgeDeposit.map((deposit) => (
                          <div
                            key={deposit.id}
                            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  Request: {deposit.requestHash.slice(0, 10)}...
                                  {deposit.requestHash.slice(-8)}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  Chain ID: {deposit.chainId} •{' '}
                                  {deposit.gasRefunded ? (
                                    <span className="text-green-600 dark:text-green-400">
                                      Gas Refunded
                                    </span>
                                  ) : (
                                    <span className="text-gray-500">
                                      No Refund
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {new Date(
                                    Number(deposit.timestamp) * 1000
                                  ).toLocaleString()}
                                </div>
                              </div>
                              <a
                                href={`https://etherscan.io/tx/${deposit.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                View Tx →
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {bridgeActivity.BridgeWithdraw.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Recent Withdrawals
                      </h3>
                      <div className="space-y-2">
                        {bridgeActivity.BridgeWithdraw.map((withdraw) => (
                          <div
                            key={withdraw.id}
                            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  Amount:{' '}
                                  {(Number(withdraw.amount) / 1e18).toFixed(6)}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  Token: {withdraw.token.slice(0, 6)}...
                                  {withdraw.token.slice(-4)}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  Chain ID: {withdraw.chainId}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {new Date(
                                    Number(withdraw.timestamp) * 1000
                                  ).toLocaleString()}
                                </div>
                              </div>
                              <a
                                href={`https://etherscan.io/tx/${withdraw.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                View Tx →
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {bridgeActivity.BridgeFill.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Solver Fills
                      </h3>
                      <div className="space-y-2">
                        {bridgeActivity.BridgeFill.map((fill) => (
                          <div
                            key={fill.id}
                            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-blue-50 dark:bg-blue-900/20"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  Request: {fill.requestHash.slice(0, 10)}...
                                  {fill.requestHash.slice(-8)}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  Chain ID: {fill.chainId}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {new Date(
                                    Number(fill.timestamp) * 1000
                                  ).toLocaleString()}
                                </div>
                              </div>
                              <a
                                href={`${
                                  fill.chainId === 11155111
                                    ? 'https://sepolia.etherscan.io'
                                    : fill.chainId === 84532
                                    ? 'https://sepolia.basescan.org'
                                    : fill.chainId === 421614
                                    ? 'https://sepolia.arbiscan.io'
                                    : fill.chainId === 80002
                                    ? 'https://amoy.scrollscan.com'
                                    : fill.chainId === 11155420
                                    ? 'https://sepolia.optimistic.etherscan.io'
                                    : 'https://etherscan.io'
                                }/tx/${fill.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                View Tx →
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        <Card>
          <CardHeader>
            <CardTitle>Your Splits</CardTitle>
          </CardHeader>
          <CardContent>
            {splits.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You haven't created or joined any splits yet
                </p>
                <Link href="/create-split">
                  <Button variant="secondary">Create Your First Split</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {splits.map((split) => (
                  <Link
                    key={split.id}
                    href={`/split/${split.id}`}
                    className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          Split #{split.id}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {split.members.length} members
                          {split.creator.toLowerCase() ===
                            address?.toLowerCase() && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Total Debt
                        </div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          ${(Number(split.totalDebt) / 1e6).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
