-- Add a lightweight lookup index for trail-linked activity views.

create index if not exists activities_trail_id_started_at_idx
on public.activities (trail_id, started_at desc)
where trail_id is not null;
