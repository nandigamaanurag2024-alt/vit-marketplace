# Messaging — Phase 1 (database only)

Phase 1 delivers tables, indexes, RLS, triggers, and `get_or_create_conversation`. No app UI, routes, Realtime, or marketplace changes.

## Run in Supabase

1. Apply `supabase/schema.sql` first if `products` does not exist.
2. Open **Supabase Dashboard → SQL Editor**.
3. Paste and run **`supabase/messaging.sql`** (full file).

Canonical migration path: `supabase/migrations/001_messaging_foundation.sql` (same SQL).

## Optional: backfill profiles for existing users

```sql
insert into public.profiles (id, display_name, avatar_letter)
select
  u.id,
  coalesce(nullif(split_part(u.email, '@', 1), ''), 'VIT Student'),
  upper(left(coalesce(nullif(split_part(u.email, '@', 1), ''), 'V'), 1))
from auth.users u
on conflict (id) do nothing;
```

## Test RPC (authenticated session required)

From the app (later) or with a user JWT:

```sql
select public.get_or_create_conversation('<product-uuid>');
```

---

## `profiles`

Stores display identity for chat and inbox (one row per auth user).

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | References `auth.users(id)` |
| `display_name` | text | Default `'VIT Student'` |
| `avatar_letter` | text | Optional 1-character avatar |
| `created_at` / `updated_at` | timestamptz | Metadata |

**RLS:** Authenticated users can read all profiles. Users insert/update only `id = auth.uid()`.

**Trigger:** `on_auth_user_created` on `auth.users` inserts a profile using the email local-part.

---

## `conversations`

One chat thread per **listing + buyer**. Seller is copied from `products.user_id` when the conversation is created.

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | Thread id |
| `product_id` | uuid FK | `products(id)`, cascade delete |
| `buyer_id` | uuid FK | User who messaged about the listing |
| `seller_id` | uuid FK | Listing owner at creation time |
| `last_message_at` | timestamptz | Inbox sort (set by message trigger) |
| `last_message_preview` | text | First 120 chars of last message |
| `buyer_last_read_at` / `seller_last_read_at` | timestamptz | For unread state (app updates) |
| `created_at` / `updated_at` | timestamptz | Metadata |

**Constraints:** `buyer_id <> seller_id`; unique `(product_id, buyer_id)`.

**Indexes:**
- `(seller_id, last_message_at desc)`
- `(buyer_id, last_message_at desc)`
- `(product_id)`

**RLS:**
- `SELECT` — buyer or seller only
- `INSERT` — not exposed to clients; use RPC
- `UPDATE` — participant only; trigger blocks changing `product_id`, `buyer_id`, `seller_id`, `created_at`

---

## `messages`

Persisted chat messages inside a conversation.

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | Message id |
| `conversation_id` | uuid FK | Parent thread |
| `sender_id` | uuid FK | Must equal `auth.uid()` on insert |
| `body` | text | Trimmed length 1–2000 |
| `created_at` | timestamptz | Chronological order |

**Index:** `(conversation_id, created_at asc)` for thread loading.

**RLS:**
- `SELECT` — `is_conversation_participant(conversation_id)`
- `INSERT` — sender is current user and is a participant
- No update/delete in Phase 1

**Trigger:** `on_message_created` updates `conversations.last_message_at`, `last_message_preview`, `updated_at`.

---

## `get_or_create_conversation(p_product_id uuid)`

Security definer RPC for starting or reopening a thread.

**Rules:**
- Caller must be authenticated (`auth.uid()` = buyer)
- Product must exist with non-null `user_id`
- Product must not be `is_sold`
- Buyer cannot be the seller
- Returns existing `conversations.id` or inserts a new row

**Grant:** `authenticated` only.

---

## Helper functions

| Function | Purpose |
|----------|---------|
| `is_conversation_participant(uuid)` | Used in message RLS |
| `handle_new_user()` | Profile on signup |
| `handle_new_message()` | Inbox preview fields |
| `prevent_conversation_immutable_update()` | Protects conversation keys on update |

---

## Repo files (Phase 1)

| File | Role |
|------|------|
| `supabase/migrations/001_messaging_foundation.sql` | Migration |
| `supabase/messaging.sql` | SQL Editor copy-paste |
| `supabase/MESSAGING.md` | This guide |

No application code is part of Phase 1.
