# Claude Review Brief

## Context

This repository currently contains two active product directions:

1. **Wild Alberta Hiking**
   - Mobile-first hiking platform for Alberta, Canada.
   - Trail discovery, maps, GPS tracking, smart hike preparation, offline support, safety tools, wildlife collection, missions, points, public feed, reviews/photos/comments, GPX/KML import/export, and future premium/rewards.

2. **Inspection / Local Services**
   - Home inspection and neighbourhood/local services direction.
   - LocalBridge-style modules for businesses, help requests, events, community issues, inspection issues, and matching inspection report problems to nearby repair providers.

Please do not assume one direction is accidental. We need architecture advice for supporting both cleanly.

## What To Review

- Current frontend/backend boundaries.
- Whether this should be one monorepo with separate apps/modules, two products sharing auth/users, or separate repos.
- Database architecture for both domains.
- Supabase/Postgres schema for Wild Alberta.
- Prisma/SQLite LocalBridge inspection schema and migration path if it should move to Supabase/Postgres.
- Shared auth/user/profile model.
- RLS policies and privacy risks.
- Storage strategy for trail/activity/photos/inspection assets.
- Offline sync and idempotency for GPS/activity data.
- Social/feed/community data design.
- Admin/moderation architecture.
- Future payments/subscriptions/rewards architecture.
- Migration plan from the current mixed state to a clean production structure.

## Important Existing Wild Alberta Areas

- Supabase migrations in `supabase/migrations`.
- Supabase Edge Functions in `supabase/functions`.
- Hiking app routes and components in `src/App.tsx`, `src/components`, `src/lib`, and legacy pages.
- Offline/tracking logic in `src/lib/local-db.ts`, `src/lib/activity-sync.ts`, `src/lib/tracking.ts`, and hooks.
- Hiking domain types in `src/lib/types.ts`.

## Important Existing Inspection / Local Services Areas

- Next.js App Router files in `src/app`.
- LocalBridge components in `src/components/localbridge`.
- LocalBridge demo data/types/utils in `src/lib/localbridge`.
- Prisma schema and seed scripts in `prisma`.

## Key Goal

Help us decide the clean target architecture so development can continue without database/domain confusion.
