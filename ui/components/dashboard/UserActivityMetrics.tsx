import { MetricCard } from './MetricCard';
import { UserActivity } from '@/types/web3';

interface UserActivityMetricsProps {
  userActivity: UserActivity | null;
}

export function UserActivityMetrics({
  userActivity,
}: UserActivityMetricsProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <MetricCard
        label="Total Spent (ETH)"
        value={
          userActivity
            ? `${(Number(userActivity.totalSpentETH) / 1e18).toFixed(4)} ETH`
            : '0.0000 ETH'
        }
      />
      <MetricCard
        label="Total Spent (USD)"
        value={
          userActivity
            ? `$${(Number(userActivity.totalSpentUSD) / 1e6).toFixed(2)}`
            : '$0.00'
        }
      />
      <MetricCard
        label="Total Received (ETH)"
        value={
          userActivity
            ? `${(Number(userActivity.totalReceivedETH) / 1e18).toFixed(4)} ETH`
            : '0.0000 ETH'
        }
      />
      <MetricCard
        label="Total Received (USD)"
        value={
          userActivity
            ? `$${(Number(userActivity.totalReceivedUSD) / 1e6).toFixed(2)}`
            : '$0.00'
        }
      />
    </div>
  );
}
