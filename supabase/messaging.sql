-- =============================================================================
-- VIT Marketplace — messaging foundation (paste into Supabase SQL Editor)
-- =============================================================================
-- Prerequisites: public.products exists (run supabase/schema.sql first).
-- Canonical migration: supabase/migrations/001_messaging_foundation.sql
-- =============================================================================

-- VIT Marketplace — messr RPC once wired from the client:aging foundation
-- Run once in Supabase Dashboard → SQL Editor (after schema.sql / products table exists).
-- Idempotent where possible; safe to re-run policy/function replacements.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'VIT Student',
  avatar_letter text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
create policy "Profiles are viewable by authenticated users"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Auto-create profile on signup (display name from email local-part).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_local_part text;
  v_letter text;
begin
  v_local_part := split_part(coalesce(new.email, ''), '@', 1);
  if v_local_part = '' then
    v_local_part := 'VIT Student';
  end if;

  v_letter := upper(left(v_local_part, 1));
  if v_letter is null or v_letter = '' then
    v_letter := 'V';
  end if;

  insert into public.profiles (id, display_name, avatar_letter)
  values (new.id, v_local_part, v_letter)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------------

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  buyer_id uuid not null references auth.users (id) on delete cascade,
  seller_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz,
  last_message_preview text,
  buyer_last_read_at timestamptz,
  seller_last_read_at timestamptz,
  constraint conversations_buyer_not_seller check (buyer_id <> seller_id),
  constraint conversations_unique_listing_buyer unique (product_id, buyer_id)
);

alter table public.conversations enable row level security;

create index if not exists conversations_seller_id_last_message_at_idx
  on public.conversations (seller_id, last_message_at desc nulls last);

create index if not exists conversations_buyer_id_last_message_at_idx
  on public.conversations (buyer_id, last_message_at desc nulls last);

create index if not exists conversations_product_id_idx
  on public.conversations (product_id);

drop policy if exists "Participants can view conversations" on public.conversations;
create policy "Participants can view conversations"
on public.conversations
for select
to authenticated
using (buyer_id = auth.uid() or seller_id = auth.uid());

-- Inserts are performed via get_or_create_conversation (security definer).
-- Participants may update read timestamps only (immutable conversation keys).
drop policy if exists "Participants can update read timestamps" on public.conversations;
create policy "Participants can update read timestamps"
on public.conversations
for update
to authenticated
using (buyer_id = auth.uid() or seller_id = auth.uid())
with check (
  buyer_id = auth.uid()
  or seller_id = auth.uid()
);

create or replace function public.prevent_conversation_immutable_update()
returns trigger
language plpgsql
as $$
begin
  if new.product_id is distinct from old.product_id
     or new.buyer_id is distinct from old.buyer_id
     or new.seller_id is distinct from old.seller_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Cannot modify immutable conversation fields';
  end if;

  return new;
end;
$$;

drop trigger if exists conversations_immutable_guard on public.conversations;
create trigger conversations_immutable_guard
  before update on public.conversations
  for each row
  execute function public.prevent_conversation_immutable_update();

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint messages_body_not_empty check (
    char_length(trim(body)) > 0
    and char_length(body) <= 2000
  )
);

alter table public.messages enable row level security;

create index if not exists messages_conversation_id_created_at_idx
  on public.messages (conversation_id, created_at asc);

-- ---------------------------------------------------------------------------
-- Helpers & triggers
-- ---------------------------------------------------------------------------

create or replace function public.is_conversation_participant(conv_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversations c
    where c.id = conv_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  );
$$;

revoke all on function public.is_conversation_participant(uuid) from public;
grant execute on function public.is_conversation_participant(uuid) to authenticated;

create or replace function public.handle_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set
    last_message_at = new.created_at,
    last_message_preview = left(trim(new.body), 120),
    updated_at = new.created_at
  where id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists on_message_created on public.messages;
create trigger on_message_created
  after insert on public.messages
  for each row
  execute function public.handle_new_message();

drop policy if exists "Participants can view messages" on public.messages;
create policy "Participants can view messages"
on public.messages
for select
to authenticated
using (public.is_conversation_participant(conversation_id));

drop policy if exists "Participants can send messages" on public.messages;
create policy "Participants can send messages"
on public.messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and public.is_conversation_participant(conversation_id)
);

-- ---------------------------------------------------------------------------
-- get_or_create_conversation
-- ---------------------------------------------------------------------------

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

-- Phase 1 complete. Realtime publication setup is a later phase.
