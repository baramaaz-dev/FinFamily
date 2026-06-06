import { useTranslation } from 'react-i18next';
import { cn }             from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
}                         from '@/components/ui/select';
import { Input }          from '@/components/ui/input';
import { Button }         from '@/components/ui/button';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TransactionsFiltersProps {
  filterType:        'all' | 'income' | 'expense' | 'transfer';
  filterPortfolio:   string;
  filterDateFrom:    string;
  filterDateTo:      string;
  portfolioOptions:  Array<{ id: string; name: string }>;
  hasActiveFilters:  boolean;
  resultCount:       number;
  totalCount:        number;
  onTypeChange:      (v: 'all' | 'income' | 'expense' | 'transfer') => void;
  onPortfolioChange: (v: string) => void;
  onDateFromChange:  (v: string) => void;
  onDateToChange:    (v: string) => void;
  onClearAll:        () => void;
  filterSearch:      string;
  onSearchChange:    (v: string) => void;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function typeBadgeClass(type: 'income' | 'expense' | 'transfer'): string {
  const map = {
    income:   'bg-[#EBF5F0] text-[#1A7D4F]',
    expense:  'bg-[#FEF0EF] text-[#C0392B]',
    transfer: 'bg-[#E8F0FB] text-[#1E5DC4]',
  };
  return map[type];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TransactionsFilters({
  filterType, filterPortfolio, filterDateFrom, filterDateTo,
  portfolioOptions, hasActiveFilters, resultCount, totalCount,
  onTypeChange, onPortfolioChange, onDateFromChange, onDateToChange, onClearAll,
  filterSearch, onSearchChange,
}: TransactionsFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white px-4 py-3">
      <div className="flex flex-wrap items-end gap-4">

        {/* Search */}
        <div>
          <p className="mb-1 text-xs text-[#475569]">{t('transactions.filters.search')}</p>
          <Input
            type="text"
            value={filterSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('transactions.filters.searchPlaceholder')}
            className="h-8 w-52 border-[#E2E8F0] text-sm focus-visible:ring-[#1E5DC4]"
          />
        </div>

        {/* Type filter */}
        <div>
          <p className="mb-1 text-xs text-[#475569]">{t('transactions.filters.type')}</p>
          <div className="flex gap-1.5">

            {/* All */}
            <button
              type="button"
              onClick={() => onTypeChange('all')}
              className={cn(
                'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                filterType === 'all'
                  ? 'bg-[#1E293B] text-white'
                  : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]',
              )}
            >
              {t('transactions.filters.allTypes')}
            </button>

            {/* income / expense / transfer */}
            {(['income', 'expense', 'transfer'] as const).map((txType) => (
              <button
                key={txType}
                type="button"
                onClick={() => onTypeChange(txType)}
                className={cn(
                  'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                  filterType === txType
                    ? typeBadgeClass(txType)
                    : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]',
                )}
              >
                {t(`transactions.types.${txType}`)}
              </button>
            ))}

          </div>
        </div>

        {/* Portfolio filter */}
        <div>
          <p className="mb-1 text-xs text-[#475569]">{t('transactions.filters.portfolio')}</p>
          <Select
            value={filterPortfolio || 'all'}
            onValueChange={(v) => onPortfolioChange(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-8 w-44 border-[#E2E8F0] text-sm focus:ring-[#1E5DC4]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('transactions.filters.allPortfolios')}</SelectItem>
              {portfolioOptions.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date From */}
        <div>
          <p className="mb-1 text-xs text-[#475569]">{t('transactions.filters.dateFrom')}</p>
          <Input
            type="date"
            value={filterDateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="h-8 w-36 border-[#E2E8F0] text-sm focus-visible:ring-[#1E5DC4]"
          />
        </div>

        {/* Date To */}
        <div>
          <p className="mb-1 text-xs text-[#475569]">{t('transactions.filters.dateTo')}</p>
          <Input
            type="date"
            value={filterDateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="h-8 w-36 border-[#E2E8F0] text-sm focus-visible:ring-[#1E5DC4]"
          />
        </div>

        {/* Results count + Clear button */}
        <div className="ms-auto flex items-end gap-3 pb-0.5">
          {totalCount > 0 && (
            <span className="text-xs text-[#94A3B8]">
              {t('transactions.filters.showing')
                .replace('{count}', resultCount.toLocaleString('ar-SA'))
                .replace('{total}', totalCount.toLocaleString('ar-SA'))}
            </span>
          )}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="h-8 border-[#E2E8F0] text-xs text-[#475569] hover:bg-[#F1F5F9]"
            >
              {t('transactions.filters.clearAll')}
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
