import type { ActivityPoint, ChecklistItemState, Trail } from '@/lib/types'
import type { HikePreparationPlan } from '@/lib/hike-preparation'
import { haversineDistanceKm } from '@/lib/tracking'

const OFFLINE_TRAILS_KEY = 'wild-alberta-offline-trails-v1'
const TRIP_PLAN_KEY = 'wild-alberta-trip-plan-v1'
const CHECK_IN_KEY = 'wild-alberta-check-in-v1'
const ROUTE_DATA_VERSION = 1

export type WaypointType =
  | 'start'
  | 'viewpoint'
  | 'waterfall'
  | 'camp'
  | 'danger'
  | 'steep'
  | 'wildlife'
  | 'finish'

export type OffRouteSensitivity = 'low' | 'medium' | 'high'

export interface TrailWaypoint {
  id: string
  name: string
  type: WaypointType
  latitude: number
  longitude: number
  notes: string
}

export interface ElevationPoint {
  distanceKm: number
  elevationM: number
}

export interface TrailRouteGeometry {
  trailSlug: string
  coordinates: ActivityPoint[]
  waypoints: TrailWaypoint[]
  elevationProfile: ElevationPoint[]
  highestPointM: number
  lowestPointM: number
  climbDifficulty: string
}

export interface OfflineTrailSnapshot {
  trailSlug: string
  routeVersion: number
  downloadedAt: string
  trail: Trail
  route: TrailRouteGeometry
  hazards: string[]
  safetyNotes: string
  weatherSnapshot: string | null
  preparationRecommendations: {
    water: string | null
    calories: string | null
    clothing: string | null
    food: string | null
  }
  checklistState: ChecklistItemState[]
  emergencyInfo: EmergencyInfo
}

export interface EmergencyInfo {
  disclaimer: string
  emergencyNumber: string
  regionalNote: string
  offlineInstructions: string[]
}

export interface TripPlan {
  trailSlug: string
  trailName: string
  startTime: string
  plannedFinishTime: string
  estimatedDurationMinutes: number
  trailDistanceKm: number
  safetyNote: string
  checkInExpectation: string
}

export interface CheckInReminderState {
  trailSlug: string
  dueAt: string
  status: 'armed' | 'safe' | 'continued' | 'finished'
  updatedAt: string
}

export interface OffRouteResult {
  distanceMeters: number
  thresholdMeters: number
  offRoute: boolean
}

const ROUTE_COORDINATES: Record<string, Array<[number, number, number]>> = {
  'johnston-canyon-lower-falls': [
    [51.2461, -115.8394, 1438],
    [51.2468, -115.8364, 1450],
    [51.2476, -115.8332, 1462],
    [51.2485, -115.8304, 1474],
    [51.2491, -115.8277, 1488],
    [51.2499, -115.8251, 1502],
  ],
  'grassi-lakes': [
    [51.0604, -115.3918, 1378],
    [51.0596, -115.3894, 1425],
    [51.0587, -115.3867, 1475],
    [51.0581, -115.3835, 1530],
    [51.0572, -115.3808, 1585],
    [51.0564, -115.3784, 1628],
  ],
  'lake-agnes-tea-house': [
    [51.4162, -116.2409, 1735],
    [51.4142, -116.2372, 1810],
    [51.4126, -116.2335, 1905],
    [51.4115, -116.2296, 1990],
    [51.4111, -116.2261, 2075],
    [51.4118, -116.2228, 2135],
  ],
  'plain-of-six-glaciers': [
    [51.4124, -116.2274, 1745],
    [51.4108, -116.2384, 1780],
    [51.4094, -116.2498, 1840],
    [51.4084, -116.2606, 1935],
    [51.4089, -116.2725, 2040],
    [51.4101, -116.2846, 2185],
  ],
}

