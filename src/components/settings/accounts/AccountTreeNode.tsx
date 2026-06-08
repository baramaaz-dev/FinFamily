import { ChevronDown, ChevronRight, ChevronLeft, Minus, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDirection } from '@/hooks/useDirection';
import type { AccountNode } from '@/types';
import AccountClassBadge from './AccountClassBadge';

interface AccountTreeNodeProps {
  node:        AccountNode;
  depth:       number;
  isExpanded:  boolean;
  expandedIds: Set<string>;
  onToggle:    (id: string) => void;
}

export default function AccountTreeNode({
  node,
  depth,
  isExpanded,
  expandedIds,
  onToggle,
}: AccountTreeNodeProps) {
  const { t }     = useTranslation();
  const { isRTL } = useDirection();

  const hasChildren = node.children.length > 0;
  const inactiveClass = !node.is_active ? 'line-through opacity-50' : '';

  return (
    <>
      <div className="flex items-center gap-2 py-2 px-3 border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">

        {/* Col 1: indent + toggle + code + name */}
        <div
          className="flex-1 min-w-0 flex items-center gap-1"
          style={{ paddingInlineStart: `${depth * 20}px` }}
        >
          {hasChildren ? (
            <button
              onClick={() => onToggle(node.id)}
              className="flex-shrink-0 text-[#475569] hover:text-[#1E293B] transition-colors"
              aria-label={isExpanded ? 'collapse' : 'expand'}
            >
              {isExpanded
                ? <ChevronDown size={14} />
                : isRTL
                  ? <ChevronLeft size={14} />
                  : <ChevronRight size={14} />
              }
            </button>
          ) : (
            <span className="flex-shrink-0 text-[#94A3B8]">
              <Minus size={14} />
            </span>
          )}

          <span className={`font-mono text-sm font-medium text-[#1E293B] flex-shrink-0 ${inactiveClass}`}>
            {node.code}
          </span>
          <span className={`text-sm text-[#475569] ms-2 truncate ${inactiveClass}`}>
            {node.name}
          </span>
        </div>

        {/* Col 2: account class badge */}
        <div className="w-32 flex-shrink-0">
          <AccountClassBadge accountClass={node.account_class} />
        </div>

        {/* Col 3: normal balance badge */}
        <div className="w-24 flex-shrink-0">
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
              node.normal_balance === 'debit'
                ? 'text-[#1E5DC4] bg-[#E8F0FB]'
                : 'text-[#1A7D4F] bg-[#EBF5F0]'
            }`}
          >
            {t(`settings.accounts.normalBalance.${node.normal_balance}`)}
          </span>
        </div>

        {/* Col 4: postable indicator */}
        <div className="w-28 flex-shrink-0 flex items-center gap-1">
          {node.is_postable ? (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-[#1A7D4F] flex-shrink-0" />
              <span className="text-xs text-[#1A7D4F]">{t('settings.accounts.postable.yes')}</span>
            </>
          ) : (
            <span className="text-xs text-[#94A3B8]">— {t('settings.accounts.postable.no')}</span>
          )}
        </div>

        {/* Col 5: disabled action buttons */}
        <div className="w-24 flex-shrink-0 flex items-center gap-1">
          <button
            disabled
            title={t('settings.accounts.lockedTooltip')}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#94A3B8] cursor-not-allowed opacity-60 border border-[#E2E8F0] bg-[#F1F5F9]"
          >
            <Lock size={11} />
            {t('settings.accounts.actions.edit')}
          </button>
          <button
            disabled
            title={t('settings.accounts.lockedTooltip')}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#94A3B8] cursor-not-allowed opacity-60 border border-[#E2E8F0] bg-[#F1F5F9]"
          >
            <Lock size={11} />
            {t('settings.accounts.actions.delete')}
          </button>
        </div>

      </div>

      {isExpanded && hasChildren && node.children.map(child => (
        <AccountTreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          isExpanded={expandedIds.has(child.id)}
          expandedIds={expandedIds}
          onToggle={onToggle}
        />
      ))}
    </>
  );
}
