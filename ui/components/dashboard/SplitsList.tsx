import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Split } from '@/types/web3';

interface SplitsListProps {
  splits: Split[];
  currentAddress?: string;
}

export function SplitsList({ splits, currentAddress }: SplitsListProps) {
  if (splits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Splits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You haven't created or joined any splits yet
            </p>
            <Link href="/create-split">
              <Button variant="secondary">Create Your First Split</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Splits</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {splits.map((split) => (
            <Link
              key={split.id}
              href={`/split/${split.id}`}
              className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-750 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Split #{split.id}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {split.members.length} members
                    {split.creator.toLowerCase() ===
                      currentAddress?.toLowerCase() && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Debt
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    ${(Number(split.totalDebt) / 1e6).toFixed(2)}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
