import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  getTokenDecimals,
  formatTokenAmount,
  getTokenSymbol,
} from '@/utils/token';
import { useDebtorDebts } from '@/hooks/useSplitManager';
import { useAccount } from 'wagmi';
import { useGetNexus } from '@/hooks/useGetNexus';
import { SUPPORTED_TOKENS } from '@avail-project/nexus-widgets';
import { useState } from 'react';

interface UserDebtsProps {
  splitId: bigint;
  defaultToken: string;
  isPayingDebt: boolean;
  isConfirmingPayment: boolean;
  approveError: Error | null;
  isApprovalSuccess: boolean;
  paymentError: Error | null;
  isPaymentSuccess: boolean;
}

export function UserDebts({
  splitId,
  defaultToken,
  isPayingDebt,
  isConfirmingPayment,
  approveError,
  isApprovalSuccess,
  paymentError,
  isPaymentSuccess,
}: UserDebtsProps) {
  const { address } = useAccount();
  const { data: debts } = useDebtorDebts(splitId, address);
  const { payDebt, initSDK, isInitializationLoading, isInitialized } =
    useGetNexus();
  const [creditors, amounts] = debts || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Debts</CardTitle>
      </CardHeader>
      <CardContent>
        {approveError && (
          <div
            className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-h-40 overflow-y-auto"
            style={{ wordBreak: 'break-word', whiteSpace: 'pre-line' }}
          >
            <p className="text-sm text-red-800 dark:text-red-200 break-words">
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
          <div
            className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-h-40 overflow-y-auto"
            style={{ wordBreak: 'break-word', whiteSpace: 'pre-line' }}
          >
            <p className="text-sm text-red-800 dark:text-red-200 break-words">
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

        {!isInitialized && address && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                The payment system needs to be initialized before you can pay
                your debts.
                <br />
                This connects to the payment infrastructure for your wallet in
                the browser.
                <br />
                Click the button below to initialize and enable payments.
              </p>
            </div>
            <Button
              size="sm"
              className="ml-2"
              onClick={async () => {
                await initSDK();
              }}
              isLoading={isInitializationLoading}
              disabled={isInitializationLoading}
            >
              {isInitializationLoading
                ? 'Initializing...'
                : 'Initialize Payments'}
            </Button>
          </div>
        )}

        {isInitializationLoading && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              🔄 Initializing payment system...
            </p>
          </div>
        )}

        {isInitialized &&
        amounts &&
        amounts.length > 0 &&
        creditors &&
        creditors.length > 0 ? (
          <div className="space-y-3">
            {creditors.map((creditor, index) => (
              <div
                key={creditor || 'creditor'}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    You owe
                  </div>
                  <div className="font-mono text-sm mt-1">
                    {creditor?.slice(0, 6)}...
                    {creditor?.slice(-4)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-gray-900 dark:text-white">
                    {formatTokenAmount(
                      amounts[index]?.toString() || '0',
                      getTokenDecimals(defaultToken)
                    )}{' '}
                    {getTokenSymbol(defaultToken)}
                  </div>

                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() =>
                      payDebt(
                        getTokenSymbol(defaultToken) as SUPPORTED_TOKENS,
                        amounts[index] || BigInt(0),
                        splitId,
                        creditor
                      )
                    }
                    isLoading={isPayingDebt || isConfirmingPayment}
                    disabled={isPayingDebt || isConfirmingPayment}
                  >
                    {isPayingDebt || isConfirmingPayment
                      ? 'Paying...'
                      : !isInitialized
                      ? 'Initializing...'
                      : 'Pay Debt'}
                  </Button>
                </div>
              </div>
            ))}
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
