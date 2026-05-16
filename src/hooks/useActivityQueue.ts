import { useCallback, useEffect, useState } from 'react'

import { syncPendingActivities } from '@/lib/activity-sync'
import { getPendingQueueCount, listQueuedActivities } from '@/lib/local-db'
import { listenForServiceWorkerSync } from '@/lib/pwa'
import type { QueueStatus } from '@/lib/types'

interface QueueSummary {
  pendingCount: number
  syncingCount: number
  failedCount: number
  syncedCount: number
}

const EMPTY_SUMMARY: QueueSummary = {
  pendingCount: 0,
  syncingCount: 0,
  failedCount: 0,
  syncedCount: 0,
}

export function useActivityQueue(userId: string | undefined, online: boolean) {
  const [summary, setSummary] = useState<QueueSummary>(EMPTY_SUMMARY)
  const [syncing, setSyncing] = useState(false)
  const [lastSyncMessage, setLastSyncMessage] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const queued = await listQueuedActivities()
    const counts = queued.reduce<Record<QueueStatus, number>>(
      (acc, activity) => {
        acc[activity.status] += 1
        return acc
      },
      { pending: 0, syncing: 0, synced: 0, failed: 0 },
    )

    setSummary({
      pendingCount: counts.pending,
      syncingCount: counts.syncing,
      failedCount: counts.failed,
      syncedCount: counts.synced,
    })
  }, [])

  const syncNow = useCallback(async () => {
    if (!userId || !online) {
      await refresh()
      return
    }

    setSyncing(true)
    try {
      const result = await syncPendingActivities(userId)
      setLastSyncMessage(
        result.attempted > 0
          ? `${result.synced} synced, ${result.failed} failed`
          : 'No pending activities',
      )
    } finally {
      setSyncing(false)
      await refresh()
    }
  }, [online, refresh, userId])

  useEffect(() => {
    refresh().catch(() => undefined)
  }, [refresh])

  useEffect(() => {
    if (online) {
      syncNow().catch(() => undefined)
    }
  }, [online, syncNow])

  useEffect(() => {
    return listenForServiceWorkerSync(() => {
      syncNow().catch(() => undefined)
    })
  }, [syncNow])

  return {
    ...summary,
    syncing,
    lastSyncMessage,
    refresh,
    syncNow,
    getPendingQueueCount,
  }
}
