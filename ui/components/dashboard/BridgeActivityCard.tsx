import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BridgeActivity } from '@/types/web3';
import { CHAIN_NAMES } from '@/constants/chains';
import {
  getTokenSymbol,
  getTokenDecimals,
  formatTokenAmount,
} from '@/utils/token';

interface BridgeActivityCardProps {
  bridgeActivity: BridgeActivity;
}

const ITEMS_PER_PAGE = 5;

export function BridgeActivityCard({
  bridgeActivity,
}: BridgeActivityCardProps) {
  const [depositPage, setDepositPage] = useState(0);
  const [withdrawPage, setWithdrawPage] = useState(0);
  const [fillPage, setFillPage] = useState(0);

  const getExplorerUrl = (chainId: number, txHash: string) => {
    const explorers: Record<number, string> = {
      11155111: 'https://sepolia.etherscan.io',
      84532: 'https://sepolia.basescan.org',
      421614: 'https://sepolia.arbiscan.io',
      11155420: 'https://sepolia.optimistic.etherscan.io',
    };
    return `${explorers[chainId] || 'https://etherscan.io'}/tx/${txHash}`;
  };

  const getChainName = (chainId: number) => {
    return (
      (CHAIN_NAMES as Record<number, string>)[chainId] || `Chain ${chainId}`
    );
  };

  const getPaginatedItems = <T,>(items: T[], page: number) => {
    const start = page * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return items.slice(start, end);
  };

  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / ITEMS_PER_PAGE);
  };

  const renderPagination = (
    totalItems: number,
    currentPage: number,
    onPageChange: (page: number) => void
  ) => {
    const totalPages = getTotalPages(totalItems);
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Showing {currentPage * ITEMS_PER_PAGE + 1} -{' '}
          {Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalItems)} of{' '}
          {totalItems}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bridge Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {bridgeActivity.BridgeDeposit.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Bridge Deposits
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Initiated cross-chain transfers from{' '}
                {getChainName(bridgeActivity.BridgeDeposit[0].chainId)}
              </p>
              <div className="space-y-2">
                {getPaginatedItems(
                  bridgeActivity.BridgeDeposit,
                  depositPage
                ).map((deposit) => (
                  <div
                    key={deposit.id}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-purple-50 dark:bg-purple-900/10"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          Deposit to {getChainName(deposit.chainId)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          From: {deposit.from.slice(0, 6)}...
                          {deposit.from.slice(-4)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Request: {deposit.requestHash.slice(0, 10)}...
                          {deposit.requestHash.slice(-8)} •{' '}
                          {deposit.gasRefunded ? (
                            <span className="text-green-600 dark:text-green-400">
                              Gas Refunded
                            </span>
                          ) : (
                            <span className="text-gray-500">
                              Pending Refund
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
                        href={getExplorerUrl(deposit.chainId, deposit.txHash)}
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
              {renderPagination(
                bridgeActivity.BridgeDeposit.length,
                depositPage,
                setDepositPage
              )}
            </div>
          )}

          {bridgeActivity.BridgeWithdraw.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Bridge Withdrawals
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Completed cross-chain transfers received
              </p>
              <div className="space-y-2">
                {getPaginatedItems(
                  bridgeActivity.BridgeWithdraw,
                  withdrawPage
                ).map((withdraw) => {
                  const tokenSymbol = getTokenSymbol(withdraw.token);
                  const tokenDecimals = getTokenDecimals(withdraw.token);
                  const formattedAmount = formatTokenAmount(
                    withdraw.amount,
                    tokenDecimals
                  );

                  return (
                    <div
                      key={withdraw.id}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-green-50 dark:bg-green-900/10"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            Received {formattedAmount} {tokenSymbol}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            To: {withdraw.to.slice(0, 6)}...
                            {withdraw.to.slice(-4)} on{' '}
                            {getChainName(withdraw.chainId)}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Token: {withdraw.token.slice(0, 6)}...
                            {withdraw.token.slice(-4)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(
                              Number(withdraw.timestamp) * 1000
                            ).toLocaleString()}
                          </div>
                        </div>
                        <a
                          href={getExplorerUrl(
                            withdraw.chainId,
                            withdraw.txHash
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View Tx →
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
              {renderPagination(
                bridgeActivity.BridgeWithdraw.length,
                withdrawPage,
                setWithdrawPage
              )}
            </div>
          )}

          {bridgeActivity.BridgeFill.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Solver Fills
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Bridge requests fulfilled by solvers on destination chain
              </p>
              <div className="space-y-2">
                {getPaginatedItems(bridgeActivity.BridgeFill, fillPage).map(
                  (fill) => (
                    <div
                      key={fill.id}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-blue-50 dark:bg-blue-900/20"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            Filled on {getChainName(fill.chainId)}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Solver: {fill.solver.slice(0, 6)}...
                            {fill.solver.slice(-4)}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            From: {fill.from.slice(0, 6)}...
                            {fill.from.slice(-4)}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Request: {fill.requestHash.slice(0, 10)}...
                            {fill.requestHash.slice(-8)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(
                              Number(fill.timestamp) * 1000
                            ).toLocaleString()}
                          </div>
                        </div>
                        <a
                          href={getExplorerUrl(fill.chainId, fill.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View Tx →
                        </a>
                      </div>
                    </div>
                  )
                )}
              </div>
              {renderPagination(
                bridgeActivity.BridgeFill.length,
                fillPage,
                setFillPage
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
