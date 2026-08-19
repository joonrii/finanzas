-- Sprint 1: make balance adjustments atomic.
-- Run after 0002_financial_core.sql.

create or replace function public.create_balance_adjustment(
  p_user_id uuid,
  p_account_id uuid,
  p_amount numeric,
  p_description text default 'Ajuste de saldo',
  p_occurred_on date default current_date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction_id uuid;
begin
  perform public.assert_account_owner(p_account_id, p_user_id);

  if p_amount = 0 then
    raise exception 'Adjustment amount cannot be zero';
  end if;

  insert into public.transactions (
    user_id,
    account_id,
    amount,
    description,
    occurred_on,
    type
  ) values (
    p_user_id,
    p_account_id,
    p_amount,
    coalesce(nullif(trim(p_description), ''), 'Ajuste de saldo'),
    coalesce(p_occurred_on, current_date),
    'adjustment'
  )
  returning id into v_transaction_id;

  update public.accounts
  set calculated_balance = coalesce(calculated_balance, 0) + p_amount,
      updated_at = now()
  where id = p_account_id;

  return v_transaction_id;
end;
$$;

grant execute on function public.create_balance_adjustment(uuid, uuid, numeric, text, date) to authenticated;
