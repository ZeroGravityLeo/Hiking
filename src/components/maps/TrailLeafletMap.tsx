import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getTrailRoute } from '@/lib/trail-navigation'
import type { Trail } from '@/lib/types'
import { cn } from '@/lib/utils'

const ALBERTA_CENTER: [number, number] = [51.1784, -115.5708]

interface TrailLeafletMapProps {
  trails: Trail[]
  selectedTrail: Trail | null
  onSelectTrail: (trail: Trail) => void
  className?: string
}

export function TrailLeafletMap({
  trails,
  selectedTrail,
  onSelectTrail,
  className,
}: TrailLeafletMapProps) {
  const selectedTrailId = selectedTrail?.id ?? null
  const selectedRoute = useMemo(() => {
    return selectedTrail ? getTrailRoute(selectedTrail) : null
  }, [selectedTrail])
  const plannedRoutePositions = useMemo(() => {
    return selectedRoute?.coordinates.map((point) => [point.latitude, point.longitude] as [number, number]) ?? []
  }, [selectedRoute])

  return (
    <div className={cn('wa-leaflet-map h-[440px]', className)}>
      <MapContainer center={ALBERTA_CENTER} scrollWheelZoom={false} zoom={8}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitTrailBounds plannedRoutePositions={plannedRoutePositions} trails={trails} />
        {selectedTrail ? <PanToTrail trail={selectedTrail} /> : null}
        {plannedRoutePositions.length > 1 ? (
          <Polyline
            pathOptions={{ color: 'hsl(var(--primary))', dashArray: '8 8', weight: 4 }}
            positions={plannedRoutePositions}
          />
        ) : null}
        {selectedRoute?.waypoints.map((waypoint) => (
          <CircleMarker
            center={[waypoint.latitude, waypoint.longitude]}
            key={waypoint.id}
            pathOptions={{
              color: waypoint.type === 'finish' ? 'hsl(var(--accent))' : 'hsl(var(--primary))',
              fillColor: 'hsl(var(--card))',
              fillOpacity: 1,
            }}
            radius={7}
          >
            <Popup>
              <div className="flex min-w-40 flex-col gap-1">
                <p className="font-semibold">{waypoint.name}</p>
                <p className="text-xs text-muted-foreground">{waypoint.type}</p>
                <p className="text-xs text-muted-foreground">{waypoint.notes}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
        {trails.map((trail) => (
          <Marker
            eventHandlers={{
              click: () => onSelectTrail(trail),
            }}
            icon={createTrailIcon(trail, trail.id === selectedTrailId)}
            key={trail.id}
            position={[trail.latitude, trail.longitude]}
          >
            <Popup>
              <div className="flex min-w-44 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{trail.name}</p>
                    <p className="text-xs text-muted-foreground">{trail.region}</p>
                  </div>
                  <Badge variant="secondary">{trail.difficulty}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {trail.distance_km} km · {trail.elevation_gain_m} m gain
                </p>
                {trail.id === selectedTrailId ? (
                  <p className="text-xs text-muted-foreground">Planned route polyline loaded</p>
                ) : null}
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/trails/${trail.slug}`}>Details</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link to={`/tracking?trail=${trail.slug}`}>Track</Link>
                  </Button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

function createTrailIcon(trail: Trail, selected: boolean) {
  return L.divIcon({
    className: '',
    html: `<span class="${cn(
      'wa-trail-marker',
      `wa-trail-marker--${trail.difficulty}`,
      selected && 'wa-trail-marker--selected',
    )}"></span>`,
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  })
}

function FitTrailBounds({
  plannedRoutePositions,
  trails,
}: {
  plannedRoutePositions: [number, number][]
  trails: Trail[]
}) {
  const map = useMap()
  const bounds = useMemo(
    () => [
      ...trails.map((trail) => [trail.latitude, trail.longitude] as [number, number]),
      ...plannedRoutePositions,
    ],
    [plannedRoutePositions, trails],
  )

  useEffect(() => {
    if (bounds.length === 0) {
      return
    }

    if (bounds.length === 1) {
      map.setView(bounds[0], 11)
      return
    }

    map.fitBounds(bounds, { maxZoom: 11, padding: [32, 32] })
  }, [bounds, map])

  return null
}

function PanToTrail({ trail }: { trail: Trail }) {
  const map = useMap()

  useEffect(() => {
    map.panTo([trail.latitude, trail.longitude])
  }, [map, trail.latitude, trail.longitude])

  return null
}
