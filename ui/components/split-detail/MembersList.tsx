import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Split } from '@/types/web3';

interface MembersListProps {
  split: Split;
  currentAddress?: string;
}

export function MembersList({ split, currentAddress }: MembersListProps) {
  return (
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
              {member.toLowerCase() === currentAddress?.toLowerCase() && (
                <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                  You
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
