'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { graphqlClient, getSplitQuery } from '@/lib/graphql-client';
import { Split } from '@/types/web3';
import { TOKEN_SYMBOLS, TOKEN_DECIMALS } from '@/constants/tokens';
import { zeroAddress, parseUnits, encodeFunctionData } from 'viem';
import { SPLIT_MANAGER_ABI } from '@/lib/contract-abi';
import { simulateContract } from 'viem/actions';

const SPLIT_CONTRACT_ADDRESS = (process.env
  .NEXT_PUBLIC_SPLIT_CONTRACT_ADDRESS || zeroAddress) as `0x${string}`;

function getTokenSymbol(tokenAddress: string | undefined | null) {
  if (!tokenAddress) return '';
  const lower = tokenAddress.toLowerCase();
  return TOKEN_SYMBOLS[lower] || lower.slice(0, 6);
}

function getTokenDecimals(tokenAddress: string | undefined | null) {
  if (!tokenAddress) return 18;
  const lower = tokenAddress.toLowerCase();
  return TOKEN_DECIMALS[lower] ?? 18;
}

function formatTokenAmount(amount: string | number, decimals: number) {
  if (isNaN(Number(amount)) || Number(amount) === 0 || amount === '0')
    return '0.00';
  const amountInNumber = Number(amount) / 10 ** decimals;
  return amountInNumber.toFixed(2) === '0.00'
    ? '<0.01'
    : amountInNumber.toFixed(2);
}