const WAYPOINTS: Record<string, Omit<TrailWaypoint, 'id'>[]> = {
  'johnston-canyon-lower-falls': [
    { name: 'Trailhead', type: 'start', latitude: 51.2461, longitude: -115.8394, notes: 'Start near the main canyon path.' },
    { name: 'Canyon catwalk', type: 'danger', latitude: 51.2476, longitude: -115.8332, notes: 'Stay inside railings; rock and boardwalks can be slick.' },
    { name: 'Lower Falls Viewpoint', type: 'waterfall', latitude: 51.2499, longitude: -115.8251, notes: 'Popular viewpoint and turnaround area.' },
    { name: 'Return trailhead', type: 'finish', latitude: 51.2461, longitude: -115.8394, notes: 'Return by the same canyon path.' },
  ],
  'grassi-lakes': [
    { name: 'Trailhead', type: 'start', latitude: 51.0604, longitude: -115.3918, notes: 'Begin from the parking area above Canmore.' },
    { name: 'Steep forest climb', type: 'steep', latitude: 51.0587, longitude: -115.3867, notes: 'Expect roots, steps, and steady elevation gain.' },
    { name: 'Lake viewpoint', type: 'viewpoint', latitude: 51.0572, longitude: -115.3808, notes: 'Clear lake viewpoint; stay off closed cliff edges.' },
    { name: 'Upper lake finish', type: 'finish', latitude: 51.0564, longitude: -115.3784, notes: 'Turn around after the lake loop.' },
  ],
  'lake-agnes-tea-house': [
    { name: 'Lake Louise trailhead', type: 'start', latitude: 51.4162, longitude: -116.2409, notes: 'Start near Lake Louise lakeshore.' },
    { name: 'Mirror Lake', type: 'viewpoint', latitude: 51.4126, longitude: -116.2335, notes: 'Good pacing checkpoint before steeper climbing.' },
    { name: 'Final switchbacks', type: 'steep', latitude: 51.4111, longitude: -116.2261, notes: 'Steeper section where poles can help.' },
    { name: 'Tea house', type: 'finish', latitude: 51.4118, longitude: -116.2228, notes: 'High point and turnaround.' },
  ],
  'plain-of-six-glaciers': [
    { name: 'Lake Louise start', type: 'start', latitude: 51.4124, longitude: -116.2274, notes: 'Begin beside Lake Louise.' },
    { name: 'Glacier valley', type: 'viewpoint', latitude: 51.4094, longitude: -116.2498, notes: 'Longer exposed section with changing weather.' },
    { name: 'Moraine hazard zone', type: 'danger', latitude: 51.4084, longitude: -116.2606, notes: 'Loose footing and limited shelter.' },
    { name: 'Glacier viewpoint', type: 'finish', latitude: 51.4101, longitude: -116.2846, notes: 'Turnaround before conditions become more committing.' },
  ],
}

const HAZARDS: Record<string, string[]> = {
  'johnston-canyon-lower-falls': ['Icy sections', 'Crowded on weekends', 'Steep drop-offs', 'Limited cell service'],
  'grassi-lakes': ['Bear activity possible', 'Steep drop-offs', 'Muddy after rain', 'Crowded on weekends'],
  'lake-agnes-tea-house': ['Icy sections', 'Bear activity possible', 'Limited cell service', 'Muddy after rain'],
  'plain-of-six-glaciers': ['Avalanche terrain', 'Limited cell service', 'Steep drop-offs', 'Bear activity possible'],
}

export const OFF_ROUTE_THRESHOLDS: Record<OffRouteSensitivity, number> = {
  low: 100,
  medium: 75,
  high: 50,
}

