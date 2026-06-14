-- S-10001: Add 'cash' as a valid entity_type in distributions
-- Drops the existing check constraint and re-adds it with 'cash' included.
-- No data migration needed — existing rows use 'portfolio', 'property', or 'project'.

ALTER TABLE distributions
  DROP CONSTRAINT IF EXISTS distributions_entity_type_check;

ALTER TABLE distributions
  ADD CONSTRAINT distributions_entity_type_check
  CHECK (entity_type IN ('portfolio', 'property', 'project', 'cash'));
