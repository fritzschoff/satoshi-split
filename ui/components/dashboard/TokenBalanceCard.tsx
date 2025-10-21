import { Card, CardContent } from '@/components/ui/Card';
import Image from 'next/image';
import {
  SUPPORTED_CHAINS,
  SUPPORTED_TOKENS_BY_SYMBOL,
} from '@/constants/tokens';
import { UserAsset } from '@avail-project/nexus-widgets';

interface TokenBalanceCardProps {
  balance: UserAsset;
}

export function TokenBalanceCard({ balance }: TokenBalanceCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Token Symbol
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {balance.symbol}
        </div>

        <div className="space-y-2">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              Balance
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {balance.balance}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              Balance in Fiat
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              $
              {Number(balance.balanceInFiat).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 dark:text-gray-500">Icon</div>
            <Image
              src={balance.icon ?? ''}
              alt={balance.symbol ?? ''}
              width={20}
              height={20}
            />
          </div>

          <div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              Decimals
            </div>
            <div className="text-sm text-gray-900 dark:text-white">
              {balance.decimals}
            </div>
          </div>

          {balance.breakdown && balance.breakdown.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-xs text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                View Breakdown & Bridge (
                {
                  balance.breakdown.filter(
                    (item) =>
                      SUPPORTED_CHAINS.includes(
                        item.chain.id as (typeof SUPPORTED_CHAINS)[number]
                      ) &&
                      SUPPORTED_TOKENS_BY_SYMBOL.includes(
                        balance.symbol as (typeof SUPPORTED_TOKENS_BY_SYMBOL)[number]
                      )
                  ).length
                }{' '}
                chains)
              </summary>
              <div className="mt-2 space-y-4 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
                {balance.breakdown
                  .filter(
                    (item) =>
                      SUPPORTED_CHAINS.includes(
                        item.chain.id as (typeof SUPPORTED_CHAINS)[number]
                      ) &&
                      SUPPORTED_TOKENS_BY_SYMBOL.includes(
                        balance.symbol as (typeof SUPPORTED_TOKENS_BY_SYMBOL)[number]
                      )
                  )
                  .map((item, index) => (
                    <div key={index} className="text-xs space-y-1 pb-2">
                      <div className="font-medium text-gray-700 dark:text-gray-300">
                        {item.chain.name}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        Balance: {item.balance}{' '}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        Fiat: $
                        {Number(item.balanceInFiat).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </details>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
