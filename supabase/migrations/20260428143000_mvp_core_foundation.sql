-- MVP core foundation for trails, activities, missions, wildlife, and feed.

alter table public.profiles
add column if not exists total_distance_km numeric(10, 3) not null default 0,
add column if not exists total_calories integer not null default 0,
add column if not exists completed_hikes_count integer not null default 0;

create table if not exists public.trails (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  region text not null,
  difficulty text not null check (difficulty in ('easy', 'moderate', 'hard')),
  distance_km numeric(8, 2) not null check (distance_km >= 0),
  elevation_gain_m integer not null default 0 check (elevation_gain_m >= 0),
  estimated_time_minutes integer not null default 0 check (estimated_time_minutes >= 0),
  latitude double precision not null,
  longitude double precision not null,
  description text not null default '',
  safety_notes text not null default '',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trails enable row level security;

drop trigger if exists trails_set_updated_at on public.trails;
create trigger trails_set_updated_at
before update on public.trails
for each row execute function public.set_updated_at();

drop policy if exists "Published trails are readable" on public.trails;
create policy "Published trails are readable"
on public.trails for select
using (is_published = true);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  trail_id uuid references public.trails(id) on delete set null,
  title text not null,
  distance_km numeric(10, 3) not null default 0 check (distance_km >= 0),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  elevation_gain_m integer not null default 0 check (elevation_gain_m >= 0),
  calories integer not null default 0 check (calories >= 0),
  average_pace numeric(10, 3),
  started_at timestamptz not null,
  ended_at timestamptz not null,
  route_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.activities enable row level security;

create index if not exists activities_user_id_started_at_idx
on public.activities (user_id, started_at desc);

drop policy if exists "Users read their own activities" on public.activities;
create policy "Users read their own activities"
on public.activities for select
using (auth.uid() = user_id);

drop policy if exists "Users insert their own activities" on public.activities;
create policy "Users insert their own activities"
on public.activities for insert
with check (auth.uid() = user_id);

drop policy if exists "Users update their own activities" on public.activities;
create policy "Users update their own activities"
on public.activities for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users delete their own activities" on public.activities;
create policy "Users delete their own activities"
on public.activities for delete
using (auth.uid() = user_id);

create table if not exists public.activity_points (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  elevation double precision,
  accuracy double precision,
  recorded_at timestamptz not null
);

alter table public.activity_points enable row level security;

create index if not exists activity_points_activity_id_recorded_at_idx
on public.activity_points (activity_id, recorded_at);

create index if not exists activity_points_user_id_recorded_at_idx
on public.activity_points (user_id, recorded_at desc);

drop policy if exists "Users read their own activity points" on public.activity_points;
create policy "Users read their own activity points"
on public.activity_points for select
using (auth.uid() = user_id);

drop policy if exists "Users insert their own activity points" on public.activity_points;
create policy "Users insert their own activity points"
on public.activity_points for insert
with check (auth.uid() = user_id);

drop policy if exists "Users update their own activity points" on public.activity_points;
create policy "Users update their own activity points"
on public.activity_points for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users delete their own activity points" on public.activity_points;
create policy "Users delete their own activity points"
on public.activity_points for delete
using (auth.uid() = user_id);

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  type text not null check (type in ('first_hike', 'distance_total', 'wildlife_count', 'easy_trail', 'weekly_count')),
  target_value numeric(10, 3) not null default 1,
  reward_xp integer not null default 0,
  reward_coins integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.missions enable row level security;

drop policy if exists "Active missions are readable" on public.missions;
create policy "Active missions are readable"
on public.missions for select
using (is_active = true);

create table if not exists public.mission_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete cascade,
  progress_value numeric(10, 3) not null default 0,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, mission_id)
);

alter table public.mission_progress enable row level security;

drop trigger if exists mission_progress_set_updated_at on public.mission_progress;
create trigger mission_progress_set_updated_at
before update on public.mission_progress
for each row execute function public.set_updated_at();

create index if not exists mission_progress_user_id_idx
on public.mission_progress (user_id);

drop policy if exists "Users read their own mission progress" on public.mission_progress;
create policy "Users read their own mission progress"
on public.mission_progress for select
using (auth.uid() = user_id);

drop policy if exists "Users insert their own mission progress" on public.mission_progress;
create policy "Users insert their own mission progress"
on public.mission_progress for insert
with check (auth.uid() = user_id);

