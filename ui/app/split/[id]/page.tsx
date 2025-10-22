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
    isRemovingMember,
    isConfirmingRemoveMember,
    removeMemberError,
    isRemoveMemberSuccess,
    isRemovingSpending,
    isConfirmingRemoveSpending,
    removeSpendingError,
    isRemoveSpendingSuccess,
    isAddingMemberToSpending,
    isConfirmingAddMemberToSpending,
    addMemberToSpendingError,
    isAddMemberToSpendingSuccess,
    handleAddExpense,
    handlePayDebt,
    handleMemberToggle,
    handleRemoveMember,
    handleRemoveSpending,
    handleAddMemberToSpending,
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
        {isRemoveMemberSuccess && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              Member removed successfully!
            </p>
          </div>
        )}
        {removeMemberError && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              Error removing member: {removeMemberError.message}
            </p>
          </div>
        )}
        {isRemoveSpendingSuccess && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              Expense removed successfully!
            </p>
          </div>
        )}
        {removeSpendingError && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              Error removing expense: {removeSpendingError.message}
            </p>
          </div>
        )}
        {isAddMemberToSpendingSuccess && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              Member added to expense successfully!
            </p>
          </div>
        )}
        {addMemberToSpendingError && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              Error adding member to expense: {addMemberToSpendingError.message}
            </p>
          </div>
        )}

        <SplitHeader
          splitId={BigInt(id)}
          totalDebt={split.splitDetails.data?.totalDebt.toString() || '0'}
          members={split.splitDetails.data?.members || []}
          tokenSymbol={tokenSymbol}
          tokenDecimals={tokenDecimals}
          isCreator={!!isCreator}
        />

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <SplitOverview
            totalDebt={split.splitDetails.data?.totalDebt.toString() || '0'}
            members={split.splitDetails.data?.members || []}
            spendings={split.spendings.data?.length || 0}
            createdAt={split.splitDetails.data?.createdAt.toString() || '0'}
            tokenSymbol={tokenSymbol}
            tokenDecimals={tokenDecimals}
          />

          <MembersList
            members={split.splitDetails.data?.members || []}
            creator={split.splitDetails.data?.creator || ''}
            isCreatorMember={!!isCreator}
            isMember={!!isMember}
            currentAddress={address}
            isCreator={!!isCreator}
            isRemovingMember={isRemovingMember}
            isConfirmingRemoveMember={isConfirmingRemoveMember}
            removeMemberError={removeMemberError}
            isRemoveMemberSuccess={isRemoveMemberSuccess}
            onRemoveMember={handleRemoveMember}
          />

          <UserDebts
            splitId={BigInt(id)}
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
            members={split.splitDetails.data?.members || []}
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
          spendings={
            split.spendings.data?.map((spending) => ({
              id: spending.id.toString(),
              spendingId: spending.id.toString(),
              title: spending.title,
              payer: spending.payer,
              amount: spending.amount.toString(),
              forWho: spending.forWho,
              timestamp: spending.timestamp.toString(),
              token: spending.token,
              txHash: '',
              chainId: 11155111,
            })) || []
          }
          defaultToken={defaultToken}
          members={split.splitDetails.data?.members || []}
          currentAddress={address}
          isCreator={!!isCreator}
          isRemovingSpending={isRemovingSpending}
          isConfirmingRemoveSpending={isConfirmingRemoveSpending}
          removeSpendingError={removeSpendingError}
          isRemoveSpendingSuccess={isRemoveSpendingSuccess}
          isAddingMemberToSpending={isAddingMemberToSpending}
          isConfirmingAddMemberToSpending={isConfirmingAddMemberToSpending}
          addMemberToSpendingError={addMemberToSpendingError}
          isAddMemberToSpendingSuccess={isAddMemberToSpendingSuccess}
          onRemoveSpending={handleRemoveSpending}
          onAddMemberToSpending={handleAddMemberToSpending}
        />
      </div>
    </div>
  );
}
