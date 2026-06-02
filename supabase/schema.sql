-- Run this SQL in Supabase SQL Editor.
-- It creates the products table used by marketplace, detail, wishlist, and sell pages.

create extension if not exists "pgcrypto";

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text not null,
  price int not null check (price >= 0),
  category text not null,
  condition text not null default 'Like New',
  location text not null,
  seller_name text not null,
  seller_avatar text,
  whatsapp text not null,
  image_url text,
  image_urls text[] not null default '{}',
  tags text[] not null default '{}',
  is_sold boolean not null default false
);

alter table public.products enable row level security;

-- Anyone can read products.
create policy if not exists "Public can read products"
on public.products
for select
to anon, authenticated
using (true);

-- Logged in users can insert their own listings.
create policy if not exists "Authenticated can insert products"
on public.products
for insert
to authenticated
with check (auth.uid() = user_id);

-- Logged in users can update only their own listings.
create policy if not exists "Authenticated can update own products"
on public.products
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Optional: allow delete by owner.
create policy if not exists "Authenticated can delete own products"
on public.products
for delete
to authenticated
using (auth.uid() = user_id);

-- Create storage bucket for listing images.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Public read for product images.
create policy if not exists "Public can view product images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'product-images');

-- Authenticated users can upload to product-images bucket.
create policy if not exists "Authenticated can upload product images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-images');
