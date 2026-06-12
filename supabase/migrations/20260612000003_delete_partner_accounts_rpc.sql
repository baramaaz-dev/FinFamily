-- ============================================================
-- Migration: delete_partner_accounts_rpc
-- Description: Creates the delete_partner_accounts RPC function.
--   Guards against deletion when the partner's accounts have any
--   journal_entry_lines, raising ACCOUNTS_HAVE_ENTRIES. (S-087)
-- Depends on: 20260611120000_auto_partner_accounts_trigger
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Task 1 — RPC function: delete_partner_accounts
-- NOTE: Run this CREATE FUNCTION as a standalone statement in
--   the Supabase SQL editor (do not combine with other DDL).
-- ────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS delete_partner_accounts(uuid);

CREATE OR REPLACE FUNCTION delete_partner_accounts(p_person_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_entries boolean := false;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM   journal_entry_lines jel
    JOIN   accounts a ON a.id = jel.account_id
    WHERE  a.metadata->>'partner_id' = p_person_id::text
  ) INTO v_has_entries;

  IF v_has_entries THEN
    RAISE EXCEPTION 'ACCOUNTS_HAVE_ENTRIES'
      USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM accounts
  WHERE metadata->>'partner_id' = p_person_id::text;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- Task 2 — Grant
-- ────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION delete_partner_accounts(uuid) TO authenticated;

-- ════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (run manually in Supabase SQL editor)
-- ════════════════════════════════════════════════════════════

-- Test A: confirm function exists
-- SELECT proname, prosecdef
-- FROM pg_proc
-- WHERE proname = 'delete_partner_accounts';

-- Test B: call with a person who has no journal entries (should delete accounts)
-- SELECT delete_partner_accounts('<person_uuid_with_no_entries>');
-- Then verify: SELECT * FROM accounts WHERE metadata->>'partner_id' = '<person_uuid_with_no_entries>';

-- Test C: call with a person who has journal entries (should raise ACCOUNTS_HAVE_ENTRIES)
-- SELECT delete_partner_accounts('<person_uuid_with_entries>');
-- (must raise: ACCOUNTS_HAVE_ENTRIES)
