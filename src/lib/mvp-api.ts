import type { User } from '@supabase/supabase-js'

import {
  calculateMissionCompletions,
  calculatePointsEarned,
  getCommunityActivities,
  getCommunityFeedItems,
  getPointsBalance,
  getPublishedPostCount,
  saveLocalActivity,
} from '@/lib/community'
import { DEMO_MISSIONS, DEMO_TRAILS, DEMO_WILDLIFE } from '@/lib/demo-data'
import { isSupabaseConfigured, supabase, type Json } from '@/lib/supabase'
import type {
  Activity,
  ActivityPoint,
  ActivitySaveInput,
  CollectedAnimal,
  FeedItem,
  MissionCompletion,
  Mission,
  MissionProgress,
  Profile,
  Trail,
  WildlifeSpecies,
} from '@/lib/types'

export interface ProfileStats {
  profile: Profile | null
  completedHikes: number
  totalDistanceKm: number
  totalCalories: number
  totalMovingSeconds: number
  averageReadinessScore: number | null
  publishedPosts: number
  pointsBalance: number
  completedMissionCount: number
  recentActivities: Activity[]
}

export async function fetchTrails(): Promise<Trail[]> {
  if (!isSupabaseConfigured) {
    return DEMO_TRAILS
  }

  const { data, error } = await supabase
    .from('trails')
    .select('*')
    .eq('is_published', true)
    .order('name')

  if (error) {
    throw error
  }

  return ((data ?? []) as unknown as Trail[]).length > 0
    ? ((data ?? []) as unknown as Trail[])
    : DEMO_TRAILS
}

export async function fetchTrailBySlug(slug: string): Promise<Trail | null> {
  const trails = await fetchTrails()
  return trails.find((trail) => trail.slug === slug || trail.id === slug) ?? null
}

export async function fetchMissions(): Promise<Mission[]> {
  if (!isSupabaseConfigured) {
    return DEMO_MISSIONS
  }

  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .eq('is_active', true)
    .order('target_value')

  if (error) {
    throw error
  }

  return ((data ?? []) as unknown as Mission[]).length > 0
    ? ((data ?? []) as unknown as Mission[])
    : DEMO_MISSIONS
}

export async function fetchWildlifeSpecies(): Promise<WildlifeSpecies[]> {
  if (!isSupabaseConfigured) {
    return DEMO_WILDLIFE
  }

  const { data, error } = await supabase.from('wildlife_species').select('*').order('name')

  if (error) {
    throw error
  }

  return ((data ?? []) as unknown as WildlifeSpecies[]).length > 0
    ? ((data ?? []) as unknown as WildlifeSpecies[])
    : DEMO_WILDLIFE
}

export async function fetchCollectedAnimals(userId: string | undefined): Promise<CollectedAnimal[]> {
  if (!isSupabaseConfigured || !userId) {
    return []
  }

  const { data, error } = await supabase
    .from('collected_animals')
    .select('*')
    .eq('user_id', userId)
    .order('collected_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as unknown as CollectedAnimal[]
}

export async function fetchMissionProgress(userId: string | undefined): Promise<MissionProgress[]> {
  if (!isSupabaseConfigured || !userId) {
    return []
  }

  const { data, error } = await supabase
    .from('mission_progress')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    throw error
  }

  return (data ?? []) as unknown as MissionProgress[]
}

export async function fetchFeedItems(): Promise<FeedItem[]> {
  if (!isSupabaseConfigured) {
    return getCommunityFeedItems()
  }

  const { data, error } = await supabase
    .from('feed_items')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(25)

  if (error) {
    throw error
  }

  return ((data ?? []) as unknown as FeedItem[]).length > 0
    ? ((data ?? []) as unknown as FeedItem[])
    : getCommunityFeedItems()
}