export function getTrailRoute(trail: Trail): TrailRouteGeometry {
  const coordinates = (ROUTE_COORDINATES[trail.slug] ?? buildFallbackRoute(trail)).map(
    ([latitude, longitude, elevation], index) => ({
      latitude,
      longitude,
      elevation,
      accuracy: null,
      recorded_at: new Date(Date.now() + index * 60_000).toISOString(),
    }),
  )
  const elevationProfile = coordinates.map((point, index) => ({
    distanceKm: Number(((trail.distance_km / Math.max(1, coordinates.length - 1)) * index).toFixed(2)),
    elevationM: point.elevation ?? 0,
  }))
  const elevations = elevationProfile.map((point) => point.elevationM)
  const highestPointM = Math.max(...elevations)
  const lowestPointM = Math.min(...elevations)

  return {
    trailSlug: trail.slug,
    coordinates,
    waypoints: (WAYPOINTS[trail.slug] ?? buildFallbackWaypoints(trail)).map((waypoint, index) => ({
      ...waypoint,
      id: `${trail.slug}-${waypoint.type}-${index}`,
    })),
    elevationProfile,
    highestPointM,
    lowestPointM,
    climbDifficulty: getClimbDifficulty(trail),
  }
}

export function getTrailHazards(trail: Trail) {
  return HAZARDS[trail.slug] ?? ['Bear activity possible', 'Limited cell service', 'Muddy after rain']
}

export function getEmergencyInfo(): EmergencyInfo {
  return {
    disclaimer:
      'Wild Alberta does not replace emergency services, official park guidance, or a satellite communicator.',
    emergencyNumber: '911',
    regionalNote: 'In Alberta, call 911 for emergencies when cellular service is available.',
    offlineInstructions: [
      'Move to a visible safe location if possible.',
      'Share coordinates with your emergency contact when signal returns.',
      'Use whistle/headlamp signals if you cannot move safely.',
    ],
  }
}

export function buildOfflineTrailSnapshot({
  trail,
  plan,
  checklistState,
}: {
  trail: Trail
  plan: HikePreparationPlan | null
  checklistState: ChecklistItemState[]
}): OfflineTrailSnapshot {
  return {
    trailSlug: trail.slug,
    routeVersion: ROUTE_DATA_VERSION,
    downloadedAt: new Date().toISOString(),
    trail,
    route: getTrailRoute(trail),
    hazards: getTrailHazards(trail),
    safetyNotes: trail.safety_notes,
    weatherSnapshot: plan?.weatherSummary ?? null,
    preparationRecommendations: {
      water: plan
        ? `${plan.recommendedWaterLiters.min.toFixed(1)}-${plan.recommendedWaterLiters.max.toFixed(1)} L`
        : null,
      calories: plan ? `${plan.estimatedCalories.min}-${plan.estimatedCalories.max} kcal` : null,
      clothing: plan?.clothingRecommendation.shell ?? null,
      food: plan?.foodRecommendation.items.slice(0, 3).join(', ') ?? null,
    },
    checklistState,
    emergencyInfo: getEmergencyInfo(),
  }
}

export function saveOfflineTrail(snapshot: OfflineTrailSnapshot) {
  const store = readOfflineTrailStore()
  window.localStorage.setItem(
    OFFLINE_TRAILS_KEY,
    JSON.stringify({
      ...store,
      [snapshot.trailSlug]: snapshot,
    }),
  )
}

export function getOfflineTrail(slug: string) {
  return readOfflineTrailStore()[slug] ?? null
}

export function removeOfflineTrail(slug: string) {
  const store = readOfflineTrailStore()
  const nextStore = { ...store }
  delete nextStore[slug]
  window.localStorage.setItem(OFFLINE_TRAILS_KEY, JSON.stringify(nextStore))
}

export function getOfflineTrailState(slug: string) {
  const snapshot = getOfflineTrail(slug)
  if (!snapshot) {
    return { snapshot: null, label: 'Not downloaded', updateAvailable: false }
  }

  const downloadedAt = new Date(snapshot.downloadedAt)
  const today = new Date()
  const downloadedToday = downloadedAt.toDateString() === today.toDateString()
  const ageDays = (today.getTime() - downloadedAt.getTime()) / 86_400_000
  const updateAvailable = snapshot.routeVersion !== ROUTE_DATA_VERSION || ageDays >= 7

  return {
    snapshot,
    label: updateAvailable ? 'Update available' : downloadedToday ? 'Downloaded today' : 'Available offline',
    updateAvailable,
  }
}

