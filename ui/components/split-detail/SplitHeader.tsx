import { Split } from '@/types/web3';
import { formatTokenAmount } from '@/utils/token';

interface SplitHeaderProps {
  split: Split;
  tokenSymbol: string;
  tokenDecimals: number;
  isCreator: boolean;
}

export function SplitHeader({
  split,
  tokenSymbol,
  tokenDecimals,
  isCreator,
}: SplitHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Split #{split.id}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {split.members.length} members • Total debt:{' '}
          <span>
            {formatTokenAmount(split.totalDebt, tokenDecimals)} {tokenSymbol}
          </span>
        </p>
      </div>
      {isCreator && (
        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
          Admin
        </span>
      )}
    </div>
  );
}