drop policy if exists "Users update their own mission progress" on public.mission_progress;
create policy "Users update their own mission progress"
on public.mission_progress for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.wildlife_species (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  rarity text not null,
  danger_level text not null,
  description text not null,
  safety_tips text not null,
  kids_fact text not null,
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.wildlife_species enable row level security;

drop policy if exists "Wildlife species are readable" on public.wildlife_species;
create policy "Wildlife species are readable"
on public.wildlife_species for select
using (true);

create table if not exists public.collected_animals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  species_id uuid not null references public.wildlife_species(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete set null,
  source text not null default 'manual',
  xp_earned integer not null default 0,
  coins_earned integer not null default 0,
  collected_at timestamptz not null default now(),
  unique (user_id, species_id)
);

alter table public.collected_animals enable row level security;

create index if not exists collected_animals_user_id_collected_at_idx
on public.collected_animals (user_id, collected_at desc);

drop policy if exists "Users read their own collected animals" on public.collected_animals;
create policy "Users read their own collected animals"
on public.collected_animals for select
using (auth.uid() = user_id);

drop policy if exists "Users insert their own collected animals" on public.collected_animals;
create policy "Users insert their own collected animals"
on public.collected_animals for insert
with check (auth.uid() = user_id);

drop policy if exists "Users update their own collected animals" on public.collected_animals;
create policy "Users update their own collected animals"
on public.collected_animals for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.feed_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete set null,
  type text not null,
  title text not null,
  body text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.feed_items enable row level security;

create index if not exists feed_items_public_created_at_idx
on public.feed_items (is_public, created_at desc);

create index if not exists feed_items_user_id_created_at_idx
on public.feed_items (user_id, created_at desc);

drop policy if exists "Public feed items are readable" on public.feed_items;
create policy "Public feed items are readable"
on public.feed_items for select
using (is_public = true or auth.uid() = user_id);

drop policy if exists "Authenticated users insert their own feed items" on public.feed_items;
create policy "Authenticated users insert their own feed items"
on public.feed_items for insert
with check (auth.uid() = user_id);

drop policy if exists "Users update their own feed items" on public.feed_items;
create policy "Users update their own feed items"
on public.feed_items for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users delete their own feed items" on public.feed_items;
create policy "Users delete their own feed items"
on public.feed_items for delete
using (auth.uid() = user_id);

insert into public.trails
  (name, slug, region, difficulty, distance_km, elevation_gain_m, estimated_time_minutes, latitude, longitude, description, safety_notes, is_published)
values
  ('Johnston Canyon Lower Falls', 'johnston-canyon-lower-falls', 'Banff National Park', 'easy', 2.4, 105, 60, 51.2459, -115.8392, 'A family-friendly canyon walk with catwalks, forest shade, and waterfall views.', 'Expect crowds, icy sections in shoulder seasons, and slippery spray near falls.', true),
  ('Grassi Lakes', 'grassi-lakes', 'Canmore', 'easy', 4.0, 250, 100, 51.0606, -115.3915, 'A short climb to clear turquoise lakes with mountain views above Canmore.', 'Stay on marked routes and keep distance from cliff edges and wildlife.', true),
  ('Lake Agnes Tea House', 'lake-agnes-tea-house', 'Lake Louise', 'moderate', 7.2, 400, 180, 51.4163, -116.2408, 'A classic Lake Louise hike through forest to a high alpine lake and tea house.', 'Carry layers, water, and traction when snow or ice remains on shaded trail.', true),
  ('Plain of Six Glaciers', 'plain-of-six-glaciers', 'Lake Louise', 'hard', 14.6, 588, 330, 51.4124, -116.2274, 'A longer route along Lake Louise toward glacier viewpoints and rugged terrain.', 'Check avalanche, weather, and trail reports before committing to the upper route.', true)
on conflict (slug) do update
set
  name = excluded.name,
  region = excluded.region,
  difficulty = excluded.difficulty,
  distance_km = excluded.distance_km,
  elevation_gain_m = excluded.elevation_gain_m,
  estimated_time_minutes = excluded.estimated_time_minutes,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  description = excluded.description,
  safety_notes = excluded.safety_notes,
  is_published = excluded.is_published;

insert into public.missions
  (slug, title, description, type, target_value, reward_xp, reward_coins, is_active)
values
  ('first-hike', 'First Hike', 'Save your first tracked hike.', 'first_hike', 1, 100, 25, true),
  ('five-km-total', '5 km Total', 'Record 5 km of hiking distance.', 'distance_total', 5, 150, 40, true),
  ('wildlife-beginner', 'Wildlife Beginner', 'Collect your first wildlife discovery.', 'wildlife_count', 1, 80, 20, true),
  ('easy-trail-explorer', 'Easy Trail Explorer', 'Complete an easy trail with family-friendly pacing.', 'easy_trail', 1, 120, 30, true),
  ('weekly-explorer', 'Weekly Explorer', 'Record one hike this week.', 'weekly_count', 1, 90, 20, true)
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  type = excluded.type,
  target_value = excluded.target_value,
  reward_xp = excluded.reward_xp,
  reward_coins = excluded.reward_coins,
  is_active = excluded.is_active;

insert into public.wildlife_species
  (slug, name, category, rarity, danger_level, description, safety_tips, kids_fact)
values
  ('black-bear', 'Black Bear', 'Mammal', 'uncommon', 'high', 'Adaptable forest omnivore found across much of Alberta.', 'Carry bear spray, make noise, and never approach or feed bears.', 'Black bears can be cinnamon or brown, not only black.'),
  ('grizzly-bear', 'Grizzly Bear', 'Mammal', 'rare', 'very high', 'Powerful mountain bear with a shoulder hump and broad face.', 'Give extreme distance, hike in groups, and know current bear closures.', 'A grizzly uses its long claws to dig roots and insects.'),
  ('elk', 'Elk', 'Mammal', 'common', 'medium', 'Large deer species often seen in mountain valleys and open meadows.', 'Stay back, especially during calving season and the fall rut.', 'Male elk can grow antlers that weigh more than a bicycle.'),
  ('moose', 'Moose', 'Mammal', 'uncommon', 'high', 'Tall, solitary browser often near wetlands and willow thickets.', 'Give moose lots of room; they can charge when stressed.', 'A moose can close its nostrils when feeding underwater.'),
  ('bighorn-sheep', 'Bighorn Sheep', 'Mammal', 'uncommon', 'low', 'Rocky Mountain climber with curved horns and excellent balance.', 'Watch from a distance and never lure them with food or salt.', 'Bighorn sheep hooves grip steep rock like hiking shoes.'),
  ('coyote', 'Coyote', 'Mammal', 'common', 'medium', 'Smart, adaptable canine found in parks, grasslands, and city edges.', 'Keep pets close and do not run if a coyote approaches.', 'Coyotes use yips and howls to talk to their family group.')
on conflict (slug) do update
set
  name = excluded.name,
  category = excluded.category,
  rarity = excluded.rarity,
  danger_level = excluded.danger_level,
  description = excluded.description,
  safety_tips = excluded.safety_tips,
  kids_fact = excluded.kids_fact;
