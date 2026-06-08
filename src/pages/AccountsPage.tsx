import { useState, useMemo }   from 'react';
import { useQuery }             from '@tanstack/react-query';
import { useTranslation }       from 'react-i18next';
import { BookOpen, Lock }       from 'lucide-react';
import { supabaseClient }       from '@/lib/supabase';
import type { Account, AccountNode } from '@/types';
import AccountTreeNode          from '@/components/settings/accounts/AccountTreeNode';

// ─── Data helpers ─────────────────────────────────────────────────────────────

async function fetchAccounts(): Promise<Account[]> {
  const { data, error } = await supabaseClient
    .from('accounts')
    .select('id, parent_id, code, name, account_class, normal_balance, level, is_postable, is_active, created_at')
    .eq('is_active', true)
    .order('code', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

function buildTree(accounts: Account[]): AccountNode[] {
  const map  = new Map<string, AccountNode>();
  const roots: AccountNode[] = [];
  accounts.forEach(a => map.set(a.id, { ...a, children: [] }));
  accounts.forEach(a => {
    const node = map.get(a.id)!;
    if (a.parent_id && map.has(a.parent_id)) {
      map.get(a.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

const IFRS_CATEGORIES = [
  { key: 'balance',   colorText: '#1E5DC4', colorBg: '#E8F0FB' },
  { key: 'operating', colorText: '#1A7D4F', colorBg: '#EBF5F0' },
  { key: 'investing', colorText: '#B45309', colorBg: '#FEF7EC' },
  { key: 'financing', colorText: '#475569', colorBg: '#F1F5F9' },
] as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function AccountsSkeleton() {
  return (
    <div className="p-4 space-y-2">
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
        <div
          key={i}
          className="h-8 bg-[#F1F5F9] rounded animate-pulse"
          style={{ marginInlineStart: i < 3 ? 0 : i < 6 ? '20px' : '40px' }}
        />
      ))}
    </div>
  );
}

function AccountsEmpty() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <BookOpen size={40} className="text-[#94A3B8]" />
      <p className="text-[#94A3B8] text-sm mt-2">{t('settings.accounts.empty')}</p>
    </div>
  );
}

function AccountsError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
      <p className="text-[#475569] text-sm">{t('settings.accounts.error')}</p>
      <button
        onClick={onRetry}
        className="text-sm text-[#1E5DC4] border border-[#1E5DC4] rounded-md px-3 py-1.5 hover:bg-[#E8F0FB] transition-colors"
      >
        {t('settings.accounts.retry')}
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AccountsPage() {
  const { t } = useTranslation();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['accounts'],
    queryFn:  fetchAccounts,
    staleTime: 5 * 60 * 1000,
  });

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const tree = useMemo(() => buildTree(data ?? []), [data]);

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function expandAll() {
    setExpandedIds(new Set(data?.map(a => a.id) ?? []));
  }

  function collapseAll() {
    setExpandedIds(new Set());
  }

  return (
    <div className="p-6 space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-[#1E293B]">
            {t('settings.accounts.title')}
          </h1>
          <p className="text-sm text-[#475569] mt-1">
            {t('settings.accounts.subtitle')}
          </p>
        </div>
        <button
          disabled
          title={t('settings.accounts.lockedTooltip')}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed border border-[#E2E8F0]"
        >
          <Lock size={14} />
          {t('settings.accounts.addAccount')}
        </button>
      </div>

      {/* IFRS 18 category banner */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {IFRS_CATEGORIES.map(cat => (
          <div
            key={cat.key}
            className="rounded-lg border p-3"
            style={{ borderColor: cat.colorBg, backgroundColor: cat.colorBg }}
          >
            <p className="text-xs font-medium" style={{ color: cat.colorText }}>
              {t(`settings.accounts.ifrsCategories.${cat.key}`)}
            </p>
            <p className="text-xs mt-0.5 text-[#475569] font-mono">
              {t(`settings.accounts.ifrsCodes.${cat.key}`)}
            </p>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <button
            onClick={expandAll}
            className="text-xs text-[#475569] hover:text-[#1E293B] transition-colors"
          >
            {t('settings.accounts.expandAll')}
          </button>
          <span className="text-[#E2E8F0]">|</span>
          <button
            onClick={collapseAll}
            className="text-xs text-[#475569] hover:text-[#1E293B] transition-colors"
          >
            {t('settings.accounts.collapseAll')}
          </button>
        </div>

        {/* Table header */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-medium text-[#475569]">
          <span className="flex-1">
            {t('settings.accounts.columns.code')} / {t('settings.accounts.columns.name')}
          </span>
          <span className="w-32">{t('settings.accounts.columns.class')}</span>
          <span className="w-24">{t('settings.accounts.columns.normalBalance')}</span>
          <span className="w-28">{t('settings.accounts.columns.postable')}</span>
          <span className="w-24">{t('settings.accounts.columns.actions')}</span>
        </div>

        {/* Tree body */}
        {isLoading && <AccountsSkeleton />}
        {isError   && <AccountsError onRetry={() => refetch()} />}
        {!isLoading && !isError && tree.length === 0 && <AccountsEmpty />}
        {!isLoading && !isError && tree.length > 0 && (
          <div>
            {tree.map(node => (
              <AccountTreeNode
                key={node.id}
                node={node}
                depth={0}
                isExpanded={expandedIds.has(node.id)}
                expandedIds={expandedIds}
                onToggle={toggleExpand}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
