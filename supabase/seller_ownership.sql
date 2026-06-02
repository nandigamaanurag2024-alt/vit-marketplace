-- VIT Marketplace — product seller ownership
-- Run in Supabase SQL Editor after schema.sql and messaging.sql
-- Canonical copy: supabase/migrations/002_product_seller_ownership.sql

alter table public.products
  add column if not exists seller_id uuid references auth.users (id) on delete set null;

alter table public.products
  add column if not exists user_id uuid references auth.users (id) on delete set null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'user_id'
  ) then
    update public.products
    set seller_id = user_id
    where seller_id is null
      and user_id is not null;
  end if;
end $$;

create index if not exists products_seller_id_idx
  on public.products (seller_id);

create or replace function public.sync_product_seller_columns()
returns trigger
language plpgsql
as $$
begin
  if new.seller_id is not null then
    new.user_id := new.seller_id;
  elsif new.user_id is not null then
    new.seller_id := new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists products_sync_seller_columns on public.products;
create trigger products_sync_seller_columns
  before insert or update on public.products
  for each row
  execute function public.sync_product_seller_columns();

create or replace function public.product_owner_id(p public.products)
returns uuid
language sql
immutable
as $$
  select coalesce(p.seller_id, p.user_id);
$$;

drop policy if exists "Authenticated can insert products" on public.products;
create policy "Authenticated can insert products"
on public.products
for insert
to authenticated
with check (auth.uid() = coalesce(seller_id, user_id));

drop policy if exists "Authenticated can update own products" on public.products;
create policy "Authenticated can update own products"
on public.products
for update
to authenticated
using (auth.uid() = coalesce(seller_id, user_id))
with check (auth.uid() = coalesce(seller_id, user_id));

drop policy if exists "Authenticated can delete own products" on public.products;
create policy "Authenticated can delete own products"
on public.products
for delete
to authenticated
using (auth.uid() = coalesce(seller_id, user_id));

create or replace function public.get_or_create_conversation(p_product_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer_id uuid;
  v_seller_id uuid;
  v_is_sold boolean;
  v_conversation_id uuid;
begin
  v_buyer_id := auth.uid();
  if v_buyer_id is null then
    raise exception 'Not authenticated';
  end if;

  select coalesce(p.seller_id, p.user_id), p.is_sold
  into v_seller_id, v_is_sold
  from public.products p
  where p.id = p_product_id;

  if v_seller_id is null then
    raise exception 'Product not found or seller unavailable';
  end if;

  if v_is_sold then
    raise exception 'Product is sold';
  end if;

  if v_buyer_id = v_seller_id then
    raise exception 'Cannot message your own listing';
  end if;

  select c.id
  into v_conversation_id
  from public.conversations c
  where c.product_id = p_product_id
    and c.buyer_id = v_buyer_id;

  if v_conversation_id is not null then
    return v_conversation_id;
  end if;

  insert into public.conversations (product_id, buyer_id, seller_id)
  values (p_product_id, v_buyer_id, v_seller_id)
  returning id into v_conversation_id;

  return v_conversation_id;
end;
$$;

revoke all on function public.get_or_create_conversation(uuid) from public;
grant execute on function public.get_or_create_conversation(uuid) to authenticated;
