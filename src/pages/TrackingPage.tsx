import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  Bell,
  BatteryWarning,
  Flame,
  Loader2,
  Map as MapIcon,
  MapPin,
  Navigation,
  Pause,
  Play,
  RotateCcw,
  Route,
  Save,
  ShieldCheck,
  Square,
  Timer,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  PostHikeSummaryCard,
  type PostHikeSaveMode,
} from '@/components/community/PostHikeSummaryCard'
import { MetricCard } from '@/components/common/MetricCard'
import { PageHeader } from '@/components/common/PageHeader'
import { RoutePreviewMap } from '@/components/maps/RoutePreviewMap'
import { BeforeStartPreparationCard } from '@/components/preparation/BeforeStartPreparationCard'
import { TrailMetricGrid } from '@/components/trails/TrailCard'
import { GeolocationConsentDialog } from '@/components/tracking/GeolocationConsentDialog'
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
import { useActivityQueue } from '@/hooks/useActivityQueue'
import { useAuth } from '@/hooks/useAuth'
import { useBatteryStatus } from '@/hooks/useBatteryStatus'
import { useGeolocationConsent } from '@/hooks/useGeolocationConsent'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useTrailPreparation } from '@/hooks/useTrailPreparation'
import { useWakeLock } from '@/hooks/useWakeLock'
import { queueActivityForSync } from '@/lib/activity-sync'
import { calculateMissionCompletions, calculatePointsEarned, createLocalId } from '@/lib/community'
import { createPreparationSummary } from '@/lib/hike-preparation'
import {
  clearActiveTrackingSession,
  getActiveTrackingSession,
  saveActiveTrackingSession,
} from '@/lib/local-db'
import { fetchTrails, positionToActivityPoint, saveTrackedActivity } from '@/lib/mvp-api'
import { isSupabaseConfigured } from '@/lib/supabase'
import {
  armCheckInReminder,
  buildTripPlan,
  buildTripPlanText,
  calculateOffRouteDistance,
  formatMeters,
  getCheckInReminderState,
  getNextCheckpoint,
  getOfflineTrailState,
  getTrailRoute,
  saveCheckInReminderState,
  saveTripPlan,
  shareOrCopyText,
  type CheckInReminderState,
  type OffRouteSensitivity,
} from '@/lib/trail-navigation'
import {
  calculateAveragePace,
  calculateDistanceKm,
  calculateElevationGainM,
  estimateCalories,
  formatDuration,
} from '@/lib/tracking'
import type {
  ActivityPhotoAttachment,
  ActivityPoint,
  ActivitySaveInput,
  ActivityVisibility,
  LocalTrackingSession,
  TrackingStatus,
} from '@/lib/types'
import type { Trail } from '@/lib/types'

type LocalSaveStatus = 'idle' | 'saving' | 'saved' | 'failed'

