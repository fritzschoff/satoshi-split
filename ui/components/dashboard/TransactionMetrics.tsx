import { useMemo } from 'react';
import { MetricCard } from './MetricCard';
import { UserActivity, BridgeActivity, Split } from '@/types/web3';
import {
  getTokenSymbol,
  getTokenDecimals,
  formatTokenAmount,
} from '@/utils/token';

interface TransactionMetricsProps {
  userActivity: UserActivity | null;
  splits: Split[];
  bridgeActivity: BridgeActivity | null;
}

export function TransactionMetrics({
  userActivity,
  splits,
  bridgeActivity,
}: TransactionMetricsProps) {
  const withdrawStats = useMemo(() => {
    if (!bridgeActivity?.BridgeWithdraw.length) return null;

    const totalsByToken: Record<string, bigint> = {};
    bridgeActivity.BridgeWithdraw.forEach((withdraw) => {
      const token = withdraw.token;
      const current = totalsByToken[token] || BigInt(0);
      totalsByToken[token] = current + BigInt(withdraw.amount);
    });

    const topToken = Object.entries(totalsByToken).sort(
      ([, a], [, b]) => Number(b) - Number(a)
    )[0];

    if (!topToken) return null;

    const [tokenAddress, totalAmount] = topToken;
    const symbol = getTokenSymbol(tokenAddress);
    const decimals = getTokenDecimals(tokenAddress);
    const formatted = formatTokenAmount(totalAmount.toString(), decimals);

    return `${formatted} ${symbol}`;
  }, [bridgeActivity]);

  const depositStats = useMemo(() => {
    if (!bridgeActivity?.BridgeDeposit.length) return null;

    const uniqueChains = new Set(
      bridgeActivity.BridgeDeposit.map((d) => d.chainId)
    );

    return uniqueChains.size > 1
      ? `across ${uniqueChains.size} chains`
      : 'single chain';
  }, [bridgeActivity]);

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <MetricCard
        label="Transactions"
        value={String(userActivity?.transactionCount || 0)}
      />
      <MetricCard
        label="Active Splits"
        value={String(splits.length)}
        description={splits.length > 0 ? 'splits you are part of' : undefined}
      />
      <MetricCard
        label="Bridge Deposits"
        value={String(bridgeActivity?.BridgeDeposit.length || 0)}
        description={depositStats || undefined}
      />
      <MetricCard
        label="Bridge Withdrawals"
        value={String(bridgeActivity?.BridgeWithdraw.length || 0)}
        description={withdrawStats || undefined}
      />
    </div>
  );
}
