export type Difficulty = 'easy' | 'moderate' | 'hard'
export type MissionType =
  | 'first_hike'
  | 'distance_total'
  | 'wildlife_count'
  | 'easy_trail'
  | 'weekly_count'
  | 'photo_share'
  | 'readiness_high'
export type TrackingStatus = 'idle' | 'requesting' | 'tracking' | 'paused' | 'stopped' | 'saving' | 'error'
export type QueueStatus = 'pending' | 'syncing' | 'synced' | 'failed'
export type ActivityVisibility = 'private' | 'public'

export interface Trail {
  id: string
  name: string
  slug: string
  region: string
  difficulty: Difficulty
  distance_km: number
  elevation_gain_m: number
  estimated_time_minutes: number
  latitude: number
  longitude: number
  description: string
  safety_notes: string
  is_published: boolean
}

export interface ActivityPoint {
  latitude: number
  longitude: number
  elevation: number | null
  accuracy: number | null
  recorded_at: string
}

export interface ActivityPreparationSummary {
  estimatedCalories: {
    min: number
    max: number
  }
  recommendedWaterLiters: {
    min: number
    max: number
    electrolytes: boolean
    reason: string
  }
  weatherSummary: string
  checklistCompletionPercent: number
  readinessScore: number
  warnings: string[]
}

export interface ChecklistItemState {
  id: string
  checked: boolean
}

export interface Activity {
  id: string
  user_id: string
  client_activity_id: string | null
  trail_id: string | null
  trail_name?: string | null
  visibility?: ActivityVisibility
  points_earned?: number
  title: string
  distance_km: number
  duration_seconds: number
  elevation_gain_m: number
  calories: number
  average_pace: number | null
  started_at: string
  ended_at: string
  route_data?: {
    points: ActivityPoint[]
    preparationSummary?: ActivityPreparationSummary
    photos?: ActivityPhotoAttachment[]
    missionCompletions?: MissionCompletion[]
    caption?: string | null
  }
  created_at: string
}

export interface Profile {
  id: string
  email: string | null
  username: string | null
  avatar_url: string | null
  xp: number
  coins: number
  level: number
  kids_mode: boolean
  total_distance_km: number
  total_calories: number
  completed_hikes_count: number
  points_balance?: number
}

export interface Mission {
  id: string
  slug: string
  title: string
  description: string
  type: MissionType
  target_value: number
  reward_xp: number
  reward_coins: number
  is_active: boolean
}

export interface MissionProgress {
  id: string
  user_id: string
  mission_id: string
  progress_value: number
  completed: boolean
  completed_at: string | null
}

export interface WildlifeSpecies {
  id: string
  slug: string
  name: string
  category: string
  rarity: string
  danger_level: string
  description: string
  safety_tips: string
  kids_fact: string
  image_url: string | null
}

export interface CollectedAnimal {
  id: string
  user_id: string
  species_id: string
  activity_id: string | null
  source: string
  xp_earned: number
  coins_earned: number
  collected_at: string
}

export interface FeedItem {
  id: string
  user_id: string
  activity_id: string | null
  type: string
  title: string
  body: string
  metadata: {
    distance_km?: number
    duration_seconds?: number
    calories?: number
    display_name?: string
    avatar_url?: string | null
    client_activity_id?: string
    trail_id?: string | null
    trail_name?: string | null
    trail_slug?: string | null
    difficulty?: Difficulty | null
    readiness_score?: number | null
    weather_summary?: string | null
    recommended_water_liters?: {
      min: number
      max: number
    }
    photos?: ActivityPhotoAttachment[]
    cover_photo_url?: string | null
    likes_count?: number
    comments_count?: number
    route_preview?: boolean
    points_earned?: number
  }
  is_public: boolean
  created_at: string
}

export interface ActivitySaveInput {
  userId: string
  clientActivityId: string
  title: string
  trailName?: string | null
  trailSlug?: string | null
  difficulty?: Difficulty | null
  trailId: string | null
  visibility?: ActivityVisibility
  shareToFeed?: boolean
  caption?: string | null
  photos?: ActivityPhotoAttachment[]
  missionCompletions?: MissionCompletion[]
  pointsEarned?: number
  preparationSummary?: ActivityPreparationSummary | null
  points: ActivityPoint[]
  distanceKm: number
  durationSeconds: number
  elevationGainM: number
  calories: number
  averagePace: number | null
  startedAt: string
  endedAt: string
}

export interface LocalTrackingSession {
  id: 'active'
  clientActivityId: string
  userId: string | null
  status: Extract<TrackingStatus, 'tracking' | 'paused' | 'stopped'>
  startedAt: string
  endedAt: string | null
  pausedMs: number
  pauseStartedAt: string | null
  points: ActivityPoint[]
  trailId: string | null
  elapsedSeconds: number
  distanceKm: number
  calories: number
  updatedAt: string
}

export interface QueuedActivity {
  client_activity_id: string
  user_id: string
  payload: ActivitySaveInput
  status: QueueStatus
  attempt_count: number
  last_error: string | null
  created_at: string
  updated_at: string
  synced_at: string | null
}

export interface ActivityPhotoAttachment {
  id: string
  name: string
  url: string
  isCover: boolean
}

export interface CommunityPhoto {
  id: string
  activity_id: string | null
  feed_item_id: string | null
  trail_id: string | null
  trail_slug: string | null
  user_id: string
  user_name: string
  image_url: string
  caption: string | null
  likes_count: number
  is_cover: boolean
  created_at: string
}

export interface FeedComment {
  id: string
  feed_item_id: string
  user_id: string
  user_name: string
  body: string
  created_at: string
}

export type TrailCondition =
  | 'Dry'
  | 'Muddy'
  | 'Snowy'
  | 'Icy'
  | 'Closed section'
  | 'Bear activity'
  | 'Busy'
  | 'Quiet'

export interface TrailReview {
  id: string
  trail_id: string | null
  trail_slug: string
  user_id: string
  user_name: string
  rating: number
  body: string
  condition: TrailCondition
  would_recommend: boolean
  created_at: string
}

export interface PointsLedgerEntry {
  id: string
  user_id: string
  activity_id: string | null
  feed_item_id: string | null
  points: number
  reason: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface MissionCompletion {
  slug: string
  title: string
  points: number
}
