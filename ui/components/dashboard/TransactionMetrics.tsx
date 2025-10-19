import { MetricCard } from './MetricCard';
import { UserActivity, BridgeActivity, Split } from '@/types/web3';

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
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <MetricCard
        label="Transactions"
        value={String(userActivity?.transactionCount || 0)}
      />
      <MetricCard label="Active Splits" value={String(splits.length)} />
      <MetricCard
        label="Bridge Deposits"
        value={String(bridgeActivity?.BridgeDeposit.length || 0)}
      />
      <MetricCard
        label="Bridge Withdrawals"
        value={String(bridgeActivity?.BridgeWithdraw.length || 0)}
      />
    </div>
  );
}
