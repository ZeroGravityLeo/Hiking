import { DEMO_FEED } from '@/lib/demo-data'
import { formatDuration } from '@/lib/tracking'
import type {
  Activity,
  ActivityPhotoAttachment,
  ActivitySaveInput,
  CommunityPhoto,
  FeedComment,
  FeedItem,
  MissionCompletion,
  PointsLedgerEntry,
  Trail,
  TrailCondition,
  TrailReview,
} from '@/lib/types'

const COMMUNITY_STORE_KEY = 'wild-alberta-community-v1'
const DEMO_USER_ID = 'local-demo-user'
const DEMO_USER_NAME = 'Explorer'

interface CommunityStore {
  activities: Activity[]
  feedItems: FeedItem[]
  photos: CommunityPhoto[]
  comments: FeedComment[]
  reviews: TrailReview[]
  likedFeedItemIds: string[]
  pointsLedger: PointsLedgerEntry[]
}

export interface CommunitySaveResult {
  activity: Activity
  feedItem: FeedItem | null
  missionCompletions: MissionCompletion[]
  pointsEarned: number
}

export interface TrailReviewInput {
  trail: Trail
  userId?: string
  userName?: string
  rating: number
  body: string
  condition: TrailCondition
  wouldRecommend: boolean
}

const EMPTY_STORE: CommunityStore = {
  activities: [],
  feedItems: [],
  photos: [],
  comments: [],
  reviews: [],
  likedFeedItemIds: [],
  pointsLedger: [],
}

