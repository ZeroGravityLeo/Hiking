import { AlertTriangle, Flag, Mountain, Navigation } from 'lucide-react'

import { MetricCard } from '@/components/common/MetricCard'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  getTrailHazards,
  getTrailRoute,
  type TrailRouteGeometry,
  type TrailWaypoint,
} from '@/lib/trail-navigation'
import type { Trail } from '@/lib/types'

export function TrailHazardsCard({ trail }: { trail: Trail }) {
  const hazards = getTrailHazards(trail)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <AlertTriangle aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <CardTitle>Trail hazards</CardTitle>
            <CardDescription>Seasonal and terrain warnings for MVP planning.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {hazards.map((hazard) => (
          <div className="rounded-lg border bg-background p-3 text-sm text-muted-foreground" key={hazard}>
            {hazard}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function TrailKeyPointsCard({ trail }: { trail: Trail }) {
  const route = getTrailRoute(trail)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Key points on this trail</CardTitle>
            <CardDescription>Planned checkpoints for navigation and safety awareness.</CardDescription>
          </div>
          <Badge variant="secondary">{route.waypoints.length} points</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {route.waypoints.map((waypoint) => (
          <WaypointRow key={waypoint.id} waypoint={waypoint} />
        ))}
      </CardContent>
    </Card>
  )
}

export function TrailElevationProfileCard({ trail }: { trail: Trail }) {
  const route = getTrailRoute(trail)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <Mountain aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <CardTitle>Elevation profile</CardTitle>
            <CardDescription>Simple route profile foundation for future GPX elevation data.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2">
          <MetricCard label="Gain" value={`${trail.elevation_gain_m} m`} />
          <MetricCard label="Highest" value={`${route.highestPointM} m`} />
          <MetricCard label="Lowest" value={`${route.lowestPointM} m`} />
        </div>
        <ElevationChart route={route} />
        <Badge className="w-fit" variant="secondary">
          {route.climbDifficulty}
        </Badge>
      </CardContent>
    </Card>
  )
}

function WaypointRow({ waypoint }: { waypoint: TrailWaypoint }) {
  return (
    <div className="rounded-lg border bg-background p-3 text-sm">
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-medium">
          <Flag aria-hidden="true" />
          {waypoint.name}
        </span>
        <Badge variant="outline">{waypoint.type.replace('-', ' ')}</Badge>
      </div>
      <p className="text-muted-foreground">{waypoint.notes}</p>
    </div>
  )
}

function ElevationChart({ route }: { route: TrailRouteGeometry }) {
  const width = 320
  const height = 120
  const minElevation = route.lowestPointM
  const maxElevation = route.highestPointM
  const distanceMax = Math.max(...route.elevationProfile.map((point) => point.distanceKm), 1)
  const elevationRange = Math.max(1, maxElevation - minElevation)
  const points = route.elevationProfile
    .map((point) => {
      const x = (point.distanceKm / distanceMax) * width
      const y = height - ((point.elevationM - minElevation) / elevationRange) * (height - 16) - 8
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <Navigation aria-hidden="true" />
        Planned elevation line
      </div>
      <svg aria-label="Simple elevation chart" className="h-32 w-full" viewBox={`0 0 ${width} ${height}`} role="img">
        <polyline
          fill="none"
          points={points}
          stroke="hsl(var(--primary))"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="5"
        />
      </svg>
    </div>
  )
}
