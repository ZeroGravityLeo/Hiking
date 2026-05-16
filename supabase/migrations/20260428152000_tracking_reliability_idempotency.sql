-- Sprint 2 tracking reliability idempotency support.

alter table public.activities
add column if not exists client_activity_id text;

create unique index if not exists activities_client_activity_id_unique_idx
on public.activities (client_activity_id)
where client_activity_id is not null;

create index if not exists activities_user_id_client_activity_id_idx
on public.activities (user_id, client_activity_id);