export function buildTripPlan(trail: Trail): TripPlan {
  const startTime = new Date()
  const plannedFinishTime = new Date(startTime.getTime() + trail.estimated_time_minutes * 60_000)

  return {
    trailSlug: trail.slug,
    trailName: trail.name,
    startTime: startTime.toISOString(),
    plannedFinishTime: plannedFinishTime.toISOString(),
    estimatedDurationMinutes: trail.estimated_time_minutes,
    trailDistanceKm: trail.distance_km,
    safetyNote: trail.safety_notes,
    checkInExpectation: `Check in by ${formatTime(plannedFinishTime.toISOString())}. Add extra buffer for photos, kids, weather, and crowds.`,
  }
}

export function saveTripPlan(plan: TripPlan) {
  window.localStorage.setItem(TRIP_PLAN_KEY, JSON.stringify(plan))
}

export function getTripPlan() {
  try {
    const raw = window.localStorage.getItem(TRIP_PLAN_KEY)
    return raw ? (JSON.parse(raw) as TripPlan) : null
  } catch {
    return null
  }
}

export function buildTripPlanText(plan: TripPlan) {
  return [
    `Wild Alberta Trip Plan`,
    `Trail: ${plan.trailName}`,
    `Estimated duration: ${Math.round(plan.estimatedDurationMinutes)} minutes`,
    `Start time: ${formatDateTime(plan.startTime)}`,
    `Planned finish: ${formatDateTime(plan.plannedFinishTime)}`,
    `Distance: ${plan.trailDistanceKm.toFixed(1)} km`,
    `Safety note: ${plan.safetyNote}`,
    `Check-in: ${plan.checkInExpectation}`,
  ].join('\n')
}

export async function shareOrCopyText(text: string) {
  if (navigator.share) {
    await navigator.share({ text, title: 'Wild Alberta trip plan' })
    return 'shared' as const
  }

  await navigator.clipboard.writeText(text)
  return 'copied' as const
}

export function armCheckInReminder(trail: Trail) {
  const dueAt = new Date(Date.now() + (trail.estimated_time_minutes + 30) * 60_000).toISOString()
  const state: CheckInReminderState = {
    trailSlug: trail.slug,
    dueAt,
    status: 'armed',
    updatedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(CHECK_IN_KEY, JSON.stringify(state))
  return state
}

export function saveCheckInReminderState(state: CheckInReminderState) {
  window.localStorage.setItem(
    CHECK_IN_KEY,
    JSON.stringify({ ...state, updatedAt: new Date().toISOString() }),
  )
}

export function getCheckInReminderState() {
  try {
    const raw = window.localStorage.getItem(CHECK_IN_KEY)
    return raw ? (JSON.parse(raw) as CheckInReminderState) : null
  } catch {
    return null
  }
}

export function calculateOffRouteDistance(
  point: ActivityPoint | null,
  route: TrailRouteGeometry | null,
  sensitivity: OffRouteSensitivity,
): OffRouteResult | null {
  if (!point || !route || route.coordinates.length < 2) {
    return null
  }

  const pointCoord = { latitude: point.latitude, longitude: point.longitude }
  const distances = route.coordinates.slice(1).map((end, index) => {
    const start = route.coordinates[index]
    return distancePointToSegmentMeters(pointCoord, start, end)
  })
  const distanceMeters = Math.min(...distances)
  const thresholdMeters = OFF_ROUTE_THRESHOLDS[sensitivity]

  return {
    distanceMeters: Math.round(distanceMeters),
    thresholdMeters,
    offRoute: distanceMeters > thresholdMeters,
  }
}

export function getNextCheckpoint(
  point: ActivityPoint | null,
  route: TrailRouteGeometry | null,
) {
  if (!point || !route) {
    const firstWaypoint = route?.waypoints.find((waypoint) => waypoint.type !== 'start')
    return firstWaypoint ? { waypoint: firstWaypoint, distanceMeters: 0 } : null
  }

  const upcoming = route.waypoints
    .filter((waypoint) => waypoint.type !== 'start')
    .map((waypoint) => ({
      waypoint,
      distanceMeters: Math.round(
        haversineDistanceKm(point, {
          latitude: waypoint.latitude,
          longitude: waypoint.longitude,
          elevation: null,
          accuracy: null,
          recorded_at: point.recorded_at,
        }) * 1000,
      ),
    }))
    .filter((candidate) => candidate.distanceMeters > 35)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)

  return upcoming[0] ?? null
}

