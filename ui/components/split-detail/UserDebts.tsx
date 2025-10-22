import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getTokenDecimals, formatTokenAmount } from '@/utils/token';
import { useDebtorDebts } from '@/hooks/useSplitManager';
import { useAccount } from 'wagmi';
import { zeroAddress } from 'viem';

interface UserDebtsProps {
  splitId: bigint;
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
  splitId,
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
  const { address } = useAccount();
  const { data: debts } = useDebtorDebts(splitId, address);
  const creditors = debts?.creditors || [];
  const amounts = debts?.amounts || [];
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

        {creditors && creditors.length > 0 ? (
          <div className="space-y-3">
            {creditors.map((creditor, index) => {
              return (
                <div
                  key={creditor.concat(index.toString())}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      You owe
                    </div>
                    <div className="font-mono text-sm mt-1">
                      {creditor.slice(0, 6)}...
                      {creditor.slice(-4)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-gray-900 dark:text-white">
                      {formatTokenAmount(
                        amounts[index].toString(),
                        getTokenDecimals(defaultToken)
                      )}{' '}
                      {defaultToken}
                    </div>
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        onPayDebt(
                          creditor,
                          amounts[index].toString(),
                          defaultToken === zeroAddress
                        )
                      }
                      isLoading={isPayingDebt || isConfirmingPayment}
                      disabled={isPayingDebt || isConfirmingPayment}
                    >
                      {isPayingDebt || isConfirmingPayment
                        ? 'Paying...'
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
