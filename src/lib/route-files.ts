import { saveLocalActivity } from '@/lib/community'
import {
  calculateAveragePace,
  calculateDistanceKm,
  calculateElevationGainM,
  estimateCalories,
} from '@/lib/tracking'
import type { Activity, ActivityPoint, ActivitySaveInput } from '@/lib/types'

const IMPORTED_ROUTES_KEY = 'wild-alberta-imported-routes-v1'
const MAX_ROUTE_FILE_BYTES = 2_000_000

export interface ImportedRoute {
  id: string
  name: string
  source: 'gpx'
  points: ActivityPoint[]
  distanceKm: number
  elevationGainM: number
  createdAt: string
}

export interface ParsedRouteFile {
  name: string
  points: ActivityPoint[]
  distanceKm: number
  elevationGainM: number
  source: 'gpx'
}

export function parseGpxFile(text: string, fallbackName = 'Imported GPX route'): ParsedRouteFile {
  if (new Blob([text]).size > MAX_ROUTE_FILE_BYTES) {
    throw new Error('GPX file is too large for this MVP importer.')
  }

  const document = new DOMParser().parseFromString(text, 'application/xml')
  const parserError = document.querySelector('parsererror')
  if (parserError) {
    throw new Error('Invalid GPX XML. Check that the file is a valid GPX export.')
  }

  const name = document.querySelector('trk > name, rte > name, metadata > name')?.textContent?.trim() || fallbackName
  const nodes = [
    ...Array.from(document.querySelectorAll('trkpt')),
    ...Array.from(document.querySelectorAll('rtept')),
  ]

  if (nodes.length < 2) {
    throw new Error('GPX route needs at least two route or track points.')
  }

  const points = nodes.map((node, index) => {
    const latitude = Number(node.getAttribute('lat'))
    const longitude = Number(node.getAttribute('lon'))
    const elevationText = node.querySelector('ele')?.textContent
    const timeText = node.querySelector('time')?.textContent

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new Error('GPX contains an invalid latitude value.')
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new Error('GPX contains an invalid longitude value.')
    }

    return {
      latitude,
      longitude,
      elevation: elevationText ? Number(elevationText) : null,
      accuracy: null,
      recorded_at: timeText || new Date(Date.now() + index * 60_000).toISOString(),
    }
  })

  return {
    name,
    points,
    distanceKm: Number(calculateDistanceKm(points).toFixed(3)),
    elevationGainM: Math.round(calculateElevationGainM(points)),
    source: 'gpx',
  }
}

export function activityToGpx(activity: Activity) {
  const points = getActivityPoints(activity)
  const name = escapeXml(activity.title)

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Wild Alberta" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${name}</name>
    <time>${activity.started_at}</time>
  </metadata>
  <trk>
    <name>${name}</name>
    <trkseg>
${points.map(pointToGpx).join('\n')}
    </trkseg>
  </trk>
</gpx>`
}

export function routeToGpx(route: Pick<ImportedRoute, 'name' | 'points'>) {
  const name = escapeXml(route.name)
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Wild Alberta" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${name}</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>${name}</name>
    <trkseg>
${route.points.map(pointToGpx).join('\n')}
    </trkseg>
  </trk>
</gpx>`
}

export function activityToKml(activity: Activity) {
  return routeToKml({
    name: activity.title,
    points: getActivityPoints(activity),
  })
}