export function createLocalId(prefix: string) {
  if ('crypto' in window && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function readCommunityStore(): CommunityStore {
  try {
    const raw = window.localStorage.getItem(COMMUNITY_STORE_KEY)
    if (!raw) {
      return EMPTY_STORE
    }

    const parsed = JSON.parse(raw) as Partial<CommunityStore>
    return {
      activities: parsed.activities ?? [],
      feedItems: parsed.feedItems ?? [],
      photos: parsed.photos ?? [],
      comments: parsed.comments ?? [],
      reviews: parsed.reviews ?? [],
      likedFeedItemIds: parsed.likedFeedItemIds ?? [],
      pointsLedger: parsed.pointsLedger ?? [],
    }
  } catch {
    return EMPTY_STORE
  }
}

function writeCommunityStore(store: CommunityStore) {
  window.localStorage.setItem(COMMUNITY_STORE_KEY, JSON.stringify(store))
}

export function getCommunityFeedItems() {
  const store = readCommunityStore()
  const localItems = store.feedItems.map((item) => enrichFeedItemCounts(item, store))
  return [...localItems, ...DEMO_FEED]
}

export function getCommunityActivities(userId?: string) {
  const store = readCommunityStore()
  const targetUserId = userId ?? DEMO_USER_ID
  return store.activities.filter((activity) => activity.user_id === targetUserId)
}

export function getPointsBalance(userId?: string) {
  const targetUserId = userId ?? DEMO_USER_ID
  return readCommunityStore().pointsLedger
    .filter((entry) => entry.user_id === targetUserId)
    .reduce((total, entry) => total + entry.points, 0)
}

export function getPublishedPostCount(userId?: string) {
  const targetUserId = userId ?? DEMO_USER_ID
  return readCommunityStore().feedItems.filter((item) => item.user_id === targetUserId).length
}

export function saveLocalActivity(input: ActivitySaveInput): CommunitySaveResult {
  const store = readCommunityStore()
  const now = new Date().toISOString()
  const photos = input.photos ?? []
  const missionCompletions = input.missionCompletions ?? calculateMissionCompletions(input, photos.length)
  const pointsEarned = input.pointsEarned ?? calculatePointsEarned(input, photos.length, missionCompletions)
  const activityId = createLocalId('activity')
  const feedItemId = input.shareToFeed ? createLocalId('feed') : null
  const visibility = input.shareToFeed ? 'public' : input.visibility ?? 'private'

  const activity: Activity = {
    id: activityId,
    user_id: input.userId,
    client_activity_id: input.clientActivityId,
    trail_id: input.trailId,
    trail_name: input.trailName ?? null,
    visibility,
    points_earned: pointsEarned,
    title: input.title,
    distance_km: input.distanceKm,
    duration_seconds: input.durationSeconds,
    elevation_gain_m: input.elevationGainM,
    calories: input.calories,
    average_pace: input.averagePace,
    started_at: input.startedAt,
    ended_at: input.endedAt,
    route_data: {
      points: input.points,
      preparationSummary: input.preparationSummary ?? undefined,
      photos,
      missionCompletions,
      caption: input.caption ?? null,
    },
    created_at: now,
  }

  const activityPhotos = photos.map<CommunityPhoto>((photo) => ({
    id: photo.id,
    activity_id: activityId,
    feed_item_id: feedItemId,
    trail_id: input.trailId,
    trail_slug: input.trailSlug ?? null,
    user_id: input.userId,
    user_name: DEMO_USER_NAME,
    image_url: photo.url,
    caption: input.caption ?? null,
    likes_count: 0,
    is_cover: photo.isCover,
    created_at: now,
  }))

  const feedItem = input.shareToFeed
    ? createFeedItem({
        id: feedItemId ?? createLocalId('feed'),
        activityId,
        input,
        photos,
        pointsEarned,
        now,
      })
    : null

  const ledgerEntries: PointsLedgerEntry[] = [
    {
      id: createLocalId('points'),
      user_id: input.userId,
      activity_id: activityId,
      feed_item_id: feedItem?.id ?? null,
      points: pointsEarned,
      reason: 'hike_completion_bundle',
      metadata: {
        missionCompletions,
        shareToFeed: Boolean(input.shareToFeed),
        photosCount: photos.length,
      },
      created_at: now,
    },
  ]

  writeCommunityStore({
    ...store,
    activities: [activity, ...store.activities],
    feedItems: feedItem ? [feedItem, ...store.feedItems] : store.feedItems,
    photos: [...activityPhotos, ...store.photos],
    pointsLedger: [...ledgerEntries, ...store.pointsLedger],
  })

  return {
    activity,
    feedItem,
    missionCompletions,
    pointsEarned,
  }
}

export function calculateMissionCompletions(input: ActivitySaveInput, photosCount: number) {
  const missions: MissionCompletion[] = [
    { slug: 'first-hike', title: 'First Hike', points: 100 },
  ]

  if (input.distanceKm >= 5) {
    missions.push({ slug: 'hike-over-5-km', title: '5 km Hike', points: 100 })
  }
  if (photosCount > 0 && input.shareToFeed) {
    missions.push({ slug: 'share-first-trail-photo', title: 'First Trail Photo', points: 100 })
  }
  if ((input.preparationSummary?.readinessScore ?? 0) > 80) {
    missions.push({ slug: 'readiness-above-80', title: 'Prepared Explorer', points: 100 })
  }

  return missions
}

export function calculatePointsEarned(
  input: ActivitySaveInput,
  photosCount: number,
  missionCompletions: MissionCompletion[],
) {
  let points = 50
  if (input.shareToFeed) {
    points += 10
  }
  if (photosCount > 0) {
    points += 5
  }
  if ((input.preparationSummary?.readinessScore ?? 0) > 80) {
    points += 20
  }
  points += missionCompletions.length * 25
  return points
}

export function getTrailCommunityPhotos(trail: Trail) {
  return readCommunityStore().photos.filter((photo) => {
    return photo.trail_slug === trail.slug || photo.trail_id === trail.id
  })
}

export function getTrailReviews(trail: Trail) {
  return readCommunityStore().reviews.filter((review) => {
    return review.trail_slug === trail.slug || review.trail_id === trail.id
  })
}

export function saveTrailReview(input: TrailReviewInput) {
  const store = readCommunityStore()
  const review: TrailReview = {
    id: createLocalId('review'),
    trail_id: input.trail.id.startsWith('demo-') ? null : input.trail.id,
    trail_slug: input.trail.slug,
    user_id: input.userId ?? DEMO_USER_ID,
    user_name: input.userName ?? DEMO_USER_NAME,
    rating: input.rating,
    body: input.body,
    condition: input.condition,
    would_recommend: input.wouldRecommend,
    created_at: new Date().toISOString(),
  }

  writeCommunityStore({
    ...store,
    reviews: [review, ...store.reviews],
  })

  return review
}

export function getFeedComments(feedItemId: string) {
  return readCommunityStore().comments.filter((comment) => comment.feed_item_id === feedItemId)
}

export function addFeedComment(feedItemId: string, body: string, userId?: string, userName?: string) {
  const store = readCommunityStore()
  const comment: FeedComment = {
    id: createLocalId('comment'),
    feed_item_id: feedItemId,
    user_id: userId ?? DEMO_USER_ID,
    user_name: userName ?? DEMO_USER_NAME,
    body,
    created_at: new Date().toISOString(),
  }

  writeCommunityStore({
    ...store,
    comments: [comment, ...store.comments],
  })

  return comment
}

export function deleteFeedComment(commentId: string, userId?: string) {
  const store = readCommunityStore()
  const targetUserId = userId ?? DEMO_USER_ID
  writeCommunityStore({
    ...store,
    comments: store.comments.filter((comment) => {
      return !(comment.id === commentId && comment.user_id === targetUserId)
    }),
  })
}

export function toggleFeedLike(feedItemId: string) {
  const store = readCommunityStore()
  const liked = store.likedFeedItemIds.includes(feedItemId)
  writeCommunityStore({
    ...store,
    likedFeedItemIds: liked
      ? store.likedFeedItemIds.filter((id) => id !== feedItemId)
      : [feedItemId, ...store.likedFeedItemIds],
  })

  return !liked
}

export function isFeedLiked(feedItemId: string) {
  return readCommunityStore().likedFeedItemIds.includes(feedItemId)
}

export function getPhotoCountForActivity(activity: Activity) {
  return activity.route_data?.photos?.length ?? 0
}

function createFeedItem({
  id,
  activityId,
  input,
  photos,
  pointsEarned,
  now,
}: {
  id: string
  activityId: string
  input: ActivitySaveInput
  photos: ActivityPhotoAttachment[]
  pointsEarned: number
  now: string
}): FeedItem {
  const durationMinutes = Math.max(1, Math.round(input.durationSeconds / 60))
  const coverPhoto = photos.find((photo) => photo.isCover) ?? photos[0]

  return {
    id,
    user_id: input.userId,
    activity_id: activityId,
    type: 'activity_completed',
    title: input.trailName ? `${input.trailName} hike` : input.title,
    body: input.caption || `${input.distanceKm.toFixed(2)} km in ${durationMinutes} min`,
    metadata: {
      distance_km: input.distanceKm,
      duration_seconds: input.durationSeconds,
      calories: input.calories,
      display_name: DEMO_USER_NAME,
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
    },
    is_public: true,
    created_at: now,
  }
}

function enrichFeedItemCounts(item: FeedItem, store: CommunityStore) {
  const liked = store.likedFeedItemIds.includes(item.id)
  const localLikeBonus = liked ? 1 : 0
  return {
    ...item,
    metadata: {
      ...item.metadata,
      likes_count: (item.metadata.likes_count ?? 0) + localLikeBonus,
      comments_count: store.comments.filter((comment) => comment.feed_item_id === item.id).length,
    },
  }
}

export function formatActivityDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatFeedSubtitle(item: FeedItem) {
  const trailName = item.metadata.trail_name ?? 'Free hike'
  return `${item.metadata.display_name ?? DEMO_USER_NAME} · ${trailName} · ${formatActivityDate(item.created_at)}`
}

export function formatActivitySummary(activity: Activity) {
  return `${activity.distance_km.toFixed(2)} km · ${formatDuration(activity.duration_seconds)} · ${activity.calories} cal`
}
