-- Sprint 1: financial core
-- Run this migration in Supabase SQL Editor after schema.sql.
-- The functions below make transaction + balance changes atomic.

create or replace function public.assert_account_owner(p_account_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.accounts
    where id = p_account_id and user_id = p_user_id
  ) then
    raise exception 'Account not found or not owned by user';
  end if;
end;
$$;

create or replace function public.create_financial_transaction(
  p_user_id uuid,
  p_account_id uuid,
  p_destination_account_id uuid,
  p_type text,
  p_category_id uuid,
  p_amount numeric,
  p_description text,
  p_merchant text,
  p_occurred_on date,
  p_source text default 'manual'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Unauthorized';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  if p_type not in ('expense','income','transfer','investment','balance_adjustment') then
    raise exception 'Invalid transaction type';
  end if;

  perform public.assert_account_owner(p_account_id, p_user_id);

  if p_destination_account_id is not null then
    perform public.assert_account_owner(p_destination_account_id, p_user_id);
    if p_destination_account_id = p_account_id then
      raise exception 'Source and destination accounts must differ';
    end if;
  end if;

  if p_type in ('transfer','investment') and p_destination_account_id is null then
    raise exception 'Destination account is required';
  end if;

  if p_type in ('expense','income') and p_destination_account_id is not null then
    raise exception 'Destination account is not allowed for this transaction type';
  end if;

  if p_category_id is not null and not exists (
    select 1 from public.categories
    where id = p_category_id and user_id = p_user_id
  ) then
    raise exception 'Category not found or not owned by user';
  end if;

  insert into public.transactions (
    user_id, account_id, destination_account_id, type, category_id,
    amount, description, merchant, occurred_on, source
  ) values (
    p_user_id, p_account_id, p_destination_account_id, p_type, p_category_id,
    p_amount, nullif(trim(p_description), ''), nullif(trim(p_merchant), ''),
    coalesce(p_occurred_on, current_date), p_source
  )
  returning id into v_id;

  update public.accounts
  set calculated_balance = calculated_balance +
    case when p_type in ('expense','transfer','investment') then -p_amount else p_amount end
  where id = p_account_id and user_id = p_user_id;

  if p_destination_account_id is not null then
    update public.accounts
    set calculated_balance = calculated_balance + p_amount
    where id = p_destination_account_id and user_id = p_user_id;
  end if;

  return v_id;
end;
$$;

create or replace function public.update_financial_transaction(
  p_transaction_id uuid,
  p_user_id uuid,
  p_account_id uuid,
  p_destination_account_id uuid,
  p_type text,
  p_category_id uuid,
  p_amount numeric,
  p_description text,
  p_merchant text,
  p_occurred_on date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old public.transactions%rowtype;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Unauthorized';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  select * into v_old
  from public.transactions
  where id = p_transaction_id and user_id = p_user_id
  for update;

  if not found then
    raise exception 'Transaction not found';
  end if;

  perform public.assert_account_owner(p_account_id, p_user_id);
  if p_destination_account_id is not null then
    perform public.assert_account_owner(p_destination_account_id, p_user_id);
    if p_destination_account_id = p_account_id then
      raise exception 'Source and destination accounts must differ';
    end if;
  end if;

  if p_type not in ('expense','income','transfer','investment','balance_adjustment') then
    raise exception 'Invalid transaction type';
  end if;

  if p_type in ('transfer','investment') and p_destination_account_id is null then
    raise exception 'Destination account is required';
  end if;

  if p_type in ('expense','income') and p_destination_account_id is not null then
    raise exception 'Destination account is not allowed for this transaction type';
  end if;

  if p_category_id is not null and not exists (
    select 1 from public.categories
    where id = p_category_id and user_id = p_user_id
  ) then
    raise exception 'Category not found or not owned by user';
  end if;

  -- Revert the old transaction while holding row locks on affected accounts.
  update public.accounts
  set calculated_balance = calculated_balance -
    case when v_old.type in ('expense','transfer','investment') then -v_old.amount else v_old.amount end
  where id = v_old.account_id and user_id = p_user_id;

  if v_old.destination_account_id is not null then
    update public.accounts
    set calculated_balance = calculated_balance - v_old.amount
    where id = v_old.destination_account_id and user_id = p_user_id;
  end if;

  update public.transactions
  set account_id = p_account_id,
      destination_account_id = p_destination_account_id,
      type = p_type,
      category_id = p_category_id,
      amount = p_amount,
      description = nullif(trim(p_description), ''),
      merchant = nullif(trim(p_merchant), ''),
      occurred_on = coalesce(p_occurred_on, current_date)
  where id = p_transaction_id and user_id = p_user_id;

  -- Apply the new transaction.
  update public.accounts
  set calculated_balance = calculated_balance +
    case when p_type in ('expense','transfer','investment') then -p_amount else p_amount end
  where id = p_account_id and user_id = p_user_id;

  if p_destination_account_id is not null then
    update public.accounts
    set calculated_balance = calculated_balance + p_amount
    where id = p_destination_account_id and user_id = p_user_id;
  end if;

  return p_transaction_id;
end;
$$;

create or replace function public.delete_financial_transaction(
  p_transaction_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old public.transactions%rowtype;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Unauthorized';
  end if;

  select * into v_old
  from public.transactions
  where id = p_transaction_id and user_id = p_user_id
  for update;

  if not found then
    raise exception 'Transaction not found';
  end if;

  perform public.assert_account_owner(v_old.account_id, p_user_id);
  if v_old.destination_account_id is not null then
    perform public.assert_account_owner(v_old.destination_account_id, p_user_id);
  end if;

  update public.accounts
  set calculated_balance = calculated_balance -
    case when v_old.type in ('expense','transfer','investment') then -v_old.amount else v_old.amount end
  where id = v_old.account_id and user_id = p_user_id;

  if v_old.destination_account_id is not null then
    update public.accounts
    set calculated_balance = calculated_balance - v_old.amount
    where id = v_old.destination_account_id and user_id = p_user_id;
  end if;

  delete from public.transactions
  where id = p_transaction_id and user_id = p_user_id;
end;
$$;

revoke all on function public.assert_account_owner(uuid, uuid) from public;
revoke all on function public.create_financial_transaction(uuid, uuid, uuid, text, uuid, numeric, text, text, date, text) from public;
revoke all on function public.update_financial_transaction(uuid, uuid, uuid, uuid, text, uuid, numeric, text, text, date) from public;
revoke all on function public.delete_financial_transaction(uuid, uuid) from public;

grant execute on function public.create_financial_transaction(uuid, uuid, uuid, text, uuid, numeric, text, text, date, text) to authenticated;
grant execute on function public.update_financial_transaction(uuid, uuid, uuid, uuid, text, uuid, numeric, text, text, date) to authenticated;
grant execute on function public.delete_financial_transaction(uuid, uuid) to authenticated;