export function formatMeters(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`
}

function readOfflineTrailStore(): Record<string, OfflineTrailSnapshot> {
  try {
    const raw = window.localStorage.getItem(OFFLINE_TRAILS_KEY)
    return raw ? (JSON.parse(raw) as Record<string, OfflineTrailSnapshot>) : {}
  } catch {
    return {}
  }
}

function buildFallbackRoute(trail: Trail): Array<[number, number, number]> {
  const elevation = 1200 + trail.elevation_gain_m
  return [
    [trail.latitude, trail.longitude, elevation],
    [trail.latitude + 0.006, trail.longitude + 0.006, elevation + Math.round(trail.elevation_gain_m * 0.35)],
    [trail.latitude + 0.012, trail.longitude + 0.002, elevation + trail.elevation_gain_m],
  ]
}

function buildFallbackWaypoints(trail: Trail): Omit<TrailWaypoint, 'id'>[] {
  return [
    { name: 'Trailhead', type: 'start', latitude: trail.latitude, longitude: trail.longitude, notes: 'Start of the planned route.' },
    { name: 'Viewpoint', type: 'viewpoint', latitude: trail.latitude + 0.006, longitude: trail.longitude + 0.006, notes: 'Mid-route checkpoint.' },
    { name: 'Finish', type: 'finish', latitude: trail.latitude + 0.012, longitude: trail.longitude + 0.002, notes: 'Planned turnaround or finish.' },
  ]
}

function getClimbDifficulty(trail: Trail) {
  const gainPerKm = trail.elevation_gain_m / Math.max(1, trail.distance_km)
  if (gainPerKm >= 85 || trail.difficulty === 'hard') {
    return 'Hard climb'
  }
  if (gainPerKm >= 45 || trail.difficulty === 'moderate') {
    return 'Moderate climb'
  }
  return 'Gentle climb'
}

function distancePointToSegmentMeters(
  point: Pick<ActivityPoint, 'latitude' | 'longitude'>,
  start: Pick<ActivityPoint, 'latitude' | 'longitude'>,
  end: Pick<ActivityPoint, 'latitude' | 'longitude'>,
) {
  const metersPerDegreeLat = 111_320
  const meanLat = ((start.latitude + end.latitude + point.latitude) / 3) * (Math.PI / 180)
  const metersPerDegreeLon = Math.cos(meanLat) * 111_320
  const px = point.longitude * metersPerDegreeLon
  const py = point.latitude * metersPerDegreeLat
  const ax = start.longitude * metersPerDegreeLon
  const ay = start.latitude * metersPerDegreeLat
  const bx = end.longitude * metersPerDegreeLon
  const by = end.latitude * metersPerDegreeLat
  const dx = bx - ax
  const dy = by - ay
  const lengthSquared = dx * dx + dy * dy

  if (lengthSquared === 0) {
    return Math.hypot(px - ax, py - ay)
  }

  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared))
  const projectionX = ax + t * dx
  const projectionY = ay + t * dy
  return Math.hypot(px - projectionX, py - projectionY)
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}
