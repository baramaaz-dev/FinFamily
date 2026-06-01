-- ============================================================
-- Migration: seed_accounting_periods
-- Description: Seeds 12 monthly accounting periods for fiscal
--   year 2026, all with status 'open'.
--   Idempotent via ON CONFLICT (fiscal_year, period_number)
--   DO NOTHING.
-- Depends on: 20260601000003_add_accounting_core
-- ============================================================

BEGIN;

INSERT INTO accounting_periods
  (fiscal_year, period_number, name, start_date, end_date, status)
VALUES
  (2026,  1, 'يناير 2026',    '2026-01-01', '2026-01-31', 'open'),
  (2026,  2, 'فبراير 2026',   '2026-02-01', '2026-02-28', 'open'),
  (2026,  3, 'مارس 2026',     '2026-03-01', '2026-03-31', 'open'),
  (2026,  4, 'أبريل 2026',    '2026-04-01', '2026-04-30', 'open'),
  (2026,  5, 'مايو 2026',     '2026-05-01', '2026-05-31', 'open'),
  (2026,  6, 'يونيو 2026',    '2026-06-01', '2026-06-30', 'open'),
  (2026,  7, 'يوليو 2026',    '2026-07-01', '2026-07-31', 'open'),
  (2026,  8, 'أغسطس 2026',    '2026-08-01', '2026-08-31', 'open'),
  (2026,  9, 'سبتمبر 2026',   '2026-09-01', '2026-09-30', 'open'),
  (2026, 10, 'أكتوبر 2026',   '2026-10-01', '2026-10-31', 'open'),
  (2026, 11, 'نوفمبر 2026',   '2026-11-01', '2026-11-30', 'open'),
  (2026, 12, 'ديسمبر 2026',   '2026-12-01', '2026-12-31', 'open')
ON CONFLICT (fiscal_year, period_number) DO NOTHING;

COMMIT;
