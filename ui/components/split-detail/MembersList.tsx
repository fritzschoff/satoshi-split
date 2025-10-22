import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

interface MembersListProps {
  members: string[];
  creator: string;
  isCreatorMember: boolean;
  isMember: boolean;
  currentAddress?: string;
  isCreator?: boolean;
  isRemovingMember?: boolean;
  isConfirmingRemoveMember?: boolean;
  removeMemberError?: Error | null;
  isRemoveMemberSuccess?: boolean;
  isAddingMember?: boolean;
  isConfirmingAddMember?: boolean;
  addMemberError?: Error | null;
  isAddMemberSuccess?: boolean;
  onRemoveMember?: (member: string) => void;
  onAddMember?: (member: string) => void;
}

export function MembersList({
  members,
  creator,
  isCreatorMember,
  isMember,
  currentAddress,
  isCreator,
  isRemovingMember,
  isConfirmingRemoveMember,
  removeMemberError,
  isRemoveMemberSuccess,
  isAddingMember,
  isConfirmingAddMember,
  addMemberError,
  isAddMemberSuccess,
  onRemoveMember,
  onAddMember,
}: MembersListProps) {
  const [newMemberAddress, setNewMemberAddress] = useState('');
  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
      </CardHeader>
      <CardContent>
        {(isRemovingMember || isConfirmingRemoveMember) && (
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              {isRemovingMember
                ? 'Waiting for approval...'
                : 'Confirming transaction...'}
            </p>
          </div>
        )}

        {isRemoveMemberSuccess && (
          <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-xs text-green-800 dark:text-green-200">
              Member removed successfully!
            </p>
          </div>
        )}

        {removeMemberError && (
          <div
            className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            style={{ height: '80px', overflowY: 'scroll' }}
          >
            <p className="text-xs text-red-800 dark:text-red-200 break-words whitespace-pre-wrap">
              Error: {removeMemberError.message}
            </p>
          </div>
        )}

        {isAddMemberSuccess && (
          <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-xs text-green-800 dark:text-green-200">
              Member added successfully!
            </p>
          </div>
        )}

        {addMemberError && (
          <div
            className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            style={{ height: '80px', overflowY: 'scroll' }}
          >
            <p className="text-xs text-red-800 dark:text-red-200 break-words whitespace-pre-wrap">
              Error: {addMemberError.message}
            </p>
          </div>
        )}

        {isCreator && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex gap-2">
              <input
                placeholder="0x..."
                value={newMemberAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewMemberAddress(e.target.value)
                }
                className="flex-1 text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isAddingMember || isConfirmingAddMember}
              />
              <Button
                onClick={() => {
                  if (newMemberAddress.trim() && onAddMember) {
                    onAddMember(newMemberAddress.trim());
                    setNewMemberAddress('');
                  }
                }}
                disabled={
                  !newMemberAddress.trim() ||
                  isAddingMember ||
                  isConfirmingAddMember
                }
                className="text-xs px-3 py-1 h-auto"
              >
                {isAddingMember || isConfirmingAddMember ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {members.map((member) => {
            const isCreatorMember =
              member.toLowerCase() === creator.toLowerCase();
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
