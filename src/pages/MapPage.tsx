import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Filter, Play, Route } from 'lucide-react'

import { PageHeader } from '@/components/common/PageHeader'
import { TrailLeafletMap } from '@/components/maps/TrailLeafletMap'
import { TrailMetricGrid } from '@/components/trails/TrailCard'
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
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-state'
import { fetchTrails } from '@/lib/mvp-api'
import { getTrailRoute } from '@/lib/trail-navigation'
import type { Difficulty, Trail } from '@/lib/types'

type DifficultyFilter = 'all' | Difficulty

const filters: DifficultyFilter[] = ['all', 'easy', 'moderate', 'hard']

export function MapPage() {
  const [searchParams] = useSearchParams()
  const trailParam = searchParams.get('trail')
  const [trails, setTrails] = useState<Trail[]>([])
  const [selectedTrailId, setSelectedTrailId] = useState<string | null>(null)
  const [filter, setFilter] = useState<DifficultyFilter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    fetchTrails()
      .then((nextTrails) => {
        if (!mounted) {
          return
        }
        setTrails(nextTrails)
        const requestedTrail = trailParam
          ? nextTrails.find((trail) => trail.slug === trailParam || trail.id === trailParam)
          : null
        setSelectedTrailId(requestedTrail?.id ?? nextTrails[0]?.id ?? null)
      })
      .catch((caught: unknown) => {
        if (mounted) {
          setError(caught instanceof Error ? caught.message : 'Could not load trail map.')
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [trailParam])

  const filteredTrails = useMemo(() => {
    if (filter === 'all') {
      return trails
    }
    return trails.filter((trail) => trail.difficulty === filter)
  }, [filter, trails])

  const selectedTrail = useMemo(() => {
    return trails.find((trail) => trail.id === selectedTrailId) ?? null
  }, [selectedTrailId, trails])
  const selectedRoute = useMemo(() => {
    return selectedTrail ? getTrailRoute(selectedTrail) : null
  }, [selectedTrail])

  return (
    <main className="wa-page">
      <PageHeader
        description="Pan across Alberta trailheads, filter by difficulty, and start a GPS recording from the selected trail."
        eyebrow="Map"
        title="Alberta trail map"
      />

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground">
          <Filter aria-hidden="true" />
          Difficulty
        </span>
        {filters.map((nextFilter) => (
          <Button
            key={nextFilter}
            onClick={() => setFilter(nextFilter)}
            size="sm"
            variant={filter === nextFilter ? 'default' : 'outline'}
          >
            {nextFilter}
          </Button>
        ))}
      </div>

      {loading ? <LoadingState label="Loading trail map..." /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && filteredTrails.length === 0 ? (
        <EmptyState
          description="Try another difficulty filter or add more published trails."
          title="No trails on this map"
        />
      ) : null}

      {!loading && filteredTrails.length > 0 ? (
        <TrailLeafletMap
          onSelectTrail={(trail) => setSelectedTrailId(trail.id)}
          selectedTrail={selectedTrail}
          trails={filteredTrails}
        />
      ) : null}

      {selectedTrail ? (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <CardTitle>{selectedTrail.name}</CardTitle>
                <CardDescription>{selectedTrail.region}</CardDescription>
              </div>
              <Badge variant="secondary">{selectedTrail.difficulty}</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">{selectedTrail.description}</p>
            <TrailMetricGrid trail={selectedTrail} />
            <div className="rounded-lg border bg-background p-3 text-sm">
              <p className="font-medium">Safety notes</p>
              <p className="mt-1 text-muted-foreground">{selectedTrail.safety_notes}</p>
            </div>
            {selectedRoute ? (
              <div className="rounded-lg border bg-background p-3 text-sm">
                <p className="font-medium">Planned route polyline</p>
                <p className="mt-1 text-muted-foreground">
                  {selectedRoute.coordinates.length} route points · {selectedRoute.waypoints.length} checkpoints
                </p>
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline">
                <Link to={`/trails/${selectedTrail.slug}`}>
                  <Route data-icon="inline-start" />
                  Details
                </Link>
              </Button>
              <Button asChild>
                <Link to={`/tracking?trail=${selectedTrail.slug}`}>
                  <Play data-icon="inline-start" />
                  Track
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </main>
  )
}