export default function SplitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);

  const { address, isConnected } = useAccount();
  const [split, setSplit] = useState<Split | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const publicClient = usePublicClient();
  const {
    writeContract: addExpense,
    data: expenseHash,
    isPending: isAddingExpense,
    error: expenseError,
  } = useWriteContract();
  const { isLoading: isConfirmingExpense, isSuccess: isExpenseSuccess } =
    useWaitForTransactionReceipt({
      hash: expenseHash,
    });

  const {
    writeContract: payDebtContract,
    data: paymentHash,
    isPending: isPayingDebt,
    error: paymentError,
  } = useWriteContract();
  const { isLoading: isConfirmingPayment, isSuccess: isPaymentSuccess } =
    useWaitForTransactionReceipt({
      hash: paymentHash,
    });

  const fetchSplit = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const data: Record<'Split', Split[]> = await graphqlClient.request(
        getSplitQuery,
        {
          id,
        }
      );

      if (data?.Split) {
        setSplit(data.Split[0]);
        setSelectedMembers(data.Split[0].members);
      }
    } catch (error) {
      console.error('Error fetching split:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSplit();
  }, [fetchSplit]);

  useEffect(() => {
    if (isExpenseSuccess || isPaymentSuccess) {
      setTimeout(() => {
        fetchSplit();
      }, 2000);
    }
  }, [isExpenseSuccess, isPaymentSuccess, fetchSplit]);

  useEffect(() => {
    if (isExpenseSuccess) {
      setExpenseTitle('');
      setExpenseAmount('');
      if (split) {
        setSelectedMembers(split.members);
      }
    }
  }, [isExpenseSuccess, split]);

  const defaultToken = split?.defaultToken || zeroAddress;
  const [tokenSymbol, tokenDecimals] = useMemo(
    () => [getTokenSymbol(defaultToken), getTokenDecimals(defaultToken)],
    [defaultToken]
  );

  const isCreator =
    split && address && split.creator.toLowerCase() === address.toLowerCase();
  const isMember =
    split &&
    address &&
    split.members.some(
      (member) => member.toLowerCase() === address.toLowerCase()
    );
  const userDebts = split?.debts.filter(
    (debt) =>
      debt.debtor.toLowerCase() === address?.toLowerCase() && !debt.isPaid
  );

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!split || !address) {
      console.log('No split or address:', { split, address });
      return;
    }

    if (!expenseTitle.trim()) {
      alert('Please enter an expense description');
      return;
    }

    if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (selectedMembers.length === 0) {
      alert('Please select at least one member to split with');
      return;
    }

    try {
      const amountInUnits = parseUnits(expenseAmount, tokenDecimals);

      try {
        await simulateContract(publicClient!, {
          account: address,
          address: SPLIT_CONTRACT_ADDRESS,
          abi: SPLIT_MANAGER_ABI,
          functionName: 'addSpending',
          args: [
            BigInt(id),
            expenseTitle,
            amountInUnits,
            selectedMembers as `0x${string}`[],
          ],
        });

        const gas = await publicClient!.estimateGas({
          account: address,
          to: SPLIT_CONTRACT_ADDRESS,
          data: encodeFunctionData({
            abi: SPLIT_MANAGER_ABI,
            functionName: 'addSpending',
            args: [
              BigInt(id),
              expenseTitle,
              amountInUnits,
              selectedMembers as `0x${string}`[],
            ],
          }),
        });

        addExpense({
          account: address,
          address: SPLIT_CONTRACT_ADDRESS,
          abi: SPLIT_MANAGER_ABI,
          functionName: 'addSpending',
          args: [
            BigInt(id),
            expenseTitle,
            amountInUnits,
            selectedMembers as `0x${string}`[],
          ],
          gas: gas,
        });
      } catch (simulationError) {
        console.error('Simulation failed:', simulationError);
        alert(
          `Transaction would fail: ${
            simulationError instanceof Error
              ? simulationError.message
              : 'Unknown error'
          }`
        );
        return;
      }
    } catch (err) {
      console.error('Error adding expense:', err);
      alert('Error adding expense. Please try again.');
    }
  };

  const handlePayDebt = async (
    creditor: string,
    amount: string,
    isETH: boolean
  ) => {
    if (!split || !address) return;

    try {
      const amountInUnits = BigInt(amount);

      payDebtContract({
        address: SPLIT_CONTRACT_ADDRESS,
        abi: SPLIT_MANAGER_ABI,
        functionName: 'payDebt',
        args: [BigInt(id), creditor as `0x${string}`, amountInUnits],
        value: isETH ? amountInUnits : BigInt(0),
      });
    } catch (err) {
      console.error('Error paying debt:', err);
      alert('Error paying debt. Please try again.');
    }
  };

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
              {split.members.length} members • Total debt:{' '}
              <span>
                {formatTokenAmount(split.totalDebt, tokenDecimals)}{' '}
                {tokenSymbol}
              </span>
            </p>
          </div>
          {isCreator && (
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
              Admin
            </span>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
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
                    {formatTokenAmount(split.totalDebt, tokenDecimals)}{' '}
                    {tokenSymbol}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Members
                    </div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-white">
                      {split.members.length}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Expenses
                    </div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-white">
                      {split.spendings.length}
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Created:{' '}
                    {new Date(
                      Number(split.createdAt) * 1000
                    ).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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

          <Card>
            <CardHeader>
              <CardTitle>Your Debts</CardTitle>
            </CardHeader>
            <CardContent>
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

              {userDebts && userDebts.length > 0 ? (
                <div className="space-y-3">
                  {userDebts.map((debt) => {
                    const debtSymbol = getTokenSymbol(
                      debt.token || defaultToken
                    );
                    const debtDecimals = getTokenDecimals(
                      debt.token || defaultToken
                    );
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
                              handlePayDebt(
                                debt.creditor,
                                debt.amount,
                                (debt.token || defaultToken) === zeroAddress
                              )
                            }
                            isLoading={isPayingDebt || isConfirmingPayment}
                            disabled={isPayingDebt || isConfirmingPayment}
                          >
                            Pay Debt
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
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add Expense</CardTitle>
          </CardHeader>
          <CardContent>
            {!isMember && (
              <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ You are not a member of this split. Only members can add
                  expenses. Your connected wallet:{' '}
                  <code className="font-mono">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </code>
                </p>
              </div>
            )}
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Description"
                  placeholder="Dinner, groceries, etc."
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  required
                  disabled={!isMember}
                />
                <Input
                  label={`Amount (${tokenSymbol})`}
                  type="number"
                  step={tokenDecimals === 18 ? '0.000000000000000001' : '0.01'}
                  placeholder={tokenDecimals === 18 ? '0.05' : '100.00'}
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  required
                  disabled={!isMember}
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
                      className={`flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded-lg ${
                        isMember
                          ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
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
                        disabled={!isMember}
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

              {expenseError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Error: {expenseError.message}
                  </p>
                </div>
              )}

              {isExpenseSuccess && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✅ Expense added successfully!
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                isLoading={isAddingExpense || isConfirmingExpense}
                disabled={!isMember || isAddingExpense || isConfirmingExpense}
              >
                {!isMember
                  ? 'Not a member of this split'
                  : isAddingExpense
                  ? 'Waiting for approval...'
                  : isConfirmingExpense
                  ? 'Confirming transaction...'
                  : 'Add Expense'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses History</CardTitle>
          </CardHeader>
          <CardContent>
            {split.spendings.length > 0 ? (
              <div className="space-y-3">
                {split.spendings.map((spending) => {
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
                            {formatTokenAmount(
                              spending.amount,
                              spendingDecimals
                            )}{' '}
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
      </div>
    </div>
  );
}
