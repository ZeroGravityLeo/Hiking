import type { ActivityPoint } from '@/lib/types'

const EARTH_RADIUS_KM = 6371
const DEFAULT_HIKER_WEIGHT_KG = 75
const HIKING_MET = 6

export interface Split {
  kilometer: number
  distanceKm: number
  durationSeconds: number
  paceMinPerKm: number
  elevationGainM: number
}

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

function weightedNullableAverage(
  previous: number | null,
  current: number | null,
  next: number | null,
) {
  const weightedValues = [
    { value: previous, weight: 1 },
    { value: current, weight: 2 },
    { value: next, weight: 1 },
  ].filter((item): item is { value: number; weight: number } => item.value !== null)

  if (weightedValues.length === 0) {
    return null
  }

  const totalWeight = weightedValues.reduce((total, item) => total + item.weight, 0)
  const weightedTotal = weightedValues.reduce((total, item) => total + item.value * item.weight, 0)

  return weightedTotal / totalWeight
}

export function smoothPoints(points: ActivityPoint[]) {
  if (points.length < 3) {
    return points
  }

  return points.map((point, index) => {
    if (index === 0 || index === points.length - 1) {
      return point
    }

    const previous = points[index - 1]
    const next = points[index + 1]

    return {
      ...point,
      latitude: (previous.latitude + point.latitude * 2 + next.latitude) / 4,
      longitude: (previous.longitude + point.longitude * 2 + next.longitude) / 4,
      elevation: weightedNullableAverage(previous.elevation, point.elevation, next.elevation),
      accuracy: weightedNullableAverage(previous.accuracy, point.accuracy, next.accuracy),
    }
  })
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

function secondsBetween(start: ActivityPoint, end: ActivityPoint) {
  return Math.max(0, (new Date(end.recorded_at).getTime() - new Date(start.recorded_at).getTime()) / 1000)
}

export function calculateSplits(points: ActivityPoint[]) {
  if (points.length < 2) {
    return []
  }

  const splits: Split[] = []
  const startPoint = points[0]
  const lastPoint = points[points.length - 1]
  let totalDistanceKm = 0
  let splitStartDistanceKm = 0
  let splitStartSeconds = 0
  let splitElevationGainM = 0
  let nextBoundaryKm = 1

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]
    const current = points[index]
    const segmentDistanceKm = haversineDistanceKm(previous, current)
    const segmentStartSeconds = secondsBetween(startPoint, previous)
    const segmentEndSeconds = secondsBetween(startPoint, current)
    const segmentElevationGainM =
      previous.elevation === null || current.elevation === null
        ? 0
        : Math.max(0, current.elevation - previous.elevation)

    if (segmentDistanceKm <= 0) {
      splitElevationGainM += segmentElevationGainM
      continue
    }

    const segmentStartDistanceKm = totalDistanceKm
    const segmentEndDistanceKm = totalDistanceKm + segmentDistanceKm
    let consumedElevationGainM = 0

    while (segmentEndDistanceKm >= nextBoundaryKm) {
      const boundaryFraction = (nextBoundaryKm - segmentStartDistanceKm) / segmentDistanceKm
      const boundarySeconds =
        segmentStartSeconds + (segmentEndSeconds - segmentStartSeconds) * boundaryFraction
      const boundaryElevationGainM = segmentElevationGainM * boundaryFraction
      const splitDistanceKm = nextBoundaryKm - splitStartDistanceKm
      const splitDurationSeconds = Math.max(0, boundarySeconds - splitStartSeconds)

      splits.push({
        kilometer: splits.length + 1,
        distanceKm: splitDistanceKm,
        durationSeconds: splitDurationSeconds,
        paceMinPerKm: calculateAveragePace(splitDurationSeconds, splitDistanceKm) ?? 0,
        elevationGainM: splitElevationGainM + boundaryElevationGainM - consumedElevationGainM,
      })

      splitStartDistanceKm = nextBoundaryKm
      splitStartSeconds = boundarySeconds
      splitElevationGainM = 0
      consumedElevationGainM = boundaryElevationGainM
      nextBoundaryKm += 1
    }

    splitElevationGainM += segmentElevationGainM - consumedElevationGainM
    totalDistanceKm = segmentEndDistanceKm
  }

  const finalDistanceKm = totalDistanceKm - splitStartDistanceKm
  if (finalDistanceKm > 0) {
    const finalDurationSeconds = Math.max(0, secondsBetween(startPoint, lastPoint) - splitStartSeconds)
    splits.push({
      kilometer: splits.length + 1,
      distanceKm: finalDistanceKm,
      durationSeconds: finalDurationSeconds,
      paceMinPerKm: calculateAveragePace(finalDurationSeconds, finalDistanceKm) ?? 0,
      elevationGainM: splitElevationGainM,
    })
  }

  return splits
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

export function formatPace(paceMinPerKm: number) {
  if (!Number.isFinite(paceMinPerKm) || paceMinPerKm <= 0) {
    return '-'
  }

  const totalSeconds = Math.round(paceMinPerKm * 60)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
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
