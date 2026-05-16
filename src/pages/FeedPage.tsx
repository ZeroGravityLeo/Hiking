import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Flame, Play, Route, Trophy } from 'lucide-react'

import { FeedPostCard } from '@/components/community/FeedPostCard'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-state'
import { fetchFeedItems } from '@/lib/mvp-api'
import type { FeedItem } from '@/lib/types'

export function FeedPage() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    fetchFeedItems()
      .then((nextItems) => {
        if (mounted) {
          setFeedItems(nextItems)
        }
      })
      .catch((caught: unknown) => {
        if (mounted) {
          setError(caught instanceof Error ? caught.message : 'Could not load feed.')
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
  }, [])

  return (
    <main className="wa-page">
      <section className="overflow-hidden rounded-[1.6rem] border bg-card shadow-lift">
        <div className="flex flex-col gap-5 p-5">
          <PageHeader
            description="A performance-style trail feed for public hikes, photos, readiness, comments, likes, and earned points."
            eyebrow="Community"
            title="Trail efforts from the pack"
          />
          <div className="grid grid-cols-3 gap-2">
            <FeedSummaryMetric icon={Activity} label="Posts" value={`${feedItems.length}`} />
            <FeedSummaryMetric
              icon={Flame}
              label="Calories"
              value={`${feedItems.reduce((sum, item) => sum + (item.metadata.calories ?? 0), 0)}`}
            />
            <FeedSummaryMetric
              icon={Trophy}
              label="Points"
              value={`${feedItems.reduce((sum, item) => sum + (item.metadata.points_earned ?? 0), 0)}`}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild>
              <Link to="/tracking">
                <Play data-icon="inline-start" />
                Record hike
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/explore">
                <Route data-icon="inline-start" />
                Find trail
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {loading ? <LoadingState label="Loading feed..." /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && feedItems.length === 0 ? (
        <EmptyState description="Save an activity to create the first feed item." title="No feed items yet" />
      ) : null}

      <section className="flex flex-col gap-3">
        {feedItems.map((item) => (
          <FeedPostCard item={item} key={item.id} />
        ))}
      </section>
    </main>
  )
}

function FeedSummaryMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity
  label: string
  value: string
}) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-3">
        <Icon className="mb-2 size-4 text-primary" aria-hidden="true" />
        <p className="text-[11px] font-semibold uppercase text-muted-foreground">{label}</p>
        <p className="mt-1 text-base font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}
