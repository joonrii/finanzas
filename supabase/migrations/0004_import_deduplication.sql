-- Sprint 1: robust import deduplication
-- Adds a unique constraint for imported transaction fingerprints.
-- NULL hashes are allowed and are not considered duplicates by PostgreSQL.

create unique index if not exists imported_transactions_dedupe_hash_unique
  on public.imported_transactions (dedupe_hash)
  where dedupe_hash is not null;

comment on index public.imported_transactions_dedupe_hash_unique is
  'Prevents the same normalized imported transaction fingerprint from being stored twice.';
