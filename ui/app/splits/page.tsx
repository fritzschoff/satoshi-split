'use client';

import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { SplitCard } from '@/components/splits/SplitCard';
import { Card, CardContent } from '@/components/ui/Card';
import { useGetAllSplits } from '@/hooks/useGraphQLQueries';
import { TOKEN_SYMBOLS, TOKEN_DECIMALS } from '@/constants/tokens';

export default function SplitsPage() {
  const { address, isConnected } = useAccount();
  const { data: splits = [], isLoading } = useGetAllSplits();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'my' | 'admin'>('all');
  const filteredSplits = useMemo(() => {
    let filtered = splits;

    if (filterType === 'my' && address) {
      filtered = splits.filter((split) =>
        split.members.some(
          (member) => member.toLowerCase() === address.toLowerCase()
        )
      );
    } else if (filterType === 'admin' && address) {
      filtered = splits.filter(
        (split) => split.creator.toLowerCase() === address.toLowerCase()
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (split) =>
          split.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          split.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
          split.members.some((member) =>
            member.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    return filtered;
  }, [filterType, searchTerm, splits, address]);

  const debtByToken = splits.reduce((acc, split) => {
    const tokenAddress = split.defaultToken.toLowerCase();
    const debt = Number(split.totalDebt);

    if (!acc[tokenAddress]) {
      acc[tokenAddress] = 0;
    }
    acc[tokenAddress] += debt;

    return acc;
  }, {} as Record<string, number>);

  const stats = {
    total: splits.length,
    mySplits: address
      ? splits.filter((split) =>
          split.members.some(
            (member) => member.toLowerCase() === address.toLowerCase()
          )
        ).length
      : 0,
    adminSplits: address
      ? splits.filter(
          (split) => split.creator.toLowerCase() === address.toLowerCase()
        ).length
      : 0,
    debtByToken,
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
            All Splits
          </h1>
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            All Splits
          </h1>
          <Link href="/create-split">
            <Button>Create New Split</Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Splits
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total}
              </div>
            </CardContent>
          </Card>

          {isConnected && (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    My Splits
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.mySplits}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Admin Of
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.adminSplits}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Debt
              </div>
              <div className="space-y-1">
                {Object.entries(stats.debtByToken).map(
                  ([tokenAddress, debt]) => {
                    const symbol = TOKEN_SYMBOLS[tokenAddress] || 'Unknown';
                    const decimals = TOKEN_DECIMALS[tokenAddress] || 18;
                    const formattedDebt = (
                      debt / Math.pow(10, decimals)
                    ).toFixed(decimals === 6 ? 2 : 4);

                    return (
                      <div
                        key={tokenAddress}
                        className="text-lg font-bold text-gray-900 dark:text-white"
                      >
                        {formattedDebt} {symbol}
                      </div>
                    );
                  }
                )}
                {Object.keys(stats.debtByToken).length === 0 && (
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    0
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search by split ID, creator, or member address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant={filterType === 'all' ? 'primary' : 'secondary'}
                  onClick={() => setFilterType('all')}
                >
                  All
                </Button>
                {isConnected && (
                  <>
                    <Button
                      variant={filterType === 'my' ? 'primary' : 'secondary'}
                      onClick={() => setFilterType('my')}
                    >
                      My Splits
                    </Button>
                    <Button
                      variant={filterType === 'admin' ? 'primary' : 'secondary'}
                      onClick={() => setFilterType('admin')}
                    >
                      Admin
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredSplits.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm
                  ? 'No splits found matching your search.'
                  : filterType === 'my'
                  ? "You haven't joined any splits yet."
                  : filterType === 'admin'
                  ? "You haven't created any splits yet."
                  : 'No splits available.'}
              </p>
              {!isConnected && (
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Connect your wallet to see your splits
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSplits.map((split) => (
              <SplitCard
                key={split.id}
                split={split}
                currentAddress={address}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
