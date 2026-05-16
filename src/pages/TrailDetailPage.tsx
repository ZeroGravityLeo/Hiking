import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Map, Play, ShieldAlert } from 'lucide-react'

import {
  CommunityPhotosSection,
  TrailReviewsSection,
} from '@/components/community/TrailCommunity'
import { PageHeader } from '@/components/common/PageHeader'
import { TrailLeafletMap } from '@/components/maps/TrailLeafletMap'
import { HikePreparationSection } from '@/components/preparation/HikePreparationSection'
import { OfflineTrailCard } from '@/components/trails/OfflineTrailCard'
import {
  TrailElevationProfileCard,
  TrailHazardsCard,
  TrailKeyPointsCard,
} from '@/components/trails/TrailNavigationCards'
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
import { useAuth } from '@/hooks/useAuth'
import { useTrailPreparation } from '@/hooks/useTrailPreparation'
import { fetchProfileStats, fetchTrailBySlug, type ProfileStats } from '@/lib/mvp-api'
import type { Trail } from '@/lib/types'

export function TrailDetailPage() {
  const { user } = useAuth()
  const { slug } = useParams()
  const [trail, setTrail] = useState<Trail | null>(null)
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [, setOfflineRefreshKey] = useState(0)
  const preparation = useTrailPreparation({
    trail,
    kidsMode: Boolean(profileStats?.profile?.kids_mode),
  })

  useEffect(() => {
    let mounted = true
    if (!slug) {
      setLoading(false)
      setTrail(null)
      return undefined
    }

    fetchTrailBySlug(slug)
      .then((nextTrail) => {
        if (mounted) {
          setTrail(nextTrail)
        }
      })
      .catch((caught: unknown) => {
        if (mounted) {
          setError(caught instanceof Error ? caught.message : 'Could not load trail details.')
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
  }, [slug])

  useEffect(() => {
    let mounted = true
    fetchProfileStats(user)
      .then((stats) => {
        if (mounted) {
          setProfileStats(stats)
        }
      })
      .catch(() => undefined)

    return () => {
      mounted = false
    }
  }, [user])

  return (
    <main className="wa-page">
      <Button asChild className="w-fit" size="sm" variant="outline">
        <Link to="/explore">
          <ArrowLeft data-icon="inline-start" />
          Trails
        </Link>
      </Button>

      {loading ? <LoadingState label="Loading trail details..." /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !trail ? (
        <EmptyState
          description="This trail may be unpublished or unavailable."
          title="Trail not found"
        />
      ) : null}

      {trail ? (
        <>
          <PageHeader
            description={trail.description}
            eyebrow={trail.region}
            title={trail.name}
          />

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <CardTitle>Trail overview</CardTitle>
                  <CardDescription>Plan, inspect, and start tracking this route.</CardDescription>
                </div>
                <Badge variant="secondary">{trail.difficulty}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <TrailMetricGrid trail={trail} />
              <div className="rounded-lg border bg-background p-3 text-sm">
                <p className="flex items-center gap-2 font-medium">
                  <ShieldAlert aria-hidden="true" />
                  Safety notes
                </p>
                <p className="mt-1 text-muted-foreground">{trail.safety_notes}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline">
                  <Link to={`/map?trail=${trail.slug}`}>
                    <Map data-icon="inline-start" />
                    Map
                  </Link>
                </Button>
                <Button asChild>
                  <Link to={`/tracking?trail=${trail.slug}`}>
                    <Play data-icon="inline-start" />
                    Start tracking
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <TrailLeafletMap
            className="h-80"
            onSelectTrail={() => undefined}
            selectedTrail={trail}
            trails={[trail]}
          />

          <OfflineTrailCard
            checklistState={preparation.checklist}
            onOfflineStateChange={() => setOfflineRefreshKey((key) => key + 1)}
            plan={preparation.plan}
            trail={trail}
          />

          <TrailHazardsCard trail={trail} />
          <TrailKeyPointsCard trail={trail} />
          <TrailElevationProfileCard trail={trail} />

          {preparation.loading ? <LoadingState label="Preparing hike recommendations..." /> : null}
          {preparation.error ? <ErrorState message={preparation.error} /> : null}
          {preparation.plan ? (
            <HikePreparationSection
              acknowledgements={preparation.acknowledgements}
              checklistState={preparation.checklist}
              onAcknowledgementChange={preparation.setAcknowledgement}
              onChecklistChange={preparation.setChecklistItem}
              plan={preparation.plan}
            />
          ) : null}

          <CommunityPhotosSection trail={trail} />
          <TrailReviewsSection trail={trail} />
        </>
      ) : null}
    </main>
  )
}