const STATIONARY_WINDOW_SECONDS = 90
const STATIONARY_DISTANCE_KM = 0.02
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function createClientActivityId() {
  if ('crypto' in window && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `activity-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function readPhotoAttachment(file: File): Promise<ActivityPhotoAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve({
        id: createLocalId('photo'),
        name: file.name,
        url: String(reader.result),
        isCover: false,
      })
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function TrackingPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const trailParam = searchParams.get('trail')
  const online = useNetworkStatus()
  const { consent, grantConsent, declineConsent } = useGeolocationConsent(user?.id)
  const watchIdRef = useRef<number | null>(null)

  const [trails, setTrails] = useState<Trail[]>([])
  const [trailLoading, setTrailLoading] = useState(Boolean(trailParam))
  const [trailError, setTrailError] = useState<string | null>(null)
  const [selectedTrailId, setSelectedTrailId] = useState<string | null>(null)
  const [showConsent, setShowConsent] = useState(false)
  const [status, setStatus] = useState<TrackingStatus>('idle')
  const [clientActivityId, setClientActivityId] = useState(() => createClientActivityId())
  const [points, setPoints] = useState<ActivityPoint[]>([])
  const [startedAt, setStartedAt] = useState<Date | null>(null)
  const [endedAt, setEndedAt] = useState<Date | null>(null)
  const [pausedMs, setPausedMs] = useState(0)
  const [pauseStartedAt, setPauseStartedAt] = useState<Date | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [restoreSession, setRestoreSession] = useState<LocalTrackingSession | null>(null)
  const [localSaveStatus, setLocalSaveStatus] = useState<LocalSaveStatus>('idle')
  const [autoPauseSuggested, setAutoPauseSuggested] = useState(false)
  const [sessionFinalized, setSessionFinalized] = useState(false)
  const [summaryCaption, setSummaryCaption] = useState('')
  const [summaryPhotos, setSummaryPhotos] = useState<ActivityPhotoAttachment[]>([])
  const [savingMode, setSavingMode] = useState<PostHikeSaveMode | null>(null)
  const [offRouteAlertsEnabled, setOffRouteAlertsEnabled] = useState(true)
  const [offRouteSensitivity, setOffRouteSensitivity] = useState<OffRouteSensitivity>('medium')
  const [checkInState, setCheckInState] = useState<CheckInReminderState | null>(null)
  const [showCheckInPrompt, setShowCheckInPrompt] = useState(false)

  const wakeLock = useWakeLock(status === 'tracking')
  const queue = useActivityQueue(user?.id, online)
  const battery = useBatteryStatus()

  const distanceKm = useMemo(() => calculateDistanceKm(points), [points])
  const elevationGainM = useMemo(() => Math.round(calculateElevationGainM(points)), [points])
  const calories = useMemo(() => estimateCalories(elapsedSeconds), [elapsedSeconds])
  const averagePace = useMemo(
    () => calculateAveragePace(elapsedSeconds, distanceKm),
    [distanceKm, elapsedSeconds],
  )
  const totalRecordedSeconds = useMemo(() => {
    if (!startedAt) {
      return elapsedSeconds
    }

    const endTime = endedAt?.getTime() ?? Date.now()
    return Math.max(0, Math.floor((endTime - startedAt.getTime()) / 1000))
  }, [elapsedSeconds, endedAt, startedAt])
  const latestPoint = points.at(-1) ?? null
  const pendingSyncCount = queue.pendingCount + queue.failedCount + queue.syncingCount
  const selectedTrail = useMemo(() => {
    return trails.find((trail) => trail.id === selectedTrailId) ?? null
  }, [selectedTrailId, trails])
  const selectedRoute = useMemo(() => {
    return selectedTrail ? getTrailRoute(selectedTrail) : null
  }, [selectedTrail])
  const selectedDatabaseTrailId = selectedTrailId && UUID_PATTERN.test(selectedTrailId) ? selectedTrailId : null
  const preparation = useTrailPreparation({ trail: selectedTrail, kidsMode: false })
  const offlineTrailState = selectedTrail ? getOfflineTrailState(selectedTrail.slug) : null
  const offRouteResult = useMemo(
    () => calculateOffRouteDistance(latestPoint, selectedRoute, offRouteSensitivity),
    [latestPoint, offRouteSensitivity, selectedRoute],
  )
  const nextCheckpoint = useMemo(
    () => getNextCheckpoint(latestPoint, selectedRoute),
    [latestPoint, selectedRoute],
  )
  const gpsAccuracy = latestPoint?.accuracy ?? null

  useEffect(() => {
    let mounted = true
    setTrailLoading(Boolean(trailParam))
    setTrailError(null)

    fetchTrails()
      .then((nextTrails) => {
        if (!mounted) {
          return
        }

        setTrails(nextTrails)
        if (trailParam) {
          const requestedTrail = nextTrails.find((trail) => trail.slug === trailParam || trail.id === trailParam)
          setSelectedTrailId(requestedTrail?.id ?? null)
          if (!requestedTrail) {
            setTrailError('Selected trail could not be found. You can still record a free hike.')
          }
        }
      })
      .catch((caught: unknown) => {
        if (mounted) {
          setTrailError(caught instanceof Error ? caught.message : 'Could not load selected trail.')
        }
      })
      .finally(() => {
        if (mounted) {
          setTrailLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [trailParam])

  useEffect(() => {
    getActiveTrackingSession()
      .then((session) => {
        if (session && session.points.length > 0) {
          setRestoreSession(session)
        }
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    setCheckInState(getCheckInReminderState())
  }, [])

  useEffect(() => {
    if (status !== 'tracking' || !startedAt) {
      return
    }

    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt.getTime() - pausedMs) / 1000)))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [pausedMs, startedAt, status])

  useEffect(() => {
    if (status !== 'tracking' || !checkInState || checkInState.status !== 'armed') {
      return
    }

    const checkDue = () => {
      if (Date.now() >= new Date(checkInState.dueAt).getTime()) {
        setShowCheckInPrompt(true)
      }
    }

    checkDue()
    const interval = window.setInterval(checkDue, 30_000)
    return () => window.clearInterval(interval)
  }, [checkInState, status])

  useEffect(() => {
    if (
      sessionFinalized ||
      !startedAt ||
      !['requesting', 'tracking', 'paused', 'stopped'].includes(status)
    ) {
      return
    }

    const localStatus: LocalTrackingSession['status'] =
      status === 'paused' || status === 'stopped' ? status : 'tracking'

    setLocalSaveStatus('saving')
    saveActiveTrackingSession({
      id: 'active',
      clientActivityId,
      userId: user?.id ?? null,
      status: localStatus,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt?.toISOString() ?? null,
      pausedMs,
      pauseStartedAt: pauseStartedAt?.toISOString() ?? null,
      points,
      trailId: selectedTrailId,
      elapsedSeconds,
      distanceKm: Number(distanceKm.toFixed(3)),
      calories,
      updatedAt: new Date().toISOString(),
    })
      .then(() => setLocalSaveStatus('saved'))
      .catch(() => setLocalSaveStatus('failed'))
  }, [
    calories,
    clientActivityId,
    distanceKm,
    elapsedSeconds,
    endedAt,
    pausedMs,
    pauseStartedAt,
    points,
    sessionFinalized,
    selectedTrailId,
    startedAt,
    status,
    user?.id,
  ])

  useEffect(() => {
    if (status !== 'tracking' || points.length < 2) {
      setAutoPauseSuggested(false)
      return
    }

    const latest = points.at(-1)
    if (!latest) {
      return
    }

    const latestTime = new Date(latest.recorded_at).getTime()
    const windowPoints = points.filter((point) => {
      return latestTime - new Date(point.recorded_at).getTime() <= STATIONARY_WINDOW_SECONDS * 1000
    })

    if (windowPoints.length < 2) {
      setAutoPauseSuggested(false)
      return
    }

    const windowAgeSeconds =
      (latestTime - new Date(windowPoints[0].recorded_at).getTime()) / 1000
    const windowDistanceKm = calculateDistanceKm(windowPoints)
    setAutoPauseSuggested(
      windowAgeSeconds >= STATIONARY_WINDOW_SECONDS && windowDistanceKm < STATIONARY_DISTANCE_KM,
    )
  }, [points, status])

  useEffect(() => {
    return () => stopWatching()
  }, [])

  useEffect(() => {
    if (wakeLock.warning) {
      toast.message('Wake Lock unavailable; tracking will continue normally.')
    }
  }, [wakeLock.warning])

  const reliability = useMemo(() => {
    if (!online) {
      return 'Offline mode — activity will sync later.'
    }
    if (status === 'tracking') {
      return 'GPS is active and route points are being saved locally.'
    }
    if (status === 'paused') {
      return 'Recording is paused. Resume before route points continue.'
    }
    if (status === 'stopped') {
      return 'Recording stopped. Save now or queue for sync if offline.'
    }
    if (status === 'error') {
      return errorMessage ?? 'GPS is unavailable.'
    }
    return 'GPS is idle. Consent is required before tracking starts.'
  }, [errorMessage, online, status])

  function stopWatching() {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }

  const startWatching = () => {
    if (!navigator.geolocation) {
      setStatus('error')
      setErrorMessage('This browser does not support geolocation.')
      toast.error('This browser does not support geolocation.')
      return
    }

    setStatus('requesting')
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setPoints((currentPoints) => [...currentPoints, positionToActivityPoint(position)])
        setStatus('tracking')
        setErrorMessage(null)
      },
      (error) => {
        stopWatching()
        setStatus('error')
        setErrorMessage(error.message)
        toast.error(error.message)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      },
    )
  }

  const beginNewTracking = () => {
    setClientActivityId(createClientActivityId())
    setPoints([])
    setStartedAt(new Date())
    setEndedAt(null)
    setPausedMs(0)
    setPauseStartedAt(null)
    setElapsedSeconds(0)
    setSavedMessage(null)
    setErrorMessage(null)
    setRestoreSession(null)
    setAutoPauseSuggested(false)
    setSessionFinalized(false)
    setSummaryCaption('')
    setSummaryPhotos([])
    setSavingMode(null)
    setShowCheckInPrompt(false)
    if (selectedTrail) {
      setCheckInState(armCheckInReminder(selectedTrail))
    }
    startWatching()
  }

  const startTracking = async () => {
    if (consent !== 'granted') {
      setShowConsent(true)
      return
    }

    beginNewTracking()
  }

  const pauseTracking = () => {
    stopWatching()
    setPauseStartedAt(new Date())
    setStatus('paused')
    toast.message('Tracking paused.')
  }

  const resumeTracking = () => {
    if (pauseStartedAt) {
      setPausedMs((current) => current + Date.now() - pauseStartedAt.getTime())
    }
    setPauseStartedAt(null)
    startWatching()
    toast.message('Tracking resumed.')
  }

  const stopTracking = () => {
    stopWatching()
    setEndedAt(new Date())
    setStatus('stopped')
    toast.message('Tracking stopped. Review and save your hike.')
  }

  const resetTracking = async () => {
    stopWatching()
    setStatus('idle')
    setClientActivityId(createClientActivityId())
    setPoints([])
    setStartedAt(null)
    setEndedAt(null)
    setPausedMs(0)
    setPauseStartedAt(null)
    setElapsedSeconds(0)
    setErrorMessage(null)
    setSavedMessage(null)
    setRestoreSession(null)
    setAutoPauseSuggested(false)
    setLocalSaveStatus('idle')
    setSessionFinalized(true)
    setSummaryCaption('')
    setSummaryPhotos([])
    setSavingMode(null)
    setShowCheckInPrompt(false)
    await clearActiveTrackingSession().catch(() => undefined)
  }

  const restorePreviousSession = () => {
    if (!restoreSession) {
      return
    }

    stopWatching()
    setClientActivityId(restoreSession.clientActivityId)
    setPoints(restoreSession.points)
    setStartedAt(new Date(restoreSession.startedAt))
    setEndedAt(restoreSession.endedAt ? new Date(restoreSession.endedAt) : null)
    setPausedMs(restoreSession.pausedMs)
    setPauseStartedAt(
      restoreSession.pauseStartedAt ? new Date(restoreSession.pauseStartedAt) : new Date(),
    )
    setElapsedSeconds(restoreSession.elapsedSeconds)
    setStatus(restoreSession.status === 'tracking' ? 'paused' : restoreSession.status)
    setSelectedTrailId(restoreSession.trailId)
    setRestoreSession(null)
    setSessionFinalized(false)
    setSavingMode(null)
    setCheckInState(getCheckInReminderState())
    toast.success('Tracking session restored. Resume when ready.')
  }

  const discardPreviousSession = async () => {
    await clearActiveTrackingSession()
    setRestoreSession(null)
    setSessionFinalized(true)
    toast.message('Previous tracking session discarded.')
  }

  const acceptConsent = async () => {
    try {
      await grantConsent()
      setShowConsent(false)
      beginNewTracking()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save consent.')
    }
  }

  const rejectConsent = async () => {
    try {
      await declineConsent()
      setShowConsent(false)
      toast.message('GPS tracking will stay off until you allow it.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save consent.')
    }
  }

  const shareTripPlan = async () => {
    if (!selectedTrail) {
      toast.error('Select a trail before sharing a trip plan.')
      return
    }

    try {
      const tripPlan = buildTripPlan(selectedTrail)
      saveTripPlan(tripPlan)
      const outcome = await shareOrCopyText(buildTripPlanText(tripPlan))
      toast.success(outcome === 'shared' ? 'Trip plan shared.' : 'Trip plan copied.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not share trip plan.')
    }
  }

  const markSafe = () => {
    if (!checkInState) {
      return
    }

    const nextState = { ...checkInState, status: 'safe' as const }
    saveCheckInReminderState(nextState)
    setCheckInState(nextState)
    setShowCheckInPrompt(false)
    toast.success("Glad you're safe.")
  }

  const continueTrackingAfterCheckIn = () => {
    if (!selectedTrail) {
      setShowCheckInPrompt(false)
      return
    }

    const nextState = armCheckInReminder({
      ...selectedTrail,
      estimated_time_minutes: 30,
    })
    setCheckInState(nextState)
    setShowCheckInPrompt(false)
    toast.message('Check-in reminder extended.')
  }

  const finishFromCheckIn = () => {
    if (checkInState) {
      const nextState = { ...checkInState, status: 'finished' as const }
      saveCheckInReminderState(nextState)
      setCheckInState(nextState)
    }
    setShowCheckInPrompt(false)
    stopTracking()
  }

  const buildActivityPayload = ({
    caption = summaryCaption,
    photos = summaryPhotos,
    shareToFeed = false,
    visibility = 'private',
  }: {
    caption?: string
    photos?: ActivityPhotoAttachment[]
    shareToFeed?: boolean
    visibility?: ActivityVisibility
  } = {}): ActivitySaveInput | null => {
    if (!startedAt || points.length === 0) {
      return null
    }

    const saveEndedAt = endedAt ?? new Date()
    const preparationSummary = preparation.plan ? createPreparationSummary(preparation.plan) : null
    const basePayload: ActivitySaveInput = {
      userId: user?.id ?? 'local-demo-user',
      clientActivityId,
      title: selectedTrail
        ? `${selectedTrail.name} hike`
        : `Hike on ${saveEndedAt.toLocaleDateString()}`,
      trailName: selectedTrail?.name ?? null,
      trailSlug: selectedTrail?.slug ?? null,
      difficulty: selectedTrail?.difficulty ?? null,
      trailId: selectedDatabaseTrailId,
      visibility,
      shareToFeed,
      caption: caption.trim() || null,
      photos,
      preparationSummary,
      points,
      distanceKm: Number(distanceKm.toFixed(3)),
      durationSeconds: elapsedSeconds,
      elevationGainM,
      calories,
      averagePace,
      startedAt: startedAt.toISOString(),
      endedAt: saveEndedAt.toISOString(),
    }

    const missionCompletions = calculateMissionCompletions(basePayload, photos.length)
    return {
      ...basePayload,
      missionCompletions,
      pointsEarned: calculatePointsEarned(basePayload, photos.length, missionCompletions),
    }
  }

  const queueCurrentActivity = async (payload: ActivitySaveInput, error: string | null) => {
    await queueActivityForSync(payload, error)
    await queue.refresh()
    setSessionFinalized(true)
    await clearActiveTrackingSession().catch(() => undefined)
    setSavedMessage('Activity queued offline and will sync when you are back online.')
    toast.success('Activity queued for sync.')
  }

  const saveActivity = async (mode: PostHikeSaveMode) => {
    if (!user && isSupabaseConfigured) {
      toast.error('Sign in before saving a tracked hike.')
      return
    }

    const payload = buildActivityPayload({
      shareToFeed: mode === 'feed',
      visibility: mode === 'feed' ? 'public' : 'private',
    })
    if (!payload) {
      toast.error('Record at least one GPS point before saving.')
      return
    }

    if (!online && isSupabaseConfigured) {
      await queueCurrentActivity(payload, 'Saved while offline.')
      return
    }

    setSavingMode(mode)
    setStatus('saving')
    try {
      const activity = await saveTrackedActivity(payload)
      setSessionFinalized(true)
      await clearActiveTrackingSession()
      await queue.refresh()
      setSavedMessage(
        mode === 'feed'
          ? `${activity.title} shared to the public feed with +${payload.pointsEarned ?? 0} points.`
          : `${activity.title} saved privately with +${payload.pointsEarned ?? 0} points.`,
      )
      setStatus('stopped')
      toast.success(mode === 'feed' ? 'Activity shared to feed.' : 'Activity saved privately.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Activity save failed.'
      await queueCurrentActivity(payload, message)
      setStatus('stopped')
    } finally {
      setSavingMode(null)
    }
  }

  const addSummaryPhotos = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return
    }

    Promise.all(Array.from(files).slice(0, 6).map(readPhotoAttachment))
      .then((attachments) => {
        setSummaryPhotos((current) => {
          const nextPhotos = [...current, ...attachments].slice(0, 6)
          const hasCover = nextPhotos.some((photo) => photo.isCover)
          return nextPhotos.map((photo, index) => ({
            ...photo,
            isCover: hasCover ? photo.isCover : index === 0,
          }))
        })
        toast.success('Photos attached to hike summary.')
      })
      .catch(() => toast.error('Could not read one of the selected photos.'))
  }

  const removeSummaryPhoto = (photoId: string) => {
    setSummaryPhotos((current) => {
      const remaining = current.filter((photo) => photo.id !== photoId)
      if (remaining.some((photo) => photo.isCover)) {
        return remaining
      }
      return remaining.map((photo, index) => ({ ...photo, isCover: index === 0 }))
    })
  }

  const setSummaryCoverPhoto = (photoId: string) => {
    setSummaryPhotos((current) =>
      current.map((photo) => ({ ...photo, isCover: photo.id === photoId })),
    )
  }

  const draftSummaryPayload =
    status === 'stopped'
      ? buildActivityPayload({
          shareToFeed: true,
          visibility: 'public',
        })
      : null

  return (
    <main className="wa-page">
      <PageHeader
        description="Record GPS hikes with local recovery, trail handoff, offline queueing, Wake Lock support, and sync-on-reconnect."
        eyebrow="Recorder"
        title={selectedTrail ? `Track ${selectedTrail.name}` : 'GPS activity tracking'}
      />

      {trailLoading ? <LoadingState label="Loading selected trail..." /> : null}
      {trailError ? <ErrorState message={trailError} /> : null}

      <TrackingCockpitCard
        averagePace={averagePace}
        calories={calories}
        distanceKm={distanceKm}
        elapsedSeconds={elapsedSeconds}
        onStart={() => {
          startTracking().catch(() => undefined)
        }}
        online={online}
        selectedTrail={selectedTrail}
        status={status}
      />

      {selectedTrail ? (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <CardTitle>Selected trail</CardTitle>
                <CardDescription>{selectedTrail.region}</CardDescription>
              </div>
              <Badge variant="secondary">{selectedTrail.difficulty}</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">{selectedTrail.description}</p>
            <TrailMetricGrid trail={selectedTrail} />
            <div className="rounded-lg border bg-background p-3 text-sm">
              <p className="font-medium">Offline trail status</p>
              <p className="mt-1 text-muted-foreground">
                {offlineTrailState?.snapshot
                  ? `${offlineTrailState.label}. Trail route and key info are stored locally.`
                  : 'Not downloaded. Download from trail details before hiking with weak signal.'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline">
                <Link to={`/trails/${selectedTrail.slug}`}>Details</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={`/map?trail=${selectedTrail.slug}`}>
                  <MapIcon data-icon="inline-start" />
                  Map
                </Link>
              </Button>
              <Button asChild className="col-span-2" variant="outline">
                <Link to="/safety">Open safety screen</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {selectedTrail ? (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <CardTitle>Navigation map</CardTitle>
                <CardDescription>
                  Planned route, checkpoints, and recorded route overlay for this hike.
                </CardDescription>
              </div>
              <Badge variant="secondary">planned route</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <RoutePreviewMap className="h-64" points={points} trail={selectedTrail} />
            {nextCheckpoint ? (
              <div className="rounded-lg border bg-background p-3 text-sm">
                <p className="font-medium">
                  Next checkpoint: {nextCheckpoint.waypoint.name} — {formatMeters(nextCheckpoint.distanceMeters)} ahead
                </p>
                <p className="mt-1 text-muted-foreground">{nextCheckpoint.waypoint.notes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {preparation.plan && (status === 'idle' || status === 'error') ? (
        <BeforeStartPreparationCard
          disabled={false}
          onShareTripPlan={() => {
            shareTripPlan().catch(() => undefined)
          }}
          onStart={() => {
            startTracking().catch(() => undefined)
          }}
          plan={preparation.plan}
        />
      ) : null}

      {restoreSession ? (
        <Card>
          <CardHeader>
            <CardTitle>Restore previous session?</CardTitle>
            <CardDescription>
              {restoreSession.points.length} route points were saved locally from{' '}
              {new Date(restoreSession.startedAt).toLocaleString()}.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Button onClick={restorePreviousSession}>Restore</Button>
            <Button onClick={discardPreviousSession} variant="outline">
              Discard
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <CardTitle>Tracking status</CardTitle>
              <CardDescription>{reliability}</CardDescription>
            </div>
            <Badge variant={status === 'error' ? 'destructive' : 'secondary'}>{status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <TrackingReliabilityPanel
            autoPauseSuggested={autoPauseSuggested}
            batteryLow={battery.low}
            gpsAccuracy={gpsAccuracy}
            localSaveStatus={localSaveStatus}
            offRouteActive={Boolean(offRouteAlertsEnabled && offRouteResult?.offRoute)}
            online={online}
            pendingSyncCount={pendingSyncCount}
            queueSyncing={queue.syncing}
            status={status}
            wakeLockState={wakeLock.state}
          />

          <div className="rounded-lg border bg-background p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Off-route alerts</span>
              <Button
                onClick={() => setOffRouteAlertsEnabled((enabled) => !enabled)}
                size="sm"
                variant={offRouteAlertsEnabled ? 'secondary' : 'outline'}
              >
                {offRouteAlertsEnabled ? 'On' : 'Off'}
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((sensitivity) => (
                <Button
                  key={sensitivity}
                  onClick={() => setOffRouteSensitivity(sensitivity)}
                  size="sm"
                  variant={offRouteSensitivity === sensitivity ? 'default' : 'outline'}
                >
                  {sensitivity}
                </Button>
              ))}
            </div>
          </div>

          {offRouteAlertsEnabled && offRouteResult?.offRoute ? (
            <div className="flex flex-col gap-2 rounded-lg border bg-background p-3 text-sm text-muted-foreground">
              <span className="flex items-start gap-2">
                <Navigation aria-hidden="true" />
                You may be off route. You are about {formatMeters(offRouteResult.distanceMeters)} from
                the planned trail.
              </span>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label="Distance" value={`${distanceKm.toFixed(2)} km`} />
            <MetricCard label="Duration" value={formatDuration(elapsedSeconds)} />
            <MetricCard label="Calories" value={`${calories}`} />
            <MetricCard label="Points" value={`${points.length}`} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Elevation" value={`${elevationGainM} m`} />
            <MetricCard label="Pace" value={averagePace ? `${averagePace.toFixed(1)} min/km` : '-'} />
          </div>

          {latestPoint ? (
            <div className="rounded-lg border bg-background p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin aria-hidden="true" />
                Current coordinates
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {latestPoint.latitude.toFixed(6)}, {latestPoint.longitude.toFixed(6)}
              </p>
            </div>
          ) : (
            <EmptyState
              description="Start tracking to collect your first route point."
              title="No route points yet"
            />
          )}

          {autoPauseSuggested ? (
            <div className="flex flex-col gap-2 rounded-lg border bg-background p-3 text-sm text-muted-foreground">
              <span className="flex items-start gap-2">
                <AlertTriangle aria-hidden="true" />
                You appear stationary. Consider pausing to keep pace and duration cleaner.
              </span>
              <Button disabled={status !== 'tracking'} onClick={pauseTracking} size="sm" variant="outline">
                Pause tracking
              </Button>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="flex items-start gap-2 rounded-lg border bg-background p-3 text-sm text-muted-foreground">
              <AlertTriangle aria-hidden="true" />
              {errorMessage}
            </div>
          ) : null}

          {savedMessage ? (
            <div className="flex items-start gap-2 rounded-lg border bg-background p-3 text-sm text-muted-foreground">
              <ShieldCheck aria-hidden="true" />
              {savedMessage}
            </div>
          ) : null}

          {status === 'tracking' && checkInState?.status === 'armed' ? (
            <div className="flex flex-col gap-3 rounded-lg border bg-background p-3 text-sm">
              <div className="flex items-start gap-2">
                <Bell aria-hidden="true" />
                <div className="flex flex-col gap-1">
                  <span className="font-medium">Local check-in reminder</span>
                  <span className="text-muted-foreground">
                    Reminder armed for {new Date(checkInState.dueAt).toLocaleTimeString()}.
                  </span>
                </div>
              </div>
              <Button onClick={() => setShowCheckInPrompt(true)} size="sm" variant="outline">
                Check in now
              </Button>
            </div>
          ) : null}

          {showCheckInPrompt ? (
            <div className="flex flex-col gap-3 rounded-lg border bg-background p-3 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <Bell aria-hidden="true" />
                Are you okay?
              </p>
              <p className="text-muted-foreground">
                This is only a local reminder, not an emergency monitoring service.
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Button onClick={markSafe} size="sm">
                  I'm safe
                </Button>
                <Button onClick={continueTrackingAfterCheckIn} size="sm" variant="outline">
                  Continue
                </Button>
                <Button onClick={finishFromCheckIn} size="sm" variant="outline">
                  Finish
                </Button>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <Button disabled={status === 'requesting' || status === 'tracking'} onClick={startTracking}>
              <Play data-icon="inline-start" />
              Start
            </Button>
            <Button disabled={status !== 'tracking'} onClick={pauseTracking} variant="outline">
              <Pause data-icon="inline-start" />
              Pause
            </Button>
            <Button disabled={status !== 'paused'} onClick={resumeTracking} variant="outline">
              <Play data-icon="inline-start" />
              Resume
            </Button>
            <Button
              disabled={!['tracking', 'paused', 'requesting'].includes(status)}
              onClick={stopTracking}
              variant="outline"
            >
              <Square data-icon="inline-start" />
              Stop
            </Button>
            <Button
              disabled={status !== 'stopped' || points.length === 0 || savingMode !== null}
              onClick={() => saveActivity('private').catch(() => undefined)}
            >
              {status === 'saving' ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <Save data-icon="inline-start" />
              )}
              Save
            </Button>
            <Button onClick={() => resetTracking().catch(() => undefined)} variant="outline">
              <RotateCcw data-icon="inline-start" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {status === 'stopped' && points.length > 0 ? (
        <PostHikeSummaryCard
          calories={calories}
          caption={summaryCaption}
          distanceKm={distanceKm}
          estimatedCalories={draftSummaryPayload?.preparationSummary?.estimatedCalories ?? null}
          missionCompletions={draftSummaryPayload?.missionCompletions ?? []}
          movingSeconds={elapsedSeconds}
          onAddPhotos={addSummaryPhotos}
          onCaptionChange={setSummaryCaption}
          onRemovePhoto={removeSummaryPhoto}
          onSavePrivate={() => saveActivity('private').catch(() => undefined)}
          onSetCover={setSummaryCoverPhoto}
          onShareToFeed={() => saveActivity('feed').catch(() => undefined)}
          photos={summaryPhotos}
          points={points}
          pointsEarned={draftSummaryPayload?.pointsEarned ?? 0}
          preparationSummary={draftSummaryPayload?.preparationSummary ?? null}
          savedMessage={savedMessage}
          savingMode={savingMode}
          totalSeconds={totalRecordedSeconds}
          trail={selectedTrail}
        />
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <ShieldCheck aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <CardTitle>Reliability note</CardTitle>
              <CardDescription>
                This Sprint 2 layer keeps route points local, queues finished activities offline,
                and attempts sync when the network returns. True background GPS still depends on
                platform capabilities.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Account controls live in <Link to="/settings">Settings</Link>.
        </CardContent>
      </Card>

      <GeolocationConsentDialog
        onAccept={acceptConsent}
        onDecline={rejectConsent}
        open={showConsent}
      />
    </main>
  )
}

function TrackingCockpitCard({
  averagePace,
  calories,
  distanceKm,
  elapsedSeconds,
  onStart,
  online,
  selectedTrail,
  status,
}: {
  averagePace: number | null
  calories: number
  distanceKm: number
  elapsedSeconds: number
  onStart: () => void
  online: boolean
  selectedTrail: Trail | null
  status: TrackingStatus
}) {
  const active = status === 'tracking'
  const paused = status === 'paused'
  const paceLabel = averagePace ? `${averagePace.toFixed(1)} min/km` : '-'

  return (
    <section className="overflow-hidden rounded-[1.6rem] bg-primary text-primary-foreground shadow-lift">
      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_0.9fr] sm:items-end">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-card text-foreground" variant="outline">
              <Activity aria-hidden="true" />
              {active ? 'recording live' : paused ? 'paused effort' : 'ready to record'}
            </Badge>
            <Badge className={online ? 'bg-success text-success-foreground' : undefined} variant={online ? 'secondary' : 'destructive'}>
              {online ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}
              {online ? 'online' : 'offline sync'}
            </Badge>
          </div>
          <div>
            <h2 className="text-4xl font-bold leading-[1.02] tracking-normal">
              {selectedTrail ? selectedTrail.name : 'Live hike cockpit'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-primary-foreground/78">
              Big stats, route awareness, safety actions, and local recovery in one outdoor-friendly recorder.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <CockpitMetric icon={Route} label="Distance" value={`${distanceKm.toFixed(2)} km`} />
            <CockpitMetric icon={Timer} label="Time" value={formatDuration(elapsedSeconds)} />
            <CockpitMetric icon={Flame} label="Calories" value={`${calories}`} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              className="bg-card text-foreground hover:bg-card/90"
              disabled={status === 'requesting' || status === 'tracking'}
              onClick={onStart}
            >
              <Play data-icon="inline-start" />
              Start hike
            </Button>
            <Button
              asChild
              className="border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              variant="outline"
            >
              <Link to={selectedTrail ? `/map?trail=${selectedTrail.slug}` : '/map'}>
                <MapIcon data-icon="inline-start" />
                Map
              </Link>
            </Button>
          </div>
        </div>
        <div className="relative min-h-56 overflow-hidden rounded-[1.4rem] border border-primary-foreground/15 bg-primary-foreground/10 p-4">
          <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(90deg,hsl(var(--primary-foreground)/0.22)_1px,transparent_1px),linear-gradient(180deg,hsl(var(--primary-foreground)/0.22)_1px,transparent_1px)] [background-size:34px_34px]" />
          <div className="absolute left-8 top-11 h-32 w-56 rotate-[-20deg] rounded-full border-[5px] border-primary-foreground/80" />
          <div className="absolute left-16 top-24 h-20 w-40 rotate-[18deg] rounded-full border-[5px] border-gold" />
          <span className="absolute left-10 top-12 size-4 rounded-full bg-primary-foreground ring-4 ring-primary/50" />
          <span className="absolute bottom-12 right-12 size-4 rounded-full bg-gold ring-4 ring-primary/50" />
          <div className="relative flex h-full min-h-48 flex-col justify-between">
            <div className="flex justify-end">
              <Badge className="bg-card text-foreground" variant="outline">
                {paceLabel}
              </Badge>
            </div>
            <div className="rounded-2xl bg-card/95 p-3 text-foreground shadow-soft">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Route focus</p>
              <p className="mt-1 text-sm font-bold">
                {selectedTrail ? `${selectedTrail.distance_km} km planned trail` : 'Free hike mode'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CockpitMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Route
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl bg-card/10 px-3 py-3 ring-1 ring-primary-foreground/10">
      <Icon className="mb-2 size-4 text-gold" aria-hidden="true" />
      <p className="text-[11px] font-semibold uppercase text-primary-foreground/70">{label}</p>
      <p className="mt-1 text-base font-bold text-primary-foreground">{value}</p>
    </div>
  )
}

function TrackingReliabilityPanel({
  autoPauseSuggested,
  batteryLow,
  gpsAccuracy,
  localSaveStatus,
  offRouteActive,
  online,
  pendingSyncCount,
  queueSyncing,
  status,
  wakeLockState,
}: {
  autoPauseSuggested: boolean
  batteryLow: boolean
  gpsAccuracy: number | null
  localSaveStatus: LocalSaveStatus
  offRouteActive: boolean
  online: boolean
  pendingSyncCount: number
  queueSyncing: boolean
  status: TrackingStatus
  wakeLockState: string
}) {
  const gpsStatus = status === 'tracking' ? 'active' : status === 'error' ? 'error' : 'standby'
  const weakGps = typeof gpsAccuracy === 'number' && gpsAccuracy > 50
  const warnings = [
    !online ? 'Offline network status' : null,
    batteryLow ? 'Low battery reminder' : null,
    weakGps ? `Weak GPS accuracy: ${Math.round(gpsAccuracy)} m` : null,
    wakeLockState === 'unsupported' || wakeLockState === 'failed' ? 'Wake Lock unavailable' : null,
    pendingSyncCount > 0 ? `${pendingSyncCount} unsynced activit${pendingSyncCount === 1 ? 'y' : 'ies'}` : null,
    offRouteActive ? 'Off-route alert active' : null,
  ].filter((warning): warning is string => Boolean(warning))

  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-medium">Tracking reliability</span>
        <Badge variant={online ? 'secondary' : 'destructive'}>
          {online ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}
          {online ? 'online' : 'offline'}
        </Badge>
      </div>
      {!online ? (
        <p className="mb-3 text-sm text-muted-foreground">
          Offline mode — activity will sync later.
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <ReliabilityMetric label="GPS" value={gpsStatus} />
        <ReliabilityMetric label="Local save" value={localSaveStatus} />
        <ReliabilityMetric label="Pending sync" value={`${pendingSyncCount}`} />
        <ReliabilityMetric label="Wake Lock" value={wakeLockState} />
        <ReliabilityMetric label="Queue" value={queueSyncing ? 'syncing' : 'ready'} />
        <ReliabilityMetric label="Auto-pause" value={autoPauseSuggested ? 'suggested' : 'watching'} />
      </div>
      {warnings.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2">
          {warnings.map((warning) => (
            <div className="flex items-start gap-2 rounded-md border bg-card px-3 py-2 text-sm text-muted-foreground" key={warning}>
              {warning.includes('battery') ? <BatteryWarning aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
              {warning}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ReliabilityMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  )
}
