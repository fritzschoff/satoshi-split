import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatTokenAmount } from '@/utils/token';

interface SplitOverviewProps {
  totalDebt: string;
  members: string[];
  spendings: number;
  tokenSymbol: string;
  tokenDecimals: number;
  createdAt: string;
}

export function SplitOverview({
  totalDebt,
  members,
  spendings,
  tokenSymbol,
  tokenDecimals,
  createdAt,
}: SplitOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Split Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Total Outstanding Debt
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">
              {formatTokenAmount(totalDebt, tokenDecimals)} {tokenSymbol}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Members
              </div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">
                {members.length}
              </div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Expenses
              </div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">
                {spendings}
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Created:{' '}
              {new Date(Number(createdAt) * 1000).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
