import { MetricCard } from './MetricCard';
import { TokenBalanceCard } from './TokenBalanceCard';
import { Button } from '@/components/ui/Button';
import { UserAsset, SUPPORTED_TOKENS } from '@avail-project/nexus-widgets';
import {
  SUPPORTED_TOKENS_BY_SYMBOL,
  SUPPORTED_CHAINS,
} from '@/constants/tokens';
import { Input } from '../ui/Input';
import { CHAIN_NAMES } from '@/constants/chains';

interface UnifiedBalanceSectionProps {
  unifiedBalance: UserAsset[] | null;
  isInitialized: boolean;
  isInitializationLoading: boolean;
  error: Error | null;
  selectedToken: SUPPORTED_TOKENS | null;
  sourceChainId: number | null;
  destinationChainId: number | null;
  bridgeAmount: string;
  isBridging: boolean;
  bridgeError: string | null;
  onInitSDK: () => void;
  onSetSelectedToken: (token: SUPPORTED_TOKENS) => void;
  onSetDestinationChainId: (chainId: number | null) => void;
  onSetBridgeAmount: (amount: string) => void;
  onMaxAmount: () => void;
  onBridge: () => void;
  onSourceChainChange: (chainId: number) => void;
}

export function UnifiedBalanceSection({
  unifiedBalance,
  isInitialized,
  isInitializationLoading,
  error,
  selectedToken,
  sourceChainId,
  destinationChainId,
  bridgeAmount,
  isBridging,
  bridgeError,
  onInitSDK,
  onSetSelectedToken,
  onSetDestinationChainId,
  onSetBridgeAmount,
  onMaxAmount,
  onBridge,
  onSourceChainChange,
}: UnifiedBalanceSectionProps) {
  if (isInitializationLoading) {
    return (
      <div className="flex justify-center items-center h-full mb-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }
  if (!isInitialized) {
    if (error) {
      return (
        <div className="flex justify-center items-center h-full mb-8">
          <p className="text-red-500">{error.message}</p>
        </div>
      );
    }
    return (
      <div className="flex justify-center items-center h-full mb-8">
        <Button onClick={onInitSDK}>Sign Message to fetch balances</Button>
      </div>
    );
  }

  const ethBalance =
    unifiedBalance?.find((balance) => balance.symbol === 'ETH')?.balance ?? '0';

  const usdBalance = Number(
    (unifiedBalance?.find((balance) => balance.symbol === 'USDC')
      ?.balanceInFiat ?? 0) +
      (unifiedBalance?.find((balance) => balance.symbol === 'USDT')
        ?.balanceInFiat ?? 0)
  ).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const availableTokens =
    unifiedBalance?.filter((balance) =>
      SUPPORTED_TOKENS_BY_SYMBOL.includes(
        balance.symbol as (typeof SUPPORTED_TOKENS_BY_SYMBOL)[number]
      )
    ) ?? [];

  const supportedChainIds = [...SUPPORTED_CHAINS];
  const availableChains = selectedToken
    ? unifiedBalance
        ?.find((b) => b.symbol === selectedToken)
        ?.breakdown?.filter((item) =>
          supportedChainIds.includes(
            item.chain.id as (typeof SUPPORTED_CHAINS)[number]
          )
        ) ?? []
    : [];

  const sourceChainBalance = sourceChainId
    ? availableChains.find((chain) => chain.chain.id === sourceChainId)
    : null;

  return (
    <div className="space-y-8 mb-8">
      <div className="grid md:grid-cols-2 gap-4">
        <MetricCard
          label="Total Balance (ETH)"
          sublabel="provided by Avail Nexus SDK"
          value={ethBalance}
        />
        <MetricCard
          label="Total Balance (USD)"
          sublabel="provided by Avail Nexus SDK"
          value={`$${usdBalance}`}
        />
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Bridge Assets
        </h3>

        {bridgeError && (
          <div className="text-sm text-red-600 dark:text-red-400 mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded">
            {bridgeError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300 font-medium block mb-2">
              Select Token
            </label>
            <select
              value={selectedToken || ''}
              onChange={(e) => {
                const token = e.target.value as SUPPORTED_TOKENS;
                if (token) {
                  onSetSelectedToken(token);
                  onSourceChainChange(0);
                  onSetDestinationChainId(null);
                }
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select token...</option>
              {availableTokens.map((balance) => (
                <option key={balance.symbol} value={balance.symbol}>
                  {balance.symbol} - {balance.balance} ($
                  {Number(balance.balanceInFiat).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300 font-medium block mb-2">
              Source Chain
            </label>
            <select
              value={sourceChainId || ''}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value) {
                  onSourceChainChange(value);
                  if (destinationChainId === value) {
                    onSetDestinationChainId(null);
                  }
                }
              }}
              disabled={!selectedToken}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select source chain...</option>
              {availableChains.map((item) => (
                <option key={item.chain.id} value={item.chain.id}>
                  {item.chain.name} ({item.balance} {selectedToken})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300 font-medium block mb-2">
              Destination Chain
            </label>
            <select
              value={destinationChainId || ''}
              onChange={(e) =>
                onSetDestinationChainId(parseInt(e.target.value) || null)
              }
              disabled={!sourceChainId}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select destination chain...</option>
              {[...SUPPORTED_CHAINS]
                .filter((id) => id !== sourceChainId)
                .map((id) => (
                  <option key={id} value={id}>
                    {CHAIN_NAMES[id]}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300 font-medium block mb-2">
              Amount
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={bridgeAmount}
                onChange={(e) => onSetBridgeAmount(e.target.value)}
                placeholder="0.0"
                className="flex-1"
                disabled={!sourceChainId}
              />
              <Button
                onClick={onMaxAmount}
                disabled={!sourceChainId}
                variant="secondary"
                className="px-4"
              >
                Max
              </Button>
            </div>
            {sourceChainBalance && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Available: {sourceChainBalance.balance} {selectedToken}
              </div>
            )}
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
            className="w-full"
          >
            {isBridging ? 'Bridging...' : `Bridge ${selectedToken || 'Token'}`}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {availableTokens.map((balance) => (
          <TokenBalanceCard key={balance.symbol} balance={balance} />
        ))}
      </div>
    </div>
  );
}
