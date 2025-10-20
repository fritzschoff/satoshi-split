import { MetricCard } from './MetricCard';
import { TokenBalanceCard } from './TokenBalanceCard';
import { Button } from '@/components/ui/Button';
import { UserAsset, SUPPORTED_TOKENS } from '@avail-project/nexus-widgets';
import { SUPPORTED_TOKENS_BY_SYMBOL } from '@/constants/tokens';

interface UnifiedBalanceSectionProps {
  unifiedBalance: UserAsset[] | null;
  isInitialized: boolean;
  error: Error | null;
  selectedToken: SUPPORTED_TOKENS | null;
  sourceChainId: number | null;
  destinationChainId: number | null;
  bridgeAmount: string;
  isBridging: boolean;
  bridgeError: string | null;
  onInitSDK: () => void;
  onSetSelectedToken: (token: SUPPORTED_TOKENS) => void;
  onSetSourceChainId: (chainId: number) => void;
  onSetDestinationChainId: (chainId: number | null) => void;
  onSetBridgeAmount: (amount: string) => void;
  onMaxAmount: () => void;
  onBridge: () => void;
  onSourceChainChange: (chainId: number) => void;
}

export function UnifiedBalanceSection({
  unifiedBalance,
  isInitialized,
  error,
  selectedToken,
  sourceChainId,
  destinationChainId,
  bridgeAmount,
  isBridging,
  bridgeError,
  onInitSDK,
  onSetSelectedToken,
  onSetSourceChainId,
  onSetDestinationChainId,
  onSetBridgeAmount,
  onMaxAmount,
  onBridge,
  onSourceChainChange,
}: UnifiedBalanceSectionProps) {
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

  return (
    <div className="grid md:grid-cols-2 gap-4 mb-8">
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

      {unifiedBalance
        ?.filter((balance) =>
          SUPPORTED_TOKENS_BY_SYMBOL.includes(
            balance.symbol as (typeof SUPPORTED_TOKENS_BY_SYMBOL)[number]
          )
        )
        .map((balance) => (
          <TokenBalanceCard
            key={balance.symbol}
            balance={balance}
            selectedToken={selectedToken}
            sourceChainId={sourceChainId}
            destinationChainId={destinationChainId}
            bridgeAmount={bridgeAmount}
            isBridging={isBridging}
            bridgeError={bridgeError}
            onSetSelectedToken={onSetSelectedToken}
            onSetDestinationChainId={onSetDestinationChainId}
            onSetBridgeAmount={onSetBridgeAmount}
            onMaxAmount={onMaxAmount}
            onBridge={onBridge}
            onSourceChainChange={onSourceChainChange}
          />
        ))}
    </div>
  );
}
