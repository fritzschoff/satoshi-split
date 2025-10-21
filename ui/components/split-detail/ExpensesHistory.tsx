import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spending, Split } from '@/types/web3';
import {
  getTokenSymbol,
  getTokenDecimals,
  formatTokenAmount,
} from '@/utils/token';

interface ExpensesHistoryProps {
  spendings: Spending[];
  defaultToken: string;
  split?: Split;
  currentAddress?: string;
  isCreator?: boolean;
  isRemovingSpending?: boolean;
  isConfirmingRemoveSpending?: boolean;
  isAddingMemberToSpending?: boolean;
  isConfirmingAddMemberToSpending?: boolean;
  onRemoveSpending?: (spendingId: string) => void;
  onAddMemberToSpending?: (spendingId: string, member: string) => void;
}

export function ExpensesHistory({
  spendings,
  defaultToken,
  split,
  currentAddress,
  isCreator,
  isRemovingSpending,
  isConfirmingRemoveSpending,
  isAddingMemberToSpending,
  isConfirmingAddMemberToSpending,
  onRemoveSpending,
  onAddMemberToSpending,
}: ExpensesHistoryProps) {
  const [expandedSpendingId, setExpandedSpendingId] = useState<string | null>(
    null
  );
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
              const canRemove =
                isCreator ||
                spending.payer.toLowerCase() === currentAddress?.toLowerCase();
              const canAddMember = canRemove;
              const isExpanded = expandedSpendingId === spending.id;
              const isPending = spending.id.startsWith('pending-');

              const membersNotInSpending = split
                ? split.members.filter(
                    (member) =>
                      !spending.forWho
                        .map((m) => m.toLowerCase())
                        .includes(member.toLowerCase())
                  )
                : [];

              return (
                <div
                  key={spending.id}
                  className={`p-4 border rounded-lg ${
                    isPending
                      ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/10'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {spending.title}
                        </div>
                        {isPending && (
                          <span className="text-xs px-2 py-0.5 bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded-full">
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Paid by {spending.payer.slice(0, 6)}...
                        {spending.payer.slice(-4)}
                        {spending.payer.toLowerCase() ===
                          currentAddress?.toLowerCase() && ' (You)'}
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

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() =>
                        setExpandedSpendingId(isExpanded ? null : spending.id)
                      }
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Split among {spending.forWho.length} members{' '}
                      {isExpanded ? '▲' : '▼'}
                    </button>
                    {canRemove && onRemoveSpending && !isPending && (
                      <Button
                        onClick={() => onRemoveSpending(spending.id)}
                        disabled={
                          isRemovingSpending || isConfirmingRemoveSpending
                        }
                        className="text-xs px-2 py-1 h-auto bg-red-500 hover:bg-red-600"
                      >
                        {isRemovingSpending || isConfirmingRemoveSpending
                          ? 'Removing...'
                          : 'Remove Expense'}
                      </Button>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Members in this expense:
                      </div>
                      <div className="space-y-1 mb-3">
                        {spending.forWho.map((member) => (
                          <div
                            key={member}
                            className="text-xs font-mono text-gray-600 dark:text-gray-400"
                          >
                            {member.slice(0, 6)}...{member.slice(-4)}
                            {member.toLowerCase() ===
                              currentAddress?.toLowerCase() && ' (You)'}
                            {member.toLowerCase() ===
                              spending.payer.toLowerCase() && ' (Payer)'}
                          </div>
                        ))}
                      </div>

                      {canAddMember &&
                        onAddMemberToSpending &&
                        membersNotInSpending.length > 0 && (
                          <div>
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Add member to this expense:
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {membersNotInSpending.map((member) => (
                                <Button
                                  key={member}
                                  onClick={() =>
                                    onAddMemberToSpending(spending.id, member)
                                  }
                                  disabled={
                                    isAddingMemberToSpending ||
                                    isConfirmingAddMemberToSpending
                                  }
                                  className="text-xs px-2 py-1 h-auto"
                                >
                                  Add {member.slice(0, 6)}...
                                  {member.slice(-4)}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  )}
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
