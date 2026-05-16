import { useEffect, useMemo, useState } from 'react'

import { useHikePreparationState } from '@/hooks/useHikePreparationState'
import { buildHikePreparationPlan } from '@/lib/hike-preparation'
import type { HikePreparationPlan } from '@/lib/hike-preparation'
import type { Trail } from '@/lib/types'
import { mockWeatherProvider, type TrailWeather } from '@/lib/weather'

export function useTrailPreparation({
  trail,
  kidsMode,
}: {
  trail: Trail | null
  kidsMode: boolean
}) {
  const preparationState = useHikePreparationState(trail?.slug)
  const [weather, setWeather] = useState<TrailWeather | null>(null)
  const [loading, setLoading] = useState(Boolean(trail))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    if (!trail) {
      setWeather(null)
      setLoading(false)
      return undefined
    }

    setLoading(true)
    setError(null)
    mockWeatherProvider
      .getTrailWeather(trail)
      .then((nextWeather) => {
        if (mounted) {
          setWeather(nextWeather)
        }
      })
      .catch((caught: unknown) => {
        if (mounted) {
          setError(caught instanceof Error ? caught.message : 'Could not load hike preparation.')
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
  }, [trail])

  const plan = useMemo<HikePreparationPlan | null>(() => {
    if (!trail || !weather) {
      return null
    }

    return buildHikePreparationPlan({
      trail,
      weather,
      checklistState: preparationState.checklist,
      acknowledgements: preparationState.acknowledgements,
      kidsMode,
    })
  }, [kidsMode, preparationState.acknowledgements, preparationState.checklist, trail, weather])

  return {
    ...preparationState,
    loading,
    error,
    weather,
    plan,
  }
}
