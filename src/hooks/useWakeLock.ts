import { useEffect, useRef, useState } from 'react'

type WakeLockState = 'unsupported' | 'released' | 'active' | 'failed'

interface NavigatorWithWakeLock {
  wakeLock?: {
    request: (..._args: ['screen']) => Promise<WakeLockSentinel>
  }
}

export function useWakeLock(active: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null)
  const [state, setState] = useState<WakeLockState>(() => {
    return 'wakeLock' in navigator ? 'released' : 'unsupported'
  })
  const [warning, setWarning] = useState<string | null>(null)

  useEffect(() => {
    const wakeNavigator = navigator as NavigatorWithWakeLock

    if (!wakeNavigator.wakeLock) {
      setState('unsupported')
      return
    }

    let cancelled = false

    const releaseWakeLock = async () => {
      if (sentinelRef.current && !sentinelRef.current.released) {
        await sentinelRef.current.release()
      }
      sentinelRef.current = null
      if (!cancelled) {
        setState('released')
      }
    }

    const requestWakeLock = async () => {
      try {
        const sentinel = await wakeNavigator.wakeLock?.request('screen')
        if (!sentinel || cancelled) {
          return
        }
        sentinelRef.current = sentinel
        setState('active')
        setWarning(null)
        sentinel.addEventListener('release', () => {
          if (!cancelled) {
            setState('released')
          }
        })
      } catch (error) {
        if (!cancelled) {
          setState('failed')
          setWarning(error instanceof Error ? error.message : 'Wake Lock could not be enabled.')
        }
      }
    }

    if (active) {
      requestWakeLock()
    } else {
      releaseWakeLock()
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && active && !sentinelRef.current) {
        requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (sentinelRef.current && !sentinelRef.current.released) {
        sentinelRef.current.release().catch(() => undefined)
      }
      sentinelRef.current = null
    }
  }, [active])

  return { state, warning }
}
