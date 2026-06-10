import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { TooltipContentProps } from 'recharts';
import { useTranslation } from 'react-i18next';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChartSlice {
  name:  string;
  type:  'cash_usd' | 'cash_syp' | 'gold' | 'project' | 'property';
  value: number;
}

interface Props {
  slices:    ChartSlice[];
  isLoading: boolean;
  isError:   boolean;
  onRetry:   () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type ChartDataItem = ChartSlice & { _total: number };

const SLICE_COLOR: Record<ChartSlice['type'], string> = {
  cash_usd: '#1A7D4F',
  cash_syp: '#B45309',
  gold:     '#F5CC8A',
  project:  '#1E5DC4',
  property: '#7FAAE8',
};

function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style:                 'currency',
    currency:              'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload.length) return null;
  const entry = payload[0];
  if (!entry) return null;
  const item  = entry.payload as ChartDataItem;
  const value = typeof entry.value === 'number' ? entry.value : 0;
  const pct   = item._total > 0 ? ((value / item._total) * 100).toFixed(1) : '0.0';
  return (
    <div className="rounded-md border border-[#E2E8F0] bg-white px-3 py-2 shadow-sm text-sm">
      <p className="font-medium text-[#1E293B] mb-1">{item.name}</p>
      <p className="font-mono tabular-nums text-[#1E293B]">{formatUSD(value)}</p>
      <p className="text-[#94A3B8]">{pct}%</p>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function AssetDistributionSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex justify-center mb-4">
        <div className="w-40 h-40 rounded-full bg-[#F1F5F9] flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-white" />
        </div>
      </div>
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#E2E8F0] shrink-0" />
            <div className="h-3 w-28 bg-[#E2E8F0] rounded" />
            <div className="h-3 w-16 bg-[#E2E8F0] rounded ms-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AssetDistributionChart({ slices, isLoading, isError, onRetry }: Props) {
  const { t } = useTranslation();

  const total     = slices.reduce((s, e) => s + e.value, 0);
  const chartData = slices.map((s): ChartDataItem => ({ ...s, _total: total }));

  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
      <h2 className="text-lg font-medium text-[#1E293B] mb-4">
        {t('dashboard.assetChart.title')}
      </h2>

      {isLoading && <AssetDistributionSkeleton />}

      {!isLoading && isError && (
        <div className="flex flex-col items-center gap-3 py-8 text-[#C0392B]">
          <p className="text-sm">{t('dashboard.assetChart.error')}</p>
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-md text-sm font-medium text-white
                       bg-[#C0392B] hover:bg-[#922B21] transition-colors"
          >
            {t('dashboard.assetChart.retry')}
          </button>
        </div>
      )}

      {!isLoading && !isError && slices.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-[#94A3B8]">{t('dashboard.assetChart.empty')}</p>
        </div>
      )}

      {!isLoading && !isError && slices.length > 0 && (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={SLICE_COLOR[entry.type]} />
                ))}
              </Pie>
              <Tooltip content={ChartTooltip} />
            </PieChart>
          </ResponsiveContainer>

          <ul className="mt-2 space-y-2">
            {slices.map((slice) => {
              const pct = total > 0
                ? ((slice.value / total) * 100).toFixed(1)
                : '0.0';
              return (
                <li key={slice.name} className="flex items-center gap-2 text-sm">
                  <span
                    className="inline-block w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: SLICE_COLOR[slice.type] }}
                  />
                  <span className="text-[#1E293B] truncate flex-1">{slice.name}</span>
                  <span className="font-mono tabular-nums text-[#475569] shrink-0">
                    {formatUSD(slice.value)}
                  </span>
                  <span className="text-[#94A3B8] text-xs shrink-0 w-10 text-end">
                    {pct}%
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
