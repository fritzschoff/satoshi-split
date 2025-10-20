import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Spending } from '@/types/web3';
import {
  getTokenSymbol,
  getTokenDecimals,
  formatTokenAmount,
} from '@/utils/token';

interface ExpensesHistoryProps {
  spendings: Spending[];
  defaultToken: string;
}

export function ExpensesHistory({
  spendings,
  defaultToken,
}: ExpensesHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses History</CardTitle>
      </CardHeader>
      <CardContent>
        {spendings.length > 0 ? (
          <div className="space-y-3">
            {spendings.map((spending) => {
              const spendingSymbol = getTokenSymbol(
                spending.token || defaultToken
              );
              const spendingDecimals = getTokenDecimals(
                spending.token || defaultToken
              );

              return (
                <div
                  key={spending.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {spending.title}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Paid by {spending.payer.slice(0, 6)}...
                        {spending.payer.slice(-4)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-gray-900 dark:text-white">
                        {formatTokenAmount(spending.amount, spendingDecimals)}{' '}
                        {spendingSymbol}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(
                          Number(spending.timestamp) * 1000
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Split among {spending.forWho.length} members
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-gray-600 dark:text-gray-400 py-8">
            No expenses yet. Add the first expense above!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
