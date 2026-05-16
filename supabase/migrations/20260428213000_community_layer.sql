-- Sprint 4 community, photo, review, and points foundation.

alter table public.profiles
add column if not exists points_balance integer not null default 0;

alter table public.activities
add column if not exists visibility text not null default 'private'
  check (visibility in ('private', 'public')),
add column if not exists points_earned integer not null default 0;

create index if not exists activities_visibility_started_at_idx
on public.activities (visibility, started_at desc);

alter table public.missions drop constraint if exists missions_type_check;
alter table public.missions
add constraint missions_type_check
check (type in ('first_hike', 'distance_total', 'wildlife_count', 'easy_trail', 'weekly_count', 'photo_share', 'readiness_high'));

create table if not exists public.activity_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete cascade,
  trail_id uuid references public.trails(id) on delete set null,
  feed_item_id uuid references public.feed_items(id) on delete set null,
  storage_path text,
  image_url text not null,
  caption text,
  is_cover boolean not null default false,
  likes_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.activity_photos enable row level security;

create index if not exists activity_photos_trail_id_created_at_idx
on public.activity_photos (trail_id, created_at desc);

create index if not exists activity_photos_user_id_created_at_idx
on public.activity_photos (user_id, created_at desc);

drop policy if exists "Public activity photos are readable" on public.activity_photos;
create policy "Public activity photos are readable"
on public.activity_photos for select
using (
  exists (
    select 1 from public.feed_items
    where feed_items.id = activity_photos.feed_item_id
    and feed_items.is_public = true
  )
  or auth.uid() = user_id
);

drop policy if exists "Users insert their own activity photos" on public.activity_photos;
create policy "Users insert their own activity photos"
on public.activity_photos for insert
with check (auth.uid() = user_id);

drop policy if exists "Users update their own activity photos" on public.activity_photos;
create policy "Users update their own activity photos"
on public.activity_photos for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users delete their own activity photos" on public.activity_photos;
create policy "Users delete their own activity photos"
on public.activity_photos for delete
using (auth.uid() = user_id);

create table if not exists public.feed_likes (
  feed_item_id uuid not null references public.feed_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (feed_item_id, user_id)
);

alter table public.feed_likes enable row level security;

drop policy if exists "Feed likes are readable" on public.feed_likes;
create policy "Feed likes are readable"
on public.feed_likes for select
using (true);

drop policy if exists "Users create their own feed likes" on public.feed_likes;
create policy "Users create their own feed likes"
on public.feed_likes for insert
with check (auth.uid() = user_id);

drop policy if exists "Users delete their own feed likes" on public.feed_likes;
create policy "Users delete their own feed likes"
on public.feed_likes for delete
using (auth.uid() = user_id);

create table if not exists public.feed_comments (
  id uuid primary key default gen_random_uuid(),
  feed_item_id uuid not null references public.feed_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.feed_comments enable row level security;

drop trigger if exists feed_comments_set_updated_at on public.feed_comments;
create trigger feed_comments_set_updated_at
before update on public.feed_comments
for each row execute function public.set_updated_at();

create index if not exists feed_comments_feed_item_id_created_at_idx
on public.feed_comments (feed_item_id, created_at);

drop policy if exists "Feed comments are readable" on public.feed_comments;
create policy "Feed comments are readable"
on public.feed_comments for select
using (
  exists (
    select 1 from public.feed_items
    where feed_items.id = feed_comments.feed_item_id
    and (feed_items.is_public = true or feed_items.user_id = auth.uid())
  )
);

drop policy if exists "Users insert their own feed comments" on public.feed_comments;
create policy "Users insert their own feed comments"
on public.feed_comments for insert
with check (auth.uid() = user_id);

drop policy if exists "Users update their own feed comments" on public.feed_comments;
create policy "Users update their own feed comments"
on public.feed_comments for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users delete their own feed comments" on public.feed_comments;
create policy "Users delete their own feed comments"
on public.feed_comments for delete
using (auth.uid() = user_id);

create table if not exists public.trail_reviews (
  id uuid primary key default gen_random_uuid(),
  trail_id uuid not null references public.trails(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  body text not null check (char_length(body) <= 800),
  condition text not null check (condition in ('Dry', 'Muddy', 'Snowy', 'Icy', 'Closed section', 'Bear activity', 'Busy', 'Quiet')),
  would_recommend boolean not null default true,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trail_reviews enable row level security;

drop trigger if exists trail_reviews_set_updated_at on public.trail_reviews;
create trigger trail_reviews_set_updated_at
before update on public.trail_reviews
for each row execute function public.set_updated_at();

create index if not exists trail_reviews_trail_id_created_at_idx
on public.trail_reviews (trail_id, created_at desc);

drop policy if exists "Visible trail reviews are readable" on public.trail_reviews;
create policy "Visible trail reviews are readable"
on public.trail_reviews for select
using (is_hidden = false or auth.uid() = user_id);

drop policy if exists "Users insert their own trail reviews" on public.trail_reviews;
create policy "Users insert their own trail reviews"
on public.trail_reviews for insert
with check (auth.uid() = user_id);

drop policy if exists "Users update their own trail reviews" on public.trail_reviews;
create policy "Users update their own trail reviews"
on public.trail_reviews for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users delete their own trail reviews" on public.trail_reviews;
create policy "Users delete their own trail reviews"
on public.trail_reviews for delete
using (auth.uid() = user_id);

create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete set null,
  feed_item_id uuid references public.feed_items(id) on delete set null,
  points integer not null,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.points_ledger enable row level security;

create index if not exists points_ledger_user_id_created_at_idx
on public.points_ledger (user_id, created_at desc);

drop policy if exists "Users read their own points ledger" on public.points_ledger;
create policy "Users read their own points ledger"
on public.points_ledger for select
using (auth.uid() = user_id);

drop policy if exists "Users insert their own points ledger" on public.points_ledger;
create policy "Users insert their own points ledger"
on public.points_ledger for insert
with check (auth.uid() = user_id);

insert into public.missions
  (slug, title, description, type, target_value, reward_xp, reward_coins, is_active)
values
  ('hike-over-5-km', '5 km Hike', 'Complete a hike over 5 km.', 'distance_total', 5, 120, 25, true),
  ('share-first-trail-photo', 'First Trail Photo', 'Share your first public trail photo.', 'photo_share', 1, 80, 20, true),
  ('three-hikes-this-week', 'Weekly Triple', 'Complete 3 hikes this week.', 'weekly_count', 3, 200, 45, true),
  ('readiness-above-80', 'Prepared Explorer', 'Finish a hike with readiness score above 80%.', 'readiness_high', 1, 130, 30, true)
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  type = excluded.type,
  target_value = excluded.target_value,
  reward_xp = excluded.reward_xp,
  reward_coins = excluded.reward_coins,
  is_active = excluded.is_active;
