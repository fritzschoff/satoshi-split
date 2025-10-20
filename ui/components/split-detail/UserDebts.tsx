import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Debt } from '@/types/web3';
import {
  getTokenSymbol,
  getTokenDecimals,
  formatTokenAmount,
} from '@/utils/token';

interface UserDebtsProps {
  debts: Debt[];
  defaultToken: string;
  isPayingDebt: boolean;
  isConfirmingPayment: boolean;
  isApprovingExpense: boolean;
  isConfirmingApproval: boolean;
  approveError: Error | null;
  isApprovalSuccess: boolean;
  paymentError: Error | null;
  isPaymentSuccess: boolean;
  onPayDebt: (creditor: string, amount: string, isETH: boolean) => void;
}

export function UserDebts({
  debts,
  defaultToken,
  isPayingDebt,
  isConfirmingPayment,
  isApprovingExpense,
  isConfirmingApproval,
  approveError,
  isApprovalSuccess,
  paymentError,
  isPaymentSuccess,
  onPayDebt,
}: UserDebtsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Debts</CardTitle>
      </CardHeader>
      <CardContent>
        {approveError && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              Approval Error: {approveError.message}
            </p>
          </div>
        )}

        {isApprovalSuccess && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✅ Token approval successful!
            </p>
          </div>
        )}

        {paymentError && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              Error: {paymentError.message}
            </p>
          </div>
        )}

        {isPaymentSuccess && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✅ Debt payment successful!
            </p>
          </div>
        )}

        {debts && debts.length > 0 ? (
          <div className="space-y-3">
            {debts.map((debt) => {
              const debtSymbol = getTokenSymbol(debt.token || defaultToken);
              const debtDecimals = getTokenDecimals(debt.token || defaultToken);
              const isETH =
                (debt.token || defaultToken) ===
                '0x0000000000000000000000000000000000000000';

              return (
                <div
                  key={debt.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      You owe
                    </div>
                    <div className="font-mono text-sm mt-1">
                      {debt.creditor.slice(0, 6)}...
                      {debt.creditor.slice(-4)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-gray-900 dark:text-white">
                      {formatTokenAmount(debt.amount, debtDecimals)}{' '}
                      {debtSymbol}
                    </div>
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        onPayDebt(debt.creditor, debt.amount, isETH)
                      }
                      isLoading={
                        isPayingDebt ||
                        isConfirmingPayment ||
                        isApprovingExpense ||
                        isConfirmingApproval
                      }
                      disabled={
                        isPayingDebt ||
                        isConfirmingPayment ||
                        isApprovingExpense ||
                        isConfirmingApproval
                      }
                    >
                      {isApprovingExpense || isConfirmingApproval
                        ? 'Approving...'
                        : 'Pay Debt'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-gray-600 dark:text-gray-400 py-8">
            You have no outstanding debts
          </p>
        )}
      </CardContent>
    </Card>
  );
}
