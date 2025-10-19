import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BridgeActivity } from '@/types/web3';

interface BridgeActivityCardProps {
  bridgeActivity: BridgeActivity;
}

export function BridgeActivityCard({
  bridgeActivity,
}: BridgeActivityCardProps) {
  const getExplorerUrl = (chainId: number, txHash: string) => {
    const explorers: Record<number, string> = {
      11155111: 'https://sepolia.etherscan.io',
      84532: 'https://sepolia.basescan.org',
      421614: 'https://sepolia.arbiscan.io',
      80002: 'https://amoy.scrollscan.com',
      11155420: 'https://sepolia.optimistic.etherscan.io',
    };
    return `${explorers[chainId] || 'https://etherscan.io'}/tx/${txHash}`;
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
                            <span className="text-gray-500">No Refund</span>
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
                          Amount: {(Number(withdraw.amount) / 1e18).toFixed(6)}
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
                        href={getExplorerUrl(withdraw.chainId, withdraw.txHash)}
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
                        href={getExplorerUrl(fill.chainId, fill.txHash)}
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
  );
}
