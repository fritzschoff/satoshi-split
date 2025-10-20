import { Card, CardContent } from '@/components/ui/Card';

interface MetricCardProps {
  label: string;
  value: string;
  sublabel?: string;
  description?: string;
}

export function MetricCard({
  label,
  value,
  sublabel,
  description,
}: MetricCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          {label}
        </div>
        {sublabel && (
          <div className="text-[10px] text-gray-600 dark:text-gray-400 mb-1">
            {sublabel}
          </div>
        )}
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </div>
        {description && (
          <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-1">
            {description}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
