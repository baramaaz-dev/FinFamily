import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

export interface AssetSlice {
  name : string;
  value: number;
  type : string;
}

interface AssetDistributionChartProps {
  slices   : AssetSlice[];
  isLoading: boolean;
}

const SLICE_COLOR: Record<string, string> = {
  cash_usd : '#1A7D4F',
  cash_syp : '#B45309',
  gold     : '#854009',
  project  : '#1E5DC4',
  property : '#0D2D6B',
};

function getSliceColor(type: string): string {
  return SLICE_COLOR[type] ?? '#94A3B8';
}

function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function AssetChartSkeleton() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
      <div className="w-32 h-5 bg-[#F1F5F9] animate-pulse rounded mb-4" />
      <div className="flex justify-center">
        <div className="w-[200px] h-[200px] bg-[#F1F5F9] animate-pulse rounded-full" />
      </div>
      <div className="flex gap-3 mt-4 flex-wrap">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-[#F1F5F9] animate-pulse rounded-full" />
            <div className="w-16 h-3 bg-[#F1F5F9] animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface TooltipEntry {
  name   : string;
  value  : number;
  payload: { total: number };
}

interface CustomTooltipProps {
  active? : boolean;
  payload?: TooltipEntry[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  const { t } = useTranslation();
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0];
  const value = entry.value;
  const total = entry.payload.total;
  const pct   = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-md p-2 shadow-sm">
      <p className="text-sm font-medium text-[#1E293B]">{entry.name}</p>
      <p className="font-mono text-sm text-[#1E293B] mt-0.5">
        {t('dashboard.assetChart.tooltipValue').replace('{value}', formatUSD(value))}
      </p>
      <p className="font-mono text-xs text-[#475569]">
        {t('dashboard.assetChart.tooltipPercent').replace('{percent}', pct)}
      </p>
    </div>
  );
}

export default function AssetDistributionChart({
  slices,
  isLoading,
}: AssetDistributionChartProps) {
  const { t } = useTranslation();

  if (isLoading) return <AssetChartSkeleton />;

  const total     = slices.reduce((s, sl) => s + sl.value, 0);
  const chartData = slices.map((sl) => ({ ...sl, total }));

  if (slices.length === 0) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
        <h2 className="text-lg font-medium text-[#1E293B] mb-4">
          {t('dashboard.assetChart.title')}
        </h2>
        <p className="text-sm text-[#94A3B8] text-center py-8">
          {t('dashboard.assetChart.empty')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">

      <h2 className="text-lg font-medium text-[#1E293B] mb-4">
        {t('dashboard.assetChart.title')}
      </h2>

      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getSliceColor(entry.type)}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Custom legend */}
      <div className="flex flex-wrap gap-3 mt-3">
        {slices.map((sl, idx) => {
          const pct = total > 0 ? ((sl.value / total) * 100).toFixed(1) : '0.0';
          return (
            <div key={idx} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: getSliceColor(sl.type) }}
              />
              <span className="text-xs text-[#475569] truncate max-w-[8rem]">
                {sl.name}
              </span>
              <span className="font-mono text-xs text-[#94A3B8]">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
}