export async function fetchProfileStats(user: User | null): Promise<ProfileStats> {
  if (!isSupabaseConfigured || !user) {
    const localActivities = getCommunityActivities(user?.id)
    const totalDistanceKm = localActivities.reduce((total, activity) => total + activity.distance_km, 0)
    const totalCalories = localActivities.reduce((total, activity) => total + activity.calories, 0)
    const readinessScores = localActivities
      .map((activity) => activity.route_data?.preparationSummary?.readinessScore)
      .filter((score): score is number => typeof score === 'number')

    return {
      profile: {
        id: user?.id ?? 'local-demo-user',
        email: user?.email ?? 'demo@wildalberta.local',
        username: 'Explorer',
        avatar_url: null,
        xp: Math.round(totalDistanceKm * 25),
        coins: Math.round(totalDistanceKm * 5),
        level: Math.max(1, Math.floor(totalDistanceKm / 10) + 1),
        kids_mode: false,
        total_distance_km: totalDistanceKm,
        total_calories: totalCalories,
        completed_hikes_count: localActivities.length,
        points_balance: getPointsBalance(user?.id),
      },
      completedHikes: localActivities.length,
      totalDistanceKm,
      totalCalories,
      totalMovingSeconds: localActivities.reduce(
        (total, activity) => total + activity.duration_seconds,
        0,
      ),
      averageReadinessScore:
        readinessScores.length > 0
          ? Math.round(readinessScores.reduce((total, score) => total + score, 0) / readinessScores.length)
          : null,
      publishedPosts: getPublishedPostCount(user?.id),
      pointsBalance: getPointsBalance(user?.id),
      completedMissionCount: localActivities.reduce(
        (total, activity) => total + (activity.route_data?.missionCompletions?.length ?? 0),
        0,
      ),
      recentActivities: localActivities.slice(0, 8),
    }
  }

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    throw profileError
  }

  const profile = profileData as unknown as Profile | null

  const { data: activitiesData, error: activitiesError } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })

  if (activitiesError) {
    throw activitiesError
  }

  const activities = (activitiesData ?? []) as unknown as Activity[]
  const totalDistanceKm = activities.reduce((total, activity) => total + activity.distance_km, 0)
  const totalCalories = activities.reduce((total, activity) => total + activity.calories, 0)
  const totalMovingSeconds = activities.reduce((total, activity) => total + activity.duration_seconds, 0)
  const readinessScores = activities
    .map((activity) => activity.route_data?.preparationSummary?.readinessScore)
    .filter((score): score is number => typeof score === 'number')
  const [{ count: publishedPosts }, { count: completedMissionCount }] = await Promise.all([
    supabase
      .from('feed_items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_public', true),
    supabase
      .from('mission_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('completed', true),
  ])

  return {
    profile,
    completedHikes: activities.length,
    totalDistanceKm: profile?.total_distance_km ?? totalDistanceKm,
    totalCalories: profile?.total_calories ?? totalCalories,
    totalMovingSeconds,
    averageReadinessScore:
      readinessScores.length > 0
        ? Math.round(readinessScores.reduce((total, score) => total + score, 0) / readinessScores.length)
        : null,
    publishedPosts: publishedPosts ?? 0,
    pointsBalance: profile?.points_balance ?? 0,
    completedMissionCount: completedMissionCount ?? 0,
    recentActivities: activities.slice(0, 8),
  }
}

export async function updateKidsMode(userId: string, kidsMode: boolean) {
  const { error } = await supabase
    .from('profiles')
    .update({ kids_mode: kidsMode })
    .eq('id', userId)

  if (error) {
    throw error
  }
}

