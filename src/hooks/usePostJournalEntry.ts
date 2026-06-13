import { useState }      from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabase';
import { toast }          from 'sonner';

type SourceType =
  | 'transaction'
  | 'lease_payment'
  | 'property_expense'
  | 'capital_transaction';

const CACHE_KEYS: Record<SourceType, string[][]> = {
  transaction:         [['transactions'], ['journal-entries'], ['dashboard']],
  lease_payment:       [['lease-payments'], ['journal-entries'], ['dashboard']],
  property_expense:    [['property-expenses'], ['journal-entries'], ['dashboard']],
  capital_transaction: [['capital-transactions'], ['capital-accounts'],
                        ['journal-entries'], ['dashboard']],
};

export function usePostJournalEntry(sourceType: SourceType) {
  const queryClient = useQueryClient();
  const [isPosting, setIsPosting] = useState(false);

  const post = async (sourceId: string): Promise<void> => {
    setIsPosting(true);
    try {
      const { error } = await supabaseClient.rpc('post_journal_entry', {
        p_source_type: sourceType,
        p_source_id:   sourceId,
      });

      if (error) {
        console.error('[usePostJournalEntry] RPC error:', error);
        toast.warning('تم حفظ المعاملة لكن فشل ترحيل القيد المحاسبي.');
        return;
      }

      const keys = CACHE_KEYS[sourceType] ?? [];
      keys.forEach(key =>
        queryClient.invalidateQueries({ queryKey: key })
      );
      queryClient.invalidateQueries({ queryKey: ['journal-entries-pending'] });

    } catch (err) {
      console.error('[usePostJournalEntry] Unexpected error:', err);
      toast.warning('تم حفظ المعاملة لكن فشل ترحيل القيد المحاسبي.');
    } finally {
      setIsPosting(false);
    }
  };

  return { post, isPosting };
}
