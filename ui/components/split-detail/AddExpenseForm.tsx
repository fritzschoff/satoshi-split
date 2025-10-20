import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Split } from '@/types/web3';

interface AddExpenseFormProps {
  split: Split;
  expenseTitle: string;
  expenseAmount: string;
  selectedMembers: string[];
  tokenSymbol: string;
  tokenDecimals: number;
  isMember: boolean;
  isAddingExpense: boolean;
  isConfirmingExpense: boolean;
  expenseError: Error | null;
  isExpenseSuccess: boolean;
  currentAddress?: string;
  onExpenseTitleChange: (value: string) => void;
  onExpenseAmountChange: (value: string) => void;
  onMemberToggle: (member: string, checked: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddExpenseForm({
  split,
  expenseTitle,
  expenseAmount,
  selectedMembers,
  tokenSymbol,
  tokenDecimals,
  isMember,
  isAddingExpense,
  isConfirmingExpense,
  expenseError,
  isExpenseSuccess,
  currentAddress,
  onExpenseTitleChange,
  onExpenseAmountChange,
  onMemberToggle,
  onSubmit,
}: AddExpenseFormProps) {
  return (
    <Card>
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
                {currentAddress?.slice(0, 6)}...{currentAddress?.slice(-4)}
              </code>
            </p>
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Description"
              placeholder="Dinner, groceries, etc."
              value={expenseTitle}
              onChange={(e) => onExpenseTitleChange(e.target.value)}
              required
              disabled={!isMember}
            />
            <Input
              label={`Amount (${tokenSymbol})`}
              type="number"
              step={tokenDecimals === 18 ? '0.000000000000000001' : '0.01'}
              placeholder={tokenDecimals === 18 ? '0.05' : '100.00'}
              value={expenseAmount}
              onChange={(e) => onExpenseAmountChange(e.target.value)}
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
                    onChange={(e) => onMemberToggle(member, e.target.checked)}
                    className="mr-2"
                    disabled={!isMember}
                  />
                  <span className="text-sm font-mono">
                    {member.slice(0, 6)}...{member.slice(-4)}
                    {member.toLowerCase() === currentAddress?.toLowerCase() &&
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
  );
}
