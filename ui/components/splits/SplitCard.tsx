import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Split } from '@/types/web3';
import Link from 'next/link';
import { TOKEN_SYMBOLS } from '@/constants/tokens';

interface SplitCardProps {
  split: Split;
  currentAddress?: string;
}

export function SplitCard({ split, currentAddress }: SplitCardProps) {
  const isCreator =
    split.creator.toLowerCase() === currentAddress?.toLowerCase();
  const isMember = split.members.some(
    (member) => member.toLowerCase() === currentAddress?.toLowerCase()
  );

  const tokenSymbol =
    TOKEN_SYMBOLS[split.defaultToken.toLowerCase()] || 'Unknown';
  const unpaidDebts = split.debts?.filter((debt) => !debt.isPaid).length || 0;
  const totalSpendings = split.spendings?.length || 0;

  return (
    <Link href={`/split/${split.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl">Split #{split.id}</CardTitle>
            {isCreator && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                Admin
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Members
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {split.members.length}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Total Debt
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ${(Number(split.totalDebt) / 1e6).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Default Token
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {tokenSymbol}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Total Expenses
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {totalSpendings}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Unpaid Debts
              </span>
              <span
                className={`font-semibold ${
                  unpaidDebts > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                }`}
              >
                {unpaidDebts}
              </span>
            </div>

            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-500">
                Created{' '}
                {new Date(Number(split.createdAt) * 1000).toLocaleDateString()}
              </div>
            </div>

            {!isMember && !isCreator && (
              <div className="pt-2">
                <span className="text-xs text-orange-600 dark:text-orange-400">
                  You are not a member of this split
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
