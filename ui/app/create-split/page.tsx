'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { sepolia } from 'wagmi/chains';
import { useCreateSplit } from '@/hooks/useCreateSplit';

export default function CreateSplitPage() {
  const {
    isConnected,
    members,
    setMembers,
    selectedToken,
    setSelectedToken,
    validationError,
    isPending,
    isConfirming,
    isSuccess,
    error,
    isOnSepolia,
    switchChain,
    handleSubmit,
    TOKENS,
  } = useCreateSplit();

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Create Split
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Please connect your wallet to create a split
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
          Create New Split
        </h1>

        {!isOnSepolia && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
              ⚠️ You are not on Sepolia network. The contract is only deployed
              on Sepolia.
            </p>
            <Button
              onClick={() => switchChain({ chainId: sepolia.id })}
              className="w-full"
            >
              Switch to Sepolia
            </Button>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Split Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Default Token
                </label>
                <select
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  disabled={!isOnSepolia}
                >
                  {TOKENS.map((token) => (
                    <option key={token.address} value={token.address}>
                      {token.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  All expenses in this split will use this token
                </p>
              </div>

              <div>
                <Input
                  label="Initial Members (comma-separated addresses)"
                  placeholder="0x123..., 0x456..."
                  value={members}
                  onChange={(e) => setMembers(e.target.value)}
                  required
                  disabled={!isOnSepolia}
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  You will be added automatically as the admin. Add other
                  members' wallet addresses separated by commas. Do not include
                  your own address.
                </p>
              </div>

              {validationError && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {validationError}
                  </p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Error: {error.message}
                  </p>
                </div>
              )}

              {isSuccess && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Split created successfully! Redirecting to split page...
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                isLoading={isPending || isConfirming}
                disabled={
                  !isOnSepolia || isPending || isConfirming || isSuccess
                }
              >
                {isPending
                  ? 'Waiting for approval...'
                  : isConfirming
                  ? 'Confirming transaction...'
                  : 'Create Split'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
