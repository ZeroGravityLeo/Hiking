import { useEffect, useMemo, useState } from 'react'

import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
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
import { fetchMissionProgress, fetchMissions } from '@/lib/mvp-api'
import type { Mission, MissionProgress } from '@/lib/types'

export function MissionsPage() {
  const { user } = useAuth()
  const [missions, setMissions] = useState<Mission[]>([])
  const [progress, setProgress] = useState<MissionProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    Promise.all([fetchMissions(), fetchMissionProgress(user?.id)])
      .then(([nextMissions, nextProgress]) => {
        if (mounted) {
          setMissions(nextMissions)
          setProgress(nextProgress)
        }
      })
      .catch((caught: unknown) => {
        if (mounted) {
          setError(caught instanceof Error ? caught.message : 'Could not load missions.')
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
  }, [user?.id])

  const progressByMission = useMemo(
    () => new Map(progress.map((item) => [item.mission_id, item])),
    [progress],
  )

  return (
    <main className="wa-page">
      <PageHeader
        description="Early mission cards that can update after saved GPS activities."
        eyebrow="Missions"
        title="Explorer challenges"
      />

      {loading ? <LoadingState label="Loading missions..." /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && missions.length === 0 ? (
        <EmptyState description="Seed active missions to start gamified progress." title="No missions yet" />
      ) : null}

      <section className="flex flex-col gap-3">
        {missions.map((mission) => {
          const missionProgress = progressByMission.get(mission.id)
          const value = missionProgress?.progress_value ?? 0
          const percent = Math.min(100, (value / mission.target_value) * 100)

          return (
            <Card key={mission.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <CardTitle>{mission.title}</CardTitle>
                    <CardDescription>{mission.description}</CardDescription>
                  </div>
                  <Badge variant={missionProgress?.completed ? 'default' : 'secondary'}>
                    {missionProgress?.completed ? 'complete' : mission.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {value.toFixed(value % 1 === 0 ? 0 : 1)} / {mission.target_value}
                  </span>
                  <span>
                    +{mission.reward_xp} XP / +{mission.reward_coins} coins
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>
    </main>
  )
}
