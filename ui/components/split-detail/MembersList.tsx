import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Split } from '@/types/web3';

interface MembersListProps {
  split: Split;
  currentAddress?: string;
  isCreator?: boolean;
  isRemovingMember?: boolean;
  isConfirmingRemoveMember?: boolean;
  onRemoveMember?: (member: string) => void;
}

export function MembersList({
  split,
  currentAddress,
  isCreator,
  isRemovingMember,
  isConfirmingRemoveMember,
  onRemoveMember,
}: MembersListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {split.members.map((member) => {
            const isCreatorMember =
              member.toLowerCase() === split.creator.toLowerCase();
            const canRemove = isCreator && !isCreatorMember;

            return (
              <div
                key={member}
                className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
              >
                <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                  {member.slice(0, 6)}...{member.slice(-4)}
                </span>
                <div className="flex items-center gap-2">
                  {isCreatorMember && (
                    <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                      Creator
                    </span>
                  )}
                  {member.toLowerCase() === currentAddress?.toLowerCase() && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                      You
                    </span>
                  )}
                  {canRemove && onRemoveMember && (
                    <Button
                      onClick={() => onRemoveMember(member)}
                      disabled={isRemovingMember || isConfirmingRemoveMember}
                      className="text-xs px-2 py-1 h-auto bg-red-500 hover:bg-red-600"
                    >
                      {isRemovingMember || isConfirmingRemoveMember
                        ? 'Removing...'
                        : 'Remove'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
