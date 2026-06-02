# Product seller ownership

## Schema choice

**`seller_id uuid` → `auth.users(id)`**

| Option | Verdict |
|--------|---------|
| `references auth.users(id)` | **Used** — matches `auth.uid()`, messaging `conversations.seller_id`, and signup |
| `references profiles(id)` | Equivalent (profiles.id = auth.users.id) but extra indirection |

`user_id` is kept for backward compatibility and synced via DB trigger with `seller_id`.

Legacy text columns (`seller_name`, `seller_avatar`) remain for marketplace cards; detail page prefers `profiles`.

## SQL to run (existing Supabase project)

Order:

1. `supabase/schema.sql` (if greenfield)
2. `supabase/messaging.sql` (Phase 1)
3. **`supabase/seller_ownership.sql`** (Phase ownership — this change)

Or run: `supabase/migrations/002_product_seller_ownership.sql`

### What the migration does

1. Adds `products.seller_id` (nullable FK to `auth.users`)
2. Backfills `seller_id` from `user_id` where present
3. Index on `seller_id`
4. Trigger `products_sync_seller_columns` — keeps `seller_id` and `user_id` aligned
5. Updates product RLS to `coalesce(seller_id, user_id)`
6. Updates `get_or_create_conversation` to use `coalesce(seller_id, user_id)`

### Legacy rows without auth owner

Listings with only `seller_name` / `seller_avatar` and no `seller_id` / `user_id`:

- Still appear on marketplace (public read unchanged)
- Show **Unknown Seller** on detail (profile fallback → product text → unknown)
- **Message Seller** disabled (**Seller unavailable**)
- To fix: assign owner in SQL when you know the user:

```sql
update public.products
set seller_id = '<auth-user-uuid>'
where id = '<product-uuid>';
```

## New installs

`supabase/schema.sql` now includes `seller_id` and coalesce-based RLS.