export async function saveTrackedActivity(input: ActivitySaveInput) {
  if (!isSupabaseConfigured) {
    return saveLocalActivity(input).activity
  }

  const { data: existingActivity, error: existingError } = await supabase
    .from('activities')
    .select('*')
    .eq('client_activity_id', input.clientActivityId)
    .eq('user_id', input.userId)
    .maybeSingle()

  if (existingError) {
    throw existingError
  }

  if (existingActivity) {
    return existingActivity as unknown as Activity
  }

  const photos = input.photos ?? []
  const missionCompletions =
    input.missionCompletions ?? calculateMissionCompletions(input, photos.length)
  const pointsEarned =
    input.pointsEarned ?? calculatePointsEarned(input, photos.length, missionCompletions)
  const visibility = input.shareToFeed ? 'public' : input.visibility ?? 'private'
  const routeData = {
    points: input.points.map((point) => ({
      latitude: point.latitude,
      longitude: point.longitude,
      elevation: point.elevation,
      accuracy: point.accuracy,
      recorded_at: point.recorded_at,
    })),
    preparationSummary: input.preparationSummary ?? null,
    photos,
    missionCompletions,
    caption: input.caption ?? null,
  } as unknown as Json

  const { data: activityData, error: activityError } = await supabase
    .from('activities')
    .insert({
      user_id: input.userId,
      client_activity_id: input.clientActivityId,
      trail_id: input.trailId,
      title: input.title,
      distance_km: input.distanceKm,
      duration_seconds: input.durationSeconds,
      elevation_gain_m: input.elevationGainM,
      calories: input.calories,
      average_pace: input.averagePace,
      started_at: input.startedAt,
      ended_at: input.endedAt,
      route_data: routeData,
      visibility,
      points_earned: pointsEarned,
    })
    .select('*')
    .single()

  if (activityError) {
    throw activityError
  }

  const activity = activityData as unknown as Activity
  const routeRows = input.points.map((point) => ({
    activity_id: activity.id,
    user_id: input.userId,
    latitude: point.latitude,
    longitude: point.longitude,
    elevation: point.elevation,
    accuracy: point.accuracy,
    recorded_at: point.recorded_at,
  }))

  if (routeRows.length > 0) {
    const { error: pointsError } = await supabase.from('activity_points').insert(routeRows)
    if (pointsError) {
      throw pointsError
    }
  }

  const feedItem = input.shareToFeed
    ? await createActivityFeedItem(input, activity.id, pointsEarned)
    : null
  await createActivityPhotos(input, activity.id, feedItem?.id ?? null)
  await createPointsLedgerEntry(input, activity.id, feedItem?.id ?? null, pointsEarned, missionCompletions)
  await updateProfileTotals(input, pointsEarned)
  await updateMissionProgress(input)

  return activity
}

async function updateProfileTotals(input: ActivitySaveInput, pointsEarned: number) {
  const { data, error } = await supabase
    .from('profiles')
    .select('total_distance_km,total_calories,completed_hikes_count,xp,coins,level,points_balance')
    .eq('id', input.userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  const current = (data ?? {}) as {
    total_distance_km?: number
    total_calories?: number
    completed_hikes_count?: number
    xp?: number
    coins?: number
    level?: number
    points_balance?: number
  }
  const nextXp = (current.xp ?? 0) + Math.max(10, Math.round(input.distanceKm * 25))
  const nextLevel = Math.max(current.level ?? 1, Math.floor(nextXp / 500) + 1)

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      total_distance_km: Number(((current.total_distance_km ?? 0) + input.distanceKm).toFixed(3)),
      total_calories: (current.total_calories ?? 0) + input.calories,
      completed_hikes_count: (current.completed_hikes_count ?? 0) + 1,
      xp: nextXp,
      coins: (current.coins ?? 0) + Math.max(5, Math.round(input.distanceKm * 5)),
      level: nextLevel,
      points_balance: (current.points_balance ?? 0) + pointsEarned,
    })
    .eq('id', input.userId)

  if (updateError) {
    throw updateError
  }
}

async function updateMissionProgress(input: ActivitySaveInput) {
  const missions = await fetchMissions()
  const existingProgress = await fetchMissionProgress(input.userId)
  const progressByMission = new Map(existingProgress.map((progress) => [progress.mission_id, progress]))
  const updates = missions.flatMap((mission) => {
    const existing = progressByMission.get(mission.id)
    let progressValue = existing?.progress_value ?? 0

    if (mission.type === 'first_hike' || mission.type === 'weekly_count') {
      progressValue += 1
    }
    if (mission.type === 'distance_total') {
      progressValue += input.distanceKm
    }
    if (mission.type === 'easy_trail' && input.difficulty === 'easy') {
      progressValue += 1
    }
    if (mission.type === 'photo_share' && input.shareToFeed && (input.photos?.length ?? 0) > 0) {
      progressValue += 1
    }
    if (mission.type === 'readiness_high' && (input.preparationSummary?.readinessScore ?? 0) > 80) {
      progressValue += 1
    }

    if (progressValue <= (existing?.progress_value ?? 0)) {
      return []
    }

    const completed = progressValue >= mission.target_value

    return [
      {
        user_id: input.userId,
        mission_id: mission.id,
        progress_value: Number(progressValue.toFixed(3)),
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      },
    ]
  })

  if (updates.length === 0) {
    return
  }

  const { error } = await supabase.from('mission_progress').upsert(updates, {
    onConflict: 'user_id,mission_id',
  })

  if (error) {
    throw error
  }
}

