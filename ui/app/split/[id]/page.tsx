'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { graphqlClient, getSplitQuery } from '@/lib/graphql-client';

interface Split {
  id: string;
  creator: string;
  members: string[];
  defaultToken: string;
  createdAt: string;
  totalDebt: string;
  spendings: Spending[];
  debts: Debt[];
}

interface Spending {
  id: string;
  spendingId: string;
  title: string;
  payer: string;
  amount: string;
  forWho: string[];
  timestamp: string;
  token: string;
  txHash: string;
  chainId: number;
}

interface Debt {
  id: string;
  debtor: string;
  creditor: string;
  amount: string;
  token: string;
  isPaid: boolean;
  paidAt: string | null;
  txHash: string | null;
}

export default function SplitDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { address, isConnected } = useAccount();
  const [split, setSplit] = useState<Split | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  useEffect(() => {
    async function fetchSplit() {
      try {
        setIsLoading(true);
        const data = await graphqlClient.request(getSplitQuery, {
          id: params.id,
        });

        if (data?.Split) {
          setSplit(data.Split);
          setSelectedMembers(data.Split.members);
        }
      } catch (error) {
        console.error('Error fetching split:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSplit();
  }, [params.id]);

  const isCreator =
    split && address && split.creator.toLowerCase() === address.toLowerCase();
  const userDebts = split?.debts.filter(
    (debt) =>
      debt.debtor.toLowerCase() === address?.toLowerCase() && !debt.isPaid
  );

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Split Details
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Please connect your wallet to view split details
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!split) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Split Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            This split doesn't exist or hasn't been indexed yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Split #{split.id}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {split.members.length} members • Total debt: $
              {(Number(split.totalDebt) / 1e6).toFixed(2)}
            </p>
          </div>
          {isCreator && (
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
              Admin
            </span>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Members */}
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {split.members.map((member) => (
                  <div
                    key={member}
                    className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
                  >
                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                      {member.slice(0, 6)}...{member.slice(-4)}
                    </span>
                    {member.toLowerCase() === split.creator.toLowerCase() && (
                      <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                        Creator
                      </span>
                    )}
                    {member.toLowerCase() === address?.toLowerCase() && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Your Debts */}
          <Card>
            <CardHeader>
              <CardTitle>Your Debts</CardTitle>
            </CardHeader>
            <CardContent>
              {userDebts && userDebts.length > 0 ? (
                <div className="space-y-3">
                  {userDebts.map((debt) => (
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
                          ${(Number(debt.amount) / 1e6).toFixed(2)}
                        </div>
                        <Button size="sm" className="mt-2">
                          Pay Debt
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
        </div>

        {/* Add Expense (for all members) */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Description"
                  placeholder="Dinner, groceries, etc."
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                />
                <Input
                  label="Amount (USD)"
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Split among (check all who participated)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {split.members.map((member) => (
                    <label
                      key={member}
                      className="flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMembers([...selectedMembers, member]);
                          } else {
                            setSelectedMembers(
                              selectedMembers.filter((m) => m !== member)
                            );
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm font-mono">
                        {member.slice(0, 6)}...{member.slice(-4)}
                        {member.toLowerCase() === address?.toLowerCase() &&
                          ' (You)'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <Button type="button" className="w-full">
                Add Expense
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Expenses History */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses History</CardTitle>
          </CardHeader>
          <CardContent>
            {split.spendings.length > 0 ? (
              <div className="space-y-3">
                {split.spendings.map((spending) => (
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
                          ${(Number(spending.amount) / 1e6).toFixed(2)}
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
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-600 dark:text-gray-400 py-8">
                No expenses yet. Add the first expense above!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
