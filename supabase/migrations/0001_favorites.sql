-- Hearted ("saved") properties. Run once in Supabase: SQL Editor -> New query -> paste -> Run.
create table if not exists public.favorites (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  property_id text not null check (char_length(property_id) between 1 and 64),
  created_at timestamptz not null default now(),
  primary key (user_id, property_id)
);

-- Row-level security: each signed-in user can only see, add and remove their own hearts.
alter table public.favorites enable row level security;

drop policy if exists "Users read their own favorites" on public.favorites;
create policy "Users read their own favorites" on public.favorites
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users add their own favorites" on public.favorites;
create policy "Users add their own favorites" on public.favorites
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users remove their own favorites" on public.favorites;
create policy "Users remove their own favorites" on public.favorites
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.favorites from anon;
grant select, insert, delete on public.favorites to authenticated;
