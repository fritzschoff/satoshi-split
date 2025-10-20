import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Image from 'next/image';
import {
  SUPPORTED_CHAINS,
  SUPPORTED_TOKENS_BY_SYMBOL,
} from '@/constants/tokens';
import { CHAIN_NAMES } from '@/constants/chains';
import { UserAsset } from '@avail-project/nexus-widgets';
import { SUPPORTED_TOKENS } from '@avail-project/nexus-widgets';

interface TokenBalanceCardProps {
  balance: UserAsset;
  selectedToken: SUPPORTED_TOKENS | null;
  sourceChainId: number | null;
  destinationChainId: number | null;
  bridgeAmount: string;
  isBridging: boolean;
  bridgeError: string | null;
  onSetSelectedToken: (token: SUPPORTED_TOKENS) => void;
  onSetDestinationChainId: (chainId: number | null) => void;
  onSetBridgeAmount: (amount: string) => void;
  onMaxAmount: () => void;
  onBridge: () => void;
  onSourceChainChange: (chainId: number) => void;
}

export function TokenBalanceCard({
  balance,
  selectedToken,
  sourceChainId,
  destinationChainId,
  bridgeAmount,
  isBridging,
  bridgeError,
  onSetSelectedToken,
  onSetDestinationChainId,
  onSetBridgeAmount,
  onMaxAmount,
  onBridge,
  onSourceChainChange,
}: TokenBalanceCardProps) {
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

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Bridge {balance.symbol}
                  </div>

                  {bridgeError && (
                    <div className="text-xs text-red-600 dark:text-red-400 mb-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                      {bridgeError}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                        Source Chain
                      </label>
                      <select
                        value={sourceChainId || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (value) {
                            onSetSelectedToken(
                              balance.symbol as SUPPORTED_TOKENS
                            );
                            onSourceChainChange(value);
                          }
                        }}
                        className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option key="select-chain" value="">
                          Select chain...
                        </option>
                        {balance.breakdown
                          ?.filter((item) =>
                            SUPPORTED_CHAINS.includes(
                              item.chain.id as (typeof SUPPORTED_CHAINS)[number]
                            )
                          )
                          .map((item) => (
                            <option key={item.chain.id} value={item.chain.id}>
                              {item.chain.name} ({item.balance} {balance.symbol}
                              )
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                        Destination Chain
                      </label>
                      <select
                        value={destinationChainId || ''}
                        onChange={(e) =>
                          onSetDestinationChainId(
                            parseInt(e.target.value) || null
                          )
                        }
                        className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        disabled={!sourceChainId}
                      >
                        <option value="">Select chain...</option>
                        {SUPPORTED_CHAINS.filter(
                          (id) => id !== sourceChainId
                        ).map((id) => (
                          <option key={id} value={id}>
                            {CHAIN_NAMES[id]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                        Amount
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={bridgeAmount}
                          onChange={(e) => onSetBridgeAmount(e.target.value)}
                          placeholder="0.0"
                          className="flex-1 text-xs"
                          disabled={!sourceChainId}
                        />
                        <Button
                          onClick={onMaxAmount}
                          disabled={!sourceChainId}
                          variant="secondary"
                          className="text-xs px-3 py-1 h-auto"
                        >
                          Max
                        </Button>
                      </div>
                    </div>

                    <Button
                      onClick={onBridge}
                      disabled={
                        !selectedToken ||
                        !sourceChainId ||
                        !destinationChainId ||
                        !bridgeAmount ||
                        isBridging
                      }
                      className="w-full text-xs py-2"
                    >
                      {isBridging ? 'Bridging...' : `Bridge ${balance.symbol}`}
                    </Button>
                  </div>
                </div>
              </div>
            </details>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