export function routeToKml(route: Pick<ImportedRoute, 'name' | 'points'>) {
  const coordinates = route.points
    .map((point) => `${point.longitude},${point.latitude},${point.elevation ?? 0}`)
    .join(' ')

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(route.name)}</name>
    <Placemark>
      <name>${escapeXml(route.name)}</name>
      <LineString>
        <tessellate>1</tessellate>
        <coordinates>${coordinates}</coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`
}

export function saveImportedRoute(route: ParsedRouteFile) {
  const importedRoute: ImportedRoute = {
    id: createRouteId(),
    name: route.name,
    source: route.source,
    points: route.points,
    distanceKm: route.distanceKm,
    elevationGainM: route.elevationGainM,
    createdAt: new Date().toISOString(),
  }
  const routes = listImportedRoutes()
  window.localStorage.setItem(IMPORTED_ROUTES_KEY, JSON.stringify([importedRoute, ...routes]))
  return importedRoute
}

export function listImportedRoutes() {
  try {
    const raw = window.localStorage.getItem(IMPORTED_ROUTES_KEY)
    return raw ? (JSON.parse(raw) as ImportedRoute[]) : []
  } catch {
    return []
  }
}

export function deleteImportedRoute(routeId: string) {
  const routes = listImportedRoutes().filter((route) => route.id !== routeId)
  window.localStorage.setItem(IMPORTED_ROUTES_KEY, JSON.stringify(routes))
}

export function saveImportedRouteAsActivity(route: ParsedRouteFile, userId = 'local-demo-user') {
  const durationSeconds = Math.max(600, Math.round(route.distanceKm / 3.5 * 3600))
  const startedAt = new Date(Date.now() - durationSeconds * 1000)
  const endedAt = new Date()
  const payload: ActivitySaveInput = {
    userId,
    clientActivityId: createRouteId(),
    title: `${route.name} imported hike`,
    trailName: route.name,
    trailSlug: null,
    difficulty: null,
    trailId: null,
    visibility: 'private',
    shareToFeed: false,
    caption: 'Imported from GPX',
    photos: [],
    preparationSummary: null,
    points: route.points,
    distanceKm: route.distanceKm,
    durationSeconds,
    elevationGainM: route.elevationGainM,
    calories: estimateCalories(durationSeconds),
    averagePace: calculateAveragePace(durationSeconds, route.distanceKm),
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
  }

  return saveLocalActivity(payload).activity
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function printRouteToPdf(route: Pick<ImportedRoute, 'name' | 'points' | 'distanceKm' | 'elevationGainM'>) {
  const html = buildPrintableRouteHtml(route)
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=820,height=900')
  if (!printWindow) {
    throw new Error('Popup blocked. Allow popups to print this route.')
  }

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

export function printableActivityRoute(activity: Activity) {
  const points = getActivityPoints(activity)
  return {
    name: activity.title,
    points,
    distanceKm: activity.distance_km,
    elevationGainM: activity.elevation_gain_m,
  }
}

export function getActivityPoints(activity: Activity) {
  const points = activity.route_data?.points ?? []
  if (points.length < 2) {
    throw new Error('This route needs at least two points before it can be exported.')
  }
  return points
}

function pointToGpx(point: ActivityPoint) {
  const elevation = point.elevation === null ? '' : `\n        <ele>${point.elevation}</ele>`
  return `      <trkpt lat="${point.latitude}" lon="${point.longitude}">${elevation}
        <time>${point.recorded_at}</time>
      </trkpt>`
}

function buildPrintableRouteHtml(route: Pick<ImportedRoute, 'name' | 'points' | 'distanceKm' | 'elevationGainM'>) {
  const first = route.points[0]
  const last = route.points[route.points.length - 1]

  return `<!doctype html>
<html>
  <head>
    <title>${escapeHtml(route.name)} route</title>
    <style>
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 32px; color: #1f302b; }
      h1 { margin-bottom: 4px; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 24px 0; }
      .card { border: 1px solid #d8cebb; border-radius: 8px; padding: 12px; }
      .label { color: #63756e; font-size: 12px; }
      .value { font-weight: 700; margin-top: 4px; }
      ol { line-height: 1.55; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(route.name)}</h1>
    <p>Wild Alberta printable route summary</p>
    <div class="grid">
      <div class="card"><div class="label">Distance</div><div class="value">${route.distanceKm.toFixed(2)} km</div></div>
      <div class="card"><div class="label">Elevation gain</div><div class="value">${Math.round(route.elevationGainM)} m</div></div>
      <div class="card"><div class="label">Start</div><div class="value">${first.latitude.toFixed(6)}, ${first.longitude.toFixed(6)}</div></div>
      <div class="card"><div class="label">Finish</div><div class="value">${last.latitude.toFixed(6)}, ${last.longitude.toFixed(6)}</div></div>
    </div>
    <h2>Route points</h2>
    <ol>
      ${route.points
        .slice(0, 80)
        .map((point) => `<li>${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}${point.elevation === null ? '' : ` · ${point.elevation} m`}</li>`)
        .join('')}
    </ol>
  </body>
</html>`
}

function createRouteId() {
  if ('crypto' in window && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `route-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function escapeHtml(value: string) {
  return escapeXml(value)
}
