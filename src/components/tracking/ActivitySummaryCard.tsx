import { useEffect, useState } from 'react'
import { Share2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { formatDuration } from '@/lib/tracking'
import type { Activity } from '@/lib/types'

interface ActivitySummaryCardProps {
  activity: Activity
  onShare?: () => void
}

type StreamObject = Record<string, unknown>

function isStreamObject(value: unknown): value is StreamObject {
  return typeof value === 'object' && value !== null
}

function readString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function extractStreamingText(payload: string) {
  if (!payload || payload === '[DONE]') {
    return ''
  }

  try {
    const parsed: unknown = JSON.parse(payload)

    if (typeof parsed === 'string') {
      return parsed
    }
    if (!isStreamObject(parsed)) {
      return ''
    }

    const delta = parsed.delta
    if (isStreamObject(delta)) {
      const deltaText = readString(delta.text) || readString(delta.content)
      if (deltaText) {
        return deltaText
      }
    }

    const contentBlock = parsed.content_block
    if (isStreamObject(contentBlock)) {
      const blockText = readString(contentBlock.text)
      if (blockText) {
        return blockText
      }
    }

    const choices = parsed.choices
    if (Array.isArray(choices) && isStreamObject(choices[0])) {
      const choiceDelta = choices[0].delta
      if (isStreamObject(choiceDelta)) {
        const choiceText = readString(choiceDelta.content)
        if (choiceText) {
          return choiceText
        }
      }
    }

    return readString(parsed.content) || readString(parsed.text)
  } catch {
    return payload
  }
}

function extractTextFromSseLine(line: string) {
  const trimmedLine = line.trim()

  if (!trimmedLine || trimmedLine.startsWith(':')) {
    return ''
  }
  if (trimmedLine.startsWith('data:')) {
    return extractStreamingText(trimmedLine.slice(5).trim())
  }
  if (
    trimmedLine.startsWith('event:') ||
    trimmedLine.startsWith('id:') ||
    trimmedLine.startsWith('retry:')
  ) {
    return ''
  }

  return trimmedLine
}

function formatActivityDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable'
  }

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function getErrorName(error: unknown) {
  return error instanceof Error ? error.name : ''
}

export function ActivitySummaryCard({ activity, onShare }: ActivitySummaryCardProps) {
  const { user } = useAuth()
  const [aiSummary, setAiSummary] = useState('')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    const appendStreamingText = (text: string) => {
      if (!text || cancelled) {
        return
      }

      setLoading(false)
      for (const character of text) {
        if (cancelled) {
          return
        }
        setAiSummary((current) => current + character)
      }
    }

    async function loadSummary() {
      setAiSummary('')
      setErrorMessage(null)
      setLoading(true)

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (!supabaseUrl) {
        if (!cancelled) {
          setErrorMessage('AI summary is unavailable until Supabase is configured.')
          setLoading(false)
        }
        return
      }

      const supabaseKey =
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY
      const headers: Record<string, string> = {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
      }

      if (supabaseKey) {
        headers.apikey = supabaseKey
        headers.Authorization = `Bearer ${supabaseKey}`
      }

      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/ai-assistant`, {
          body: JSON.stringify({
            intent: 'summary',
            message: JSON.stringify({
              title: activity.title,
              distanceKm: activity.distance_km,
              durationSeconds: activity.duration_seconds,
              elevationGainM: activity.elevation_gain_m,
            }),
            userId: user?.id,
          }),
          headers,
          method: 'POST',
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Could not load AI summary.')
        }
        if (!response.body) {
          throw new Error('AI summary stream is unavailable.')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              break
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split(/\r?\n/)
            buffer = lines.pop() ?? ''

            for (const line of lines) {
              appendStreamingText(extractTextFromSseLine(line))
            }
          }

          buffer += decoder.decode()
          if (buffer) {
            appendStreamingText(extractTextFromSseLine(buffer))
          }
        } finally {
          reader.releaseLock()
        }

        if (!cancelled) {
          setLoading(false)
        }
      } catch (error) {
        if (cancelled || getErrorName(error) === 'AbortError') {
          return
        }

        setErrorMessage(error instanceof Error ? error.message : 'Could not load AI summary.')
        setLoading(false)
      }
    }

    void loadSummary()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [
    activity.distance_km,
    activity.duration_seconds,
    activity.elevation_gain_m,
    activity.id,
    activity.title,
    user?.id,
  ])

  const shareSummary = async () => {
    if (!aiSummary.trim()) {
      toast.message('AI summary is still loading.')
      return
    }

    try {
      if (navigator.share) {
        await navigator.share({ title: activity.title, text: aiSummary })
        toast.success('Activity summary shared.')
      } else {
        await navigator.clipboard.writeText(aiSummary)
        toast.success('Activity summary copied.')
      }
      onShare?.()
    } catch (error) {
      if (getErrorName(error) === 'AbortError') {
        return
      }

      try {
        await navigator.clipboard.writeText(aiSummary)
        toast.success('Activity summary copied.')
        onShare?.()
      } catch {
        toast.error('Could not share this activity summary.')
      }
    }
  }

  const summaryText =
    aiSummary ||
    (loading
      ? 'Claude is reading your hike stats and preparing a concise trail recap...'
      : errorMessage ?? 'AI summary is not available yet.')

  return (
    <section
      aria-labelledby={`activity-summary-${activity.id}`}
      className="wa-section flex flex-col gap-4"
      style={{ borderTop: '3px solid hsl(var(--primary))' }}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-bold" id={`activity-summary-${activity.id}`}>
            🏔️ {activity.title}
          </h2>
          <p className="text-sm text-muted-foreground">{formatActivityDate(activity.started_at)}</p>
        </div>
        <Button disabled={!aiSummary.trim()} onClick={shareSummary} size="sm" variant="outline">
          <Share2 data-icon="inline-start" />
          Share
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <SummaryStat label="Distance" value={`${activity.distance_km.toFixed(2)} km`} />
        <SummaryStat label="Duration" value={formatDuration(activity.duration_seconds)} />
        <SummaryStat label="Elevation" value={`${Math.round(activity.elevation_gain_m)} m`} />
      </div>

      <div className="flex flex-col gap-2 rounded-xl border bg-background/75 p-4">
        <h3 className="text-sm font-semibold">AI Summary</h3>
        <p
          aria-busy={loading}
          aria-live="polite"
          className="min-h-16 whitespace-pre-wrap text-sm leading-6 text-muted-foreground"
        >
          {summaryText}
        </p>
      </div>
    </section>
  )
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background/75 p-3 text-center">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-bold">{value}</p>
    </div>
  )
}
