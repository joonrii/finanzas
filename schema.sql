-- ============================================================
-- ESQUEMA FINANZAS PERSONALES — Fase 1
-- Pega este archivo completo en Supabase > SQL Editor > Run
-- ============================================================

-- Extensión para generar UUIDs
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- CUENTAS (Imagin, Openbank, MyInvestor, Efectivo, Otra)
-- ------------------------------------------------------------
create table accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('bank', 'investment', 'cash', 'other')),
  provider text, -- 'imagin' | 'openbank' | 'myinvestor' | null
  calculated_balance numeric(12,2) not null default 0,
  real_balance numeric(12,2),
  real_balance_updated_at timestamptz,
  currency text not null default 'EUR',
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- CATEGORÍAS (editables por el usuario, con set inicial por defecto)
-- ------------------------------------------------------------
create table categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null default '📦',
  kind text not null default 'expense' check (kind in ('expense', 'income')),
  is_archived boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- MOVIMIENTOS (tabla central)
-- ------------------------------------------------------------
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  -- para transferencias/inversiones, cuenta destino (misma tabla accounts)
  destination_account_id uuid references accounts(id) on delete set null,
  type text not null check (type in ('expense', 'income', 'transfer', 'investment', 'balance_adjustment')),
  category_id uuid references categories(id) on delete set null,
  amount numeric(12,2) not null, -- siempre positivo; el signo lo da "type"
  description text,
  merchant text, -- nombre normalizado del comercio, para reglas y patrones
  occurred_on date not null default current_date,
  source text not null default 'manual' check (source in ('manual', 'import')),
  imported_transaction_id uuid, -- referencia opcional a imported_transactions
  created_at timestamptz not null default now()
);

create index idx_transactions_user_date on transactions(user_id, occurred_on desc);
create index idx_transactions_account on transactions(account_id);
create index idx_transactions_merchant on transactions(user_id, merchant);

-- ------------------------------------------------------------
-- REGLAS DE COMERCIO (para categorización automática + aprendizaje)
-- ------------------------------------------------------------
create table merchant_rules (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  merchant_pattern text not null, -- ej. "MERCADONA"
  category_id uuid not null references categories(id) on delete cascade,
  suggested_account_id uuid references accounts(id) on delete set null,
  match_count int not null default 1, -- cuántas veces se ha confirmado
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, merchant_pattern)
);

-- ------------------------------------------------------------
-- IMPORTACIÓN CSV — lotes e items
-- ------------------------------------------------------------
create table import_batches (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  importer text not null, -- 'imagin' | 'openbank' | 'generic'
  filename text,
  total_rows int not null default 0,
  new_rows int not null default 0,
  duplicate_rows int not null default 0,
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'completed', 'discarded')),
  created_at timestamptz not null default now()
);

create table imported_transactions (
  id uuid primary key default uuid_generate_v4(),
  batch_id uuid not null references import_batches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  raw_date date,
  raw_description text,
  raw_amount numeric(12,2),
  bank_reference text, -- id bancario si el CSV lo trae
  dedupe_hash text not null, -- hash de (cuenta+fecha+importe+descripcion+ref)
  is_duplicate boolean not null default false,
  suggested_category_id uuid references categories(id) on delete set null,
  suggested_type text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'skipped')),
  resulting_transaction_id uuid references transactions(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_imported_dedupe on imported_transactions(user_id, dedupe_hash);

-- ------------------------------------------------------------
-- SNAPSHOTS DE PATRIMONIO (saldo real por cuenta en un momento dado)
-- ------------------------------------------------------------
create table balance_snapshots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  balance numeric(12,2) not null,
  snapshot_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index idx_snapshots_user_date on balance_snapshots(user_id, snapshot_date desc);

-- ------------------------------------------------------------
-- INVERSIONES — cuenta de inversión con detalle de aportaciones
-- (MyInvestor vive también en "accounts" con type='investment';
--  esta tabla guarda el detalle de valor de cartera en el tiempo)
-- ------------------------------------------------------------
create table investment_snapshots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  portfolio_value numeric(12,2) not null,
  snapshot_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Trigger genérico para updated_at en merchant_rules
-- ------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_merchant_rules_updated
before update on merchant_rules
for each row execute function set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY — cada usuario solo ve sus propios datos
-- ============================================================
alter table accounts enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table merchant_rules enable row level security;
alter table import_batches enable row level security;
alter table imported_transactions enable row level security;
alter table balance_snapshots enable row level security;
alter table investment_snapshots enable row level security;

create policy "own accounts" on accounts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own categories" on categories for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own transactions" on transactions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own merchant_rules" on merchant_rules for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own import_batches" on import_batches for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own imported_transactions" on imported_transactions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own balance_snapshots" on balance_snapshots for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own investment_snapshots" on investment_snapshots for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Categorías por defecto — función que se ejecuta al crear un usuario
-- ============================================================
create or replace function create_default_categories()
returns trigger as $$
begin
  insert into categories (user_id, name, icon, kind, sort_order) values
    (new.id, 'Restaurantes', '🍔', 'expense', 1),
    (new.id, 'Alimentación', '🛒', 'expense', 2),
    (new.id, 'Vivienda', '🏠', 'expense', 3),
    (new.id, 'Transporte', '🚗', 'expense', 4),
    (new.id, 'Viajes', '✈️', 'expense', 5),
    (new.id, 'Compras', '🛍️', 'expense', 6),
    (new.id, 'Ocio', '🎮', 'expense', 7),
    (new.id, 'Suscripciones', '📱', 'expense', 8),
    (new.id, 'Salud', '💊', 'expense', 9),
    (new.id, 'Educación', '📚', 'expense', 10),
    (new.id, 'Deporte', '🏋️', 'expense', 11),
    (new.id, 'Otros', '📦', 'expense', 12),
    (new.id, 'Nómina', '💰', 'income', 1),
    (new.id, 'Otros ingresos', '➕', 'income', 2);
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_create_default_categories
after insert on auth.users
for each row execute function create_default_categories();
