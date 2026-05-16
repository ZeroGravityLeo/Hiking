import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, FileDown, Printer, Route, Settings, Trophy, UserRound } from 'lucide-react'
import { toast } from 'sonner'

import { AuthPanel } from '@/components/auth/AuthPanel'
import { MetricCard } from '@/components/common/MetricCard'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
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
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/hooks/useAuth'
import { formatActivityDate, getPhotoCountForActivity } from '@/lib/community'
import { fetchProfileStats, updateKidsMode, type ProfileStats } from '@/lib/mvp-api'
import {
  activityToGpx,
  activityToKml,
  downloadTextFile,
  printRouteToPdf,
  printableActivityRoute,
} from '@/lib/route-files'
import { isSupabaseConfigured } from '@/lib/supabase'
import { formatDuration } from '@/lib/tracking'
import type { Activity } from '@/lib/types'

export function ProfilePage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [loading, setLoading] = useState(Boolean(user))
  const [error, setError] = useState<string | null>(null)
  const [savingKidsMode, setSavingKidsMode] = useState(false)

  useEffect(() => {
    let mounted = true
    setLoading(Boolean(user))
    setError(null)

    fetchProfileStats(user)
      .then((nextStats) => {
        if (mounted) {
          setStats(nextStats)
        }
      })
      .catch((caught: unknown) => {
        if (mounted) {
          setError(caught instanceof Error ? caught.message : 'Could not load profile.')
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
  }, [user])

  const toggleKidsMode = async (kidsMode: boolean) => {
    if (!user || !isSupabaseConfigured) {
      setStats((current) =>
        current?.profile
          ? {
              ...current,
              profile: {
                ...current.profile,
                kids_mode: kidsMode,
              },
            }
          : current,
      )
      toast.success(kidsMode ? 'Kids mode enabled locally.' : 'Kids mode disabled locally.')
      return
    }

    setSavingKidsMode(true)
    try {
      await updateKidsMode(user.id, kidsMode)
      setStats((current) =>
        current?.profile
          ? {
              ...current,
              profile: {
                ...current.profile,
                kids_mode: kidsMode,
              },
            }
          : current,
      )
      toast.success(kidsMode ? 'Kids mode enabled.' : 'Kids mode disabled.')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Could not update kids mode.')
    } finally {
      setSavingKidsMode(false)
    }
  }

  if (!user && isSupabaseConfigured) {
    return (
      <main className="wa-page">
        <PageHeader
          description="Sign in to see XP, coins, levels, distance, calories, and kids mode."
          eyebrow="Profile"
          title="Explorer profile"
        />
        <AuthPanel />
      </main>
    )
  }

  const displayEmail = user?.email ?? stats?.profile?.email ?? 'demo@wildalberta.local'

  const exportActivity = (activity: Activity, format: 'gpx' | 'kml') => {
    try {
      const filename = `${activity.title.replaceAll(/\s+/g, '-').toLowerCase()}.${format}`
      const content = format === 'gpx' ? activityToGpx(activity) : activityToKml(activity)
      const mimeType = format === 'gpx' ? 'application/gpx+xml' : 'application/vnd.google-earth.kml+xml'
      downloadTextFile(filename, content, mimeType)
      toast.success(`${format.toUpperCase()} export ready.`)
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Could not export this activity.')
    }
  }

  const printActivity = (activity: Activity) => {
    try {
      printRouteToPdf(printableActivityRoute(activity))
      toast.success('Print view opened.')
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Could not open print view.')
    }
  }

  return (
    <main className="wa-page">
      <PageHeader
        description="A performance profile for hikes, points, readiness, route exports, badges, and family mode."
        eyebrow="Profile"
        title={stats?.profile?.username ?? 'Explorer profile'}
      />

      {loading ? <LoadingState label="Loading profile..." /> : null}
      {error ? <ErrorState message={error} /> : null}

      <section className="overflow-hidden rounded-[1.6rem] bg-primary text-primary-foreground shadow-lift">
        <div className="flex flex-col gap-5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-[1.4rem] bg-card text-xl font-bold text-foreground shadow-soft">
              {(stats?.profile?.username ?? displayEmail).slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xl font-bold">{stats?.profile?.username ?? 'Explorer'}</p>
              <p className="truncate text-sm text-primary-foreground/75">{displayEmail}</p>
            </div>
            <Button
              asChild
              className="border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              size="icon"
              variant="outline"
            >
              <Link aria-label="Open account settings" to="/settings">
                <Settings />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <ProfileHeroMetric icon={Trophy} label="Level" value={`${stats?.profile?.level ?? 1}`} />
            <ProfileHeroMetric icon={Award} label="Points" value={`${stats?.pointsBalance ?? 0}`} />
            <ProfileHeroMetric icon={Route} label="Hikes" value={`${stats?.completedHikes ?? 0}`} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Distance" value={`${(stats?.totalDistanceKm ?? 0).toFixed(1)} km`} />
        <MetricCard label="Moving time" value={formatDuration(stats?.totalMovingSeconds ?? 0)} />
        <MetricCard label="Calories" value={`${stats?.totalCalories ?? 0}`} />
        <MetricCard
          label="Avg readiness"
          value={stats?.averageReadinessScore === null ? '-' : `${stats?.averageReadinessScore ?? 0}%`}
        />
        <MetricCard label="XP" value={`${stats?.profile?.xp ?? 0}`} />
        <MetricCard label="Coins" value={`${stats?.profile?.coins ?? 0}`} />
        <MetricCard label="Published posts" value={`${stats?.publishedPosts ?? 0}`} />
        <MetricCard label="Badges" value={`${stats?.completedMissionCount ?? 0}`} />
      </section>

      <Card>
        <CardContent className="flex items-center justify-between gap-4 pt-5">
          <div className="flex items-start gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <UserRound aria-hidden="true" className="size-5" />
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold">Kids explorer mode</span>
              <span className="text-sm text-muted-foreground">
                Prioritize simpler, safer family recommendations.
              </span>
            </div>
          </div>
          <Switch
            checked={Boolean(stats?.profile?.kids_mode)}
            disabled={savingKidsMode}
            onCheckedChange={toggleKidsMode}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Completed activity history</CardTitle>
          <CardDescription>
            Preparation summaries appear when activities were saved from a prepared trail.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!loading && (stats?.recentActivities.length ?? 0) === 0 ? (
            <EmptyState
              description="Save a tracked hike to see readiness score, water plan, estimated calories, and actual calories here."
              title="No completed hikes yet"
            />
          ) : null}
          {stats?.recentActivities.map((activity) => {
            const summary = activity.route_data?.preparationSummary
            const photosCount = getPhotoCountForActivity(activity)
            const missionCount = activity.route_data?.missionCompletions?.length ?? 0
            return (
              <div className="flex flex-col gap-3 rounded-2xl border bg-background/75 p-3 shadow-soft" key={activity.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{activity.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatActivityDate(activity.started_at)} · {activity.distance_km.toFixed(2)} km ·{' '}
                      {formatDuration(activity.duration_seconds)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {summary ? (
                      <Badge variant={summary.readinessScore < 60 ? 'destructive' : 'secondary'}>
                        {summary.readinessScore}% ready
                      </Badge>
                    ) : (
                      <Badge variant="outline">no prep</Badge>
                    )}
                    <Badge variant={activity.visibility === 'public' ? 'secondary' : 'outline'}>
                      {activity.visibility ?? 'private'}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <HistoryMetric label="Actual calories" value={`${activity.calories}`} />
                  <HistoryMetric
                    label="Estimated calories"
                    value={summary ? `${summary.estimatedCalories.min}-${summary.estimatedCalories.max}` : '-'}
                  />
                  <HistoryMetric
                    label="Recommended water"
                    value={
                      summary
                        ? `${summary.recommendedWaterLiters.min.toFixed(1)}-${summary.recommendedWaterLiters.max.toFixed(1)} L`
                        : '-'
                    }
                  />
                  <HistoryMetric
                    label="Checklist"
                    value={summary ? `${summary.checklistCompletionPercent}%` : '-'}
                  />
                  <HistoryMetric label="Photos" value={`${photosCount}`} />
                  <HistoryMetric label="Mission badges" value={`${missionCount}`} />
                  <HistoryMetric label="Points" value={`+${activity.points_earned ?? 0}`} />
                  <HistoryMetric label="Trail" value={activity.trail_name ?? 'Free hike'} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button onClick={() => exportActivity(activity, 'gpx')} size="sm" variant="outline">
                    <FileDown data-icon="inline-start" />
                    GPX
                  </Button>
                  <Button onClick={() => exportActivity(activity, 'kml')} size="sm" variant="outline">
                    KML
                  </Button>
                  <Button onClick={() => printActivity(activity)} size="sm" variant="outline">
                    <Printer data-icon="inline-start" />
                    PDF
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </main>
  )
}

function HistoryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card px-3 py-2">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  )
}

function ProfileHeroMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Trophy
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl bg-card/10 px-3 py-3 text-primary-foreground ring-1 ring-primary-foreground/10">
      <Icon className="mb-2 size-4 text-gold" aria-hidden="true" />
      <p className="text-[11px] font-semibold uppercase text-primary-foreground/70">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  )
}
