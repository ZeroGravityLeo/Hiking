import { createClient } from '@supabase/supabase-js'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserDataTable =
  | 'profiles'
  | 'trails'
  | 'activities'
  | 'activity_points'
  | 'activity_feed'
  | 'feed_items'
  | 'missions'
  | 'collected_animals'
  | 'wildlife_species'
  | 'trail_photos'
  | 'trail_reviews'
  | 'activity_photos'
  | 'feed_likes'
  | 'feed_comments'
  | 'points_ledger'
  | 'trail_times'
  | 'mission_progress'
  | 'gear_reviews'
  | 'saved_guides'
  | 'checklist_progress'
  | 'consent_logs'
  | 'deletion_requests'

type Row = Record<string, Json>

export interface Database {
  public: {
    Tables: Record<
      UserDataTable,
      {
        Row: Row
        Insert: Row
        Update: Row
        Relationships: []
      }
    >
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

const env = ((import.meta as { env?: Record<string, string | undefined> }).env ?? {}) as Record<
  string,
  string | undefined
>
const supabaseUrl = env.VITE_SUPABASE_URL
const supabasePublishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

export const supabase = createClient<Database>(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabasePublishableKey ?? 'placeholder-publishable-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)
