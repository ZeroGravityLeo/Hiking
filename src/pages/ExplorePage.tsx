import { useEffect, useMemo, useState } from 'react'
import { Filter } from 'lucide-react'

import { PageHeader } from '@/components/common/PageHeader'
import { TrailSummaryCard } from '@/components/trails/TrailCard'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-state'
import { fetchTrails } from '@/lib/mvp-api'
import type { Difficulty, Trail } from '@/lib/types'

type DifficultyFilter = 'all' | Difficulty

const filters: DifficultyFilter[] = ['all', 'easy', 'moderate', 'hard']

export function ExplorePage() {
  const [trails, setTrails] = useState<Trail[]>([])
  const [filter, setFilter] = useState<DifficultyFilter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    fetchTrails()
      .then((nextTrails) => {
        if (mounted) {
          setTrails(nextTrails)
        }
      })
      .catch((caught: unknown) => {
        if (mounted) {
          setError(caught instanceof Error ? caught.message : 'Could not load trails.')
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

  const filteredTrails = useMemo(() => {
    if (filter === 'all') {
      return trails
    }
    return trails.filter((trail) => trail.difficulty === filter)
  }, [filter, trails])

  return (
    <main className="wa-page">
      <PageHeader
        description="Browse public Alberta trail seeds with distance, elevation, time, map handoff, and tracking actions."
        eyebrow="Explore"
        title="Trail discovery"
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

      {loading ? <LoadingState label="Loading trails..." /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && filteredTrails.length === 0 ? (
        <EmptyState
          description="Try another difficulty filter or seed more published trails."
          title="No trails found"
        />
      ) : null}

      <section className="flex flex-col gap-3">
        {filteredTrails.map((trail) => (
          <TrailSummaryCard key={trail.id} trail={trail} />
        ))}
      </section>
    </main>
  )
}
