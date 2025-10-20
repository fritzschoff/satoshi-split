'use client';

import React from 'react';
import { SplitHeader } from '@/components/split-detail/SplitHeader';
import { SplitOverview } from '@/components/split-detail/SplitOverview';
import { MembersList } from '@/components/split-detail/MembersList';
import { UserDebts } from '@/components/split-detail/UserDebts';
import { AddExpenseForm } from '@/components/split-detail/AddExpenseForm';
import { ExpensesHistory } from '@/components/split-detail/ExpensesHistory';
import { useSplitDetail } from '@/hooks/useSplitDetail';

export default function SplitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);

  const {
    split,
    isLoading,
    isConnected,
    address,
    expenseTitle,
    setExpenseTitle,
    expenseAmount,
    setExpenseAmount,
    selectedMembers,
    defaultToken,
    tokenSymbol,
    tokenDecimals,
    isCreator,
    isMember,
    userDebts,
    isAddingExpense,
    isConfirmingExpense,
    expenseError,
    isExpenseSuccess,
    isPayingDebt,
    isApprovingExpense,
    isConfirmingApproval,
    approveError,
    isApprovalSuccess,
    isConfirmingPayment,
    paymentError,
    isPaymentSuccess,
    handleAddExpense,
    handlePayDebt,
    handleMemberToggle,
  } = useSplitDetail(id);

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
        <SplitHeader
          split={split}
          tokenSymbol={tokenSymbol}
          tokenDecimals={tokenDecimals}
          isCreator={!!isCreator}
        />

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <SplitOverview
            split={split}
            tokenSymbol={tokenSymbol}
            tokenDecimals={tokenDecimals}
          />

          <MembersList split={split} currentAddress={address} />

          <UserDebts
            debts={userDebts || []}
            defaultToken={defaultToken}
            isPayingDebt={isPayingDebt}
            isApprovingExpense={isApprovingExpense}
            isConfirmingApproval={isConfirmingApproval}
            approveError={approveError}
            isApprovalSuccess={isApprovalSuccess}
            isConfirmingPayment={isConfirmingPayment}
            paymentError={paymentError}
            isPaymentSuccess={isPaymentSuccess}
            onPayDebt={handlePayDebt}
          />
        </div>

        <div className="mb-8">
          <AddExpenseForm
            split={split}
            expenseTitle={expenseTitle}
            expenseAmount={expenseAmount}
            selectedMembers={selectedMembers}
            tokenSymbol={tokenSymbol}
            tokenDecimals={tokenDecimals}
            isMember={!!isMember}
            isAddingExpense={isAddingExpense}
            isConfirmingExpense={isConfirmingExpense}
            expenseError={expenseError}
            isExpenseSuccess={isExpenseSuccess}
            currentAddress={address}
            onExpenseTitleChange={setExpenseTitle}
            onExpenseAmountChange={setExpenseAmount}
            onMemberToggle={handleMemberToggle}
            onSubmit={handleAddExpense}
          />
        </div>

        <ExpensesHistory
          spendings={split.spendings}
          defaultToken={defaultToken}
        />
      </div>
    </div>
  );
}
