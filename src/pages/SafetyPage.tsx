import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Copy, MapPin, Phone, RotateCcw, Share2, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'

import { MetricCard } from '@/components/common/MetricCard'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingState } from '@/components/ui/loading-state'
import { useBatteryStatus } from '@/hooks/useBatteryStatus'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { getActiveTrackingSession } from '@/lib/local-db'
import { fetchTrails } from '@/lib/mvp-api'
import {
  getEmergencyInfo,
  getOfflineTrailState,
  getTripPlan,
  shareOrCopyText,
} from '@/lib/trail-navigation'
import { formatDuration } from '@/lib/tracking'
import type { ActivityPoint, LocalTrackingSession, Trail } from '@/lib/types'

export function SafetyPage() {
  const online = useNetworkStatus()
  const battery = useBatteryStatus()
  const [session, setSession] = useState<LocalTrackingSession | null>(null)
  const [trails, setTrails] = useState<Trail[]>([])
  const [fallbackPoint, setFallbackPoint] = useState<ActivityPoint | null>(null)
  const [loading, setLoading] = useState(true)
  const emergency = getEmergencyInfo()

  useEffect(() => {
    let mounted = true

    Promise.all([getActiveTrackingSession(), fetchTrails()])
      .then(([activeSession, nextTrails]) => {
        if (!mounted) {
          return
        }
        setSession(activeSession)
        setTrails(nextTrails)
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (mounted) {
            setFallbackPoint({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              elevation: position.coords.altitude,
              accuracy: position.coords.accuracy,
              recorded_at: new Date(position.timestamp).toISOString(),
            })
          }
        },
        () => undefined,
        { enableHighAccuracy: true, maximumAge: 10_000, timeout: 10_000 },
      )
    }

    return () => {
      mounted = false
    }
  }, [])

  const tripPlan = getTripPlan()
  const selectedTrail = useMemo(() => {
    return (
      trails.find((trail) => trail.id === session?.trailId) ??
      trails.find((trail) => trail.slug === tripPlan?.trailSlug) ??
      null
    )
  }, [session?.trailId, trails, tripPlan?.trailSlug])
  const latestPoint = session?.points.at(-1) ?? fallbackPoint
  const coordinates = latestPoint
    ? `${latestPoint.latitude.toFixed(6)}, ${latestPoint.longitude.toFixed(6)}`
    : 'Coordinates unavailable'
  const offlineState = selectedTrail ? getOfflineTrailState(selectedTrail.slug) : null

  const copyCoordinates = async () => {
    await navigator.clipboard.writeText(coordinates)
    toast.success('Coordinates copied.')
  }

  const shareLocation = async () => {
    const text = `Wild Alberta location\nCoordinates: ${coordinates}\nTrail: ${selectedTrail?.name ?? 'Unknown'}`
    const outcome = await shareOrCopyText(text)
    toast.success(outcome === 'shared' ? 'Location shared.' : 'Location copied.')
  }

  return (
    <main className="wa-page">
      <PageHeader
        description="Quick safety status, coordinates, offline context, and emergency actions."
        eyebrow="Safety"
        title="Hike safety"
      />

      {loading ? <LoadingState label="Loading safety status..." /> : null}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle>Current status</CardTitle>
              <CardDescription>Use this screen to copy or share your last known position.</CardDescription>
            </div>
            <Badge variant={online ? 'secondary' : 'destructive'}>
              {online ? 'online' : 'offline'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-lg border bg-background p-3">
            <p className="flex items-center gap-2 text-sm font-medium">
              <MapPin aria-hidden="true" />
              Current GPS coordinates
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{coordinates}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Selected trail" value={selectedTrail?.name ?? 'None'} />
            <MetricCard
              label="Started at"
              value={session ? new Date(session.startedAt).toLocaleTimeString() : '-'}
            />
            <MetricCard label="Elapsed time" value={formatDuration(session?.elapsedSeconds ?? 0)} />
            <MetricCard label="Distance" value={`${(session?.distanceKm ?? 0).toFixed(2)} km`} />
            <MetricCard
              label="GPS accuracy"
              value={latestPoint?.accuracy ? `${Math.round(latestPoint.accuracy)} m` : '-'}
            />
            <MetricCard label="Offline trail" value={offlineState?.label ?? 'Not selected'} />
          </div>

          {battery.supported ? (
            <div className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">
              Battery reminder: {Math.round((battery.level ?? 0) * 100)}%
              {battery.charging ? ' and charging' : battery.low ? ' low, conserve phone power' : ' remaining'}
            </div>
          ) : (
            <div className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">
              Battery reminder: check your phone battery before relying on GPS.
            </div>
          )}

          {!session ? (
            <EmptyState
              description="Start tracking to populate elapsed time, distance, and trail context."
              title="No active tracking session"
            />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <ShieldAlert aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <CardTitle>Emergency actions</CardTitle>
              <CardDescription>{emergency.disclaimer}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{emergency.regionalNote}</p>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={copyCoordinates} variant="outline">
              <Copy data-icon="inline-start" />
              Copy coordinates
            </Button>
            <Button onClick={shareLocation} variant="outline">
              <Share2 data-icon="inline-start" />
              Share my location
            </Button>
            <Button asChild>
              <a href={`tel:${emergency.emergencyNumber}`}>
                <Phone data-icon="inline-start" />
                Call emergency
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link to={selectedTrail ? `/trails/${selectedTrail.slug}#prepare` : '/explore'}>
                Open checklist
              </Link>
            </Button>
            <Button asChild className="col-span-2" variant="outline">
              <Link to={selectedTrail ? `/tracking?trail=${selectedTrail.slug}` : '/tracking'}>
                <RotateCcw data-icon="inline-start" />
                Return to tracking
              </Link>
            </Button>
          </div>
          <div className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">
            {emergency.offlineInstructions.map((instruction) => (
              <p key={instruction}>- {instruction}</p>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
