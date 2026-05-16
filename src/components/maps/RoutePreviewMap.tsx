import { useEffect, useMemo } from 'react'
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'

import { getTrailRoute } from '@/lib/trail-navigation'
import type { ActivityPoint, Trail } from '@/lib/types'
import { cn } from '@/lib/utils'

const FALLBACK_CENTER: [number, number] = [51.1784, -115.5708]

export function RoutePreviewMap({
  points,
  trail,
  className,
}: {
  points: ActivityPoint[]
  trail: Trail | null
  className?: string
}) {
  const positions = useMemo(() => {
    return points.map((point) => [point.latitude, point.longitude] as [number, number])
  }, [points])
  const plannedRoute = useMemo(() => (trail ? getTrailRoute(trail) : null), [trail])
  const plannedPositions = useMemo(
    () => plannedRoute?.coordinates.map((point) => [point.latitude, point.longitude] as [number, number]) ?? [],
    [plannedRoute],
  )
  const center: [number, number] =
    positions[0] ?? plannedPositions[0] ?? (trail ? [trail.latitude, trail.longitude] : FALLBACK_CENTER)

  return (
    <div className={cn('wa-leaflet-map h-80', className)}>
      <MapContainer center={center} dragging={false} scrollWheelZoom={false} zoom={13}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitRoute positions={[...plannedPositions, ...positions]} />
        {plannedPositions.length > 1 ? (
          <Polyline
            pathOptions={{ color: 'hsl(var(--muted-foreground))', dashArray: '8 8', weight: 4 }}
            positions={plannedPositions}
          />
        ) : null}
        {positions.length > 1 ? (
          <Polyline pathOptions={{ color: 'hsl(var(--primary))', weight: 5 }} positions={positions} />
        ) : null}
        {positions[0] ? (
          <CircleMarker
            center={positions[0]}
            pathOptions={{ color: 'hsl(var(--primary))', fillColor: 'hsl(var(--card))', fillOpacity: 1 }}
            radius={7}
          />
        ) : null}
        {positions.length > 1 ? (
          <CircleMarker
            center={positions[positions.length - 1]}
            pathOptions={{ color: 'hsl(var(--accent))', fillColor: 'hsl(var(--accent))', fillOpacity: 1 }}
            radius={7}
          />
        ) : null}
        {plannedRoute?.waypoints.map((waypoint) => (
          <CircleMarker
            center={[waypoint.latitude, waypoint.longitude]}
            key={waypoint.id}
            pathOptions={{
              color: waypoint.type === 'finish' ? 'hsl(var(--accent))' : 'hsl(var(--primary))',
              fillColor: 'hsl(var(--card))',
              fillOpacity: 1,
            }}
            radius={6}
          >
            <Popup>
              <div className="flex min-w-40 flex-col gap-1">
                <p className="font-semibold">{waypoint.name}</p>
                <p className="text-xs text-muted-foreground">{waypoint.notes}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}

function FitRoute({ positions }: { positions: [number, number][] }) {
  const map = useMap()

  useEffect(() => {
    if (positions.length === 0) {
      return
    }

    if (positions.length === 1) {
      map.setView(positions[0], 14)
      return
    }

    map.fitBounds(positions, { maxZoom: 15, padding: [24, 24] })
  }, [map, positions])

  return null
}
