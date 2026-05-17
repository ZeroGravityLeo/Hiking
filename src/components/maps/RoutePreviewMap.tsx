import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import type { Polyline as LeafletPolyline } from 'leaflet'

import { getTrailRoute } from '@/lib/trail-navigation'
import type { ActivityPoint, Trail } from '@/lib/types'
import { cn } from '@/lib/utils'

const FALLBACK_CENTER: [number, number] = [51.1784, -115.5708]

function toPositions(points: ActivityPoint[]) {
  return points.map((point) => [point.latitude, point.longitude] as [number, number])
}

export function RoutePreviewMap({
  livePoints,
  points,
  trail,
  className,
}: {
  livePoints?: ActivityPoint[]
  points: ActivityPoint[]
  trail: Trail | null
  className?: string
}) {
  const positions = useMemo(() => toPositions(points), [points])
  const isLivePreview = livePoints !== undefined
  const livePositions = useMemo(() => (livePoints ? toPositions(livePoints) : []), [livePoints])
  const activePositions = isLivePreview ? livePositions : positions
  const plannedRoute = useMemo(() => (trail ? getTrailRoute(trail) : null), [trail])
  const plannedPositions = useMemo(
    () => plannedRoute?.coordinates.map((point) => [point.latitude, point.longitude] as [number, number]) ?? [],
    [plannedRoute],
  )
  const fitPositions = useMemo(() => {
    if (isLivePreview && plannedPositions.length > 0) {
      return plannedPositions
    }

    return [...plannedPositions, ...activePositions]
  }, [activePositions, isLivePreview, plannedPositions])
  const center: [number, number] =
    activePositions[0] ?? plannedPositions[0] ?? (trail ? [trail.latitude, trail.longitude] : FALLBACK_CENTER)

  return (
    <div className={cn('wa-leaflet-map h-80', className)}>
      <MapContainer center={center} dragging={false} scrollWheelZoom={false} zoom={13}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitRoute positions={fitPositions} />
        {plannedPositions.length > 1 ? (
          <Polyline
            pathOptions={{ color: 'hsl(var(--muted-foreground))', dashArray: '8 8', weight: 4 }}
            positions={plannedPositions}
          />
        ) : null}
        {isLivePreview ? (
          <LiveRoutePolyline positions={activePositions} />
        ) : activePositions.length > 1 ? (
          <Polyline
            pathOptions={{ color: 'hsl(var(--primary))', lineCap: 'round', lineJoin: 'round', weight: 4 }}
            positions={activePositions}
          />
        ) : null}
        {activePositions[0] ? (
          <CircleMarker
            center={activePositions[0]}
            pathOptions={{ color: 'hsl(var(--primary))', fillColor: 'hsl(var(--card))', fillOpacity: 1 }}
            radius={7}
          />
        ) : null}
        {activePositions.length > 1 ? (
          <CircleMarker
            center={activePositions[activePositions.length - 1]}
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

function LiveRoutePolyline({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  const polylineRef = useRef<LeafletPolyline | null>(null)

  useEffect(() => {
    polylineRef.current = L.polyline([], {
      color: 'hsl(var(--primary))',
      lineCap: 'round',
      lineJoin: 'round',
      opacity: 0.95,
      weight: 4,
    }).addTo(map)

    return () => {
      polylineRef.current?.remove()
      polylineRef.current = null
    }
  }, [map])

  useEffect(() => {
    polylineRef.current?.setLatLngs(positions)
  }, [positions])

  return null
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
