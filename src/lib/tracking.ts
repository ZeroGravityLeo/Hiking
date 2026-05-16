import type { ActivityPoint } from '@/lib/types'

const EARTH_RADIUS_KM = 6371
const DEFAULT_HIKER_WEIGHT_KG = 75
const HIKING_MET = 6

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180
}

export function haversineDistanceKm(a: ActivityPoint, b: ActivityPoint) {
  const latDelta = toRadians(b.latitude - a.latitude)
  const lonDelta = toRadians(b.longitude - a.longitude)
  const startLat = toRadians(a.latitude)
  const endLat = toRadians(b.latitude)

  const h =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lonDelta / 2) ** 2

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export function calculateDistanceKm(points: ActivityPoint[]) {
  if (points.length < 2) {
    return 0
  }

  return points.slice(1).reduce((total, point, index) => {
    return total + haversineDistanceKm(points[index], point)
  }, 0)
}

export function calculateElevationGainM(points: ActivityPoint[]) {
  if (points.length < 2) {
    return 0
  }

  return points.slice(1).reduce((total, point, index) => {
    const previous = points[index].elevation
    if (previous === null || point.elevation === null) {
      return total
    }
    return total + Math.max(0, point.elevation - previous)
  }, 0)
}

export function estimateCalories(durationSeconds: number, weightKg = DEFAULT_HIKER_WEIGHT_KG) {
  const minutes = durationSeconds / 60
  return Math.round(((HIKING_MET * 3.5 * weightKg) / 200) * minutes)
}

export function calculateAveragePace(durationSeconds: number, distanceKm: number) {
  if (distanceKm <= 0) {
    return null
  }
  return durationSeconds / 60 / distanceKm
}

export function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}