async function createActivityFeedItem(
  input: ActivitySaveInput,
  activityId: string,
  pointsEarned: number,
) {
  const { data: profileData } = await supabase
    .from('profiles')
    .select('username,avatar_url')
    .eq('id', input.userId)
    .maybeSingle()
  const profile = profileData as unknown as { username?: string | null; avatar_url?: string | null } | null
  const durationMinutes = Math.max(1, Math.round(input.durationSeconds / 60))
  const photos = input.photos ?? []
  const coverPhoto = photos.find((photo) => photo.isCover) ?? photos[0]

  const { data, error } = await supabase
    .from('feed_items')
    .insert({
      user_id: input.userId,
      activity_id: activityId,
      type: 'activity_completed',
      title: input.trailName ? `${input.trailName} hike` : input.title,
      body: input.caption || `${input.distanceKm.toFixed(2)} km in ${durationMinutes} min`,
      metadata: {
        distance_km: input.distanceKm,
        duration_seconds: input.durationSeconds,
        calories: input.calories,
        display_name: profile?.username ?? 'Explorer',
        avatar_url: profile?.avatar_url ?? null,
        client_activity_id: input.clientActivityId,
        trail_id: input.trailId,
        trail_name: input.trailName ?? null,
        trail_slug: input.trailSlug ?? null,
        difficulty: input.difficulty ?? null,
        readiness_score: input.preparationSummary?.readinessScore ?? null,
        weather_summary: input.preparationSummary?.weatherSummary ?? null,
        recommended_water_liters: input.preparationSummary
          ? {
              min: input.preparationSummary.recommendedWaterLiters.min,
              max: input.preparationSummary.recommendedWaterLiters.max,
            }
          : undefined,
        photos,
        cover_photo_url: coverPhoto?.url ?? null,
        likes_count: 0,
        comments_count: 0,
        route_preview: input.points.length > 1,
        points_earned: pointsEarned,
      } as unknown as Json,
      is_public: true,
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data as unknown as FeedItem
}

async function createActivityPhotos(
  input: ActivitySaveInput,
  activityId: string,
  feedItemId: string | null,
) {
  const photos = input.photos ?? []
  if (photos.length === 0) {
    return
  }

  const rows = photos.map((photo) => ({
    activity_id: activityId,
    feed_item_id: feedItemId,
    trail_id: input.trailId,
    user_id: input.userId,
    image_url: photo.url,
    storage_path: null,
    caption: input.caption ?? null,
    is_cover: photo.isCover,
  }))

  const { error } = await supabase.from('activity_photos').insert(rows)

  if (error) {
    throw error
  }
}

async function createPointsLedgerEntry(
  input: ActivitySaveInput,
  activityId: string,
  feedItemId: string | null,
  pointsEarned: number,
  missionCompletions: MissionCompletion[],
) {
  const { error } = await supabase.from('points_ledger').insert({
    user_id: input.userId,
    activity_id: activityId,
    feed_item_id: feedItemId,
    points: pointsEarned,
    reason: 'hike_completion_bundle',
    metadata: {
      missionCompletions,
      shareToFeed: Boolean(input.shareToFeed),
      photosCount: input.photos?.length ?? 0,
      readinessScore: input.preparationSummary?.readinessScore ?? null,
    } as unknown as Json,
  })

  if (error) {
    throw error
  }
}

export function positionToActivityPoint(position: GeolocationPosition): ActivityPoint {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    elevation: position.coords.altitude,
    accuracy: position.coords.accuracy,
    recorded_at: new Date(position.timestamp).toISOString(),
  }
}
