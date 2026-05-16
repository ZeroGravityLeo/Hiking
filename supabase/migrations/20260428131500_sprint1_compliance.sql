-- Sprint 1 compliance foundation for Wild Alberta.
-- Uses the public.profiles pattern as the application-owned user identity.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key,
  email text,
  username text,
  avatar_url text,
  xp integer not null default 0,
  coins integer not null default 0,
  level integer not null default 1,
  kids_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, username, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop policy if exists "Profiles are readable by everyone" on public.profiles;
create policy "Profiles are readable by everyone"
on public.profiles for select
using (true);

drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create table if not exists public.consent_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  consent_type text not null,
  status text not null check (status in ('granted', 'declined', 'accepted', 'revoked')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.consent_logs enable row level security;

create index if not exists consent_logs_user_id_created_at_idx
on public.consent_logs (user_id, created_at desc);

drop policy if exists "Users read their own consent logs" on public.consent_logs;
create policy "Users read their own consent logs"
on public.consent_logs for select
using (auth.uid() = user_id);

drop policy if exists "Users insert their own consent logs" on public.consent_logs;
create policy "Users insert their own consent logs"
on public.consent_logs for insert
with check (auth.uid() = user_id);

create table if not exists public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  requested_email text,
  status text not null default 'pending_admin_review'
    check (status in ('pending_admin_review', 'processing', 'completed', 'rejected')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.deletion_requests enable row level security;

create index if not exists deletion_requests_user_id_created_at_idx
on public.deletion_requests (user_id, created_at desc);

drop policy if exists "Users read their own deletion requests" on public.deletion_requests;
create policy "Users read their own deletion requests"
on public.deletion_requests for select
using (auth.uid() = user_id);

drop policy if exists "Users create their own deletion requests" on public.deletion_requests;
create policy "Users create their own deletion requests"
on public.deletion_requests for insert
with check (auth.uid() = user_id);
