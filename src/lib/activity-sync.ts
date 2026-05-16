import { toast } from 'sonner'

import {
  createQueuedActivity,
  enqueueActivity,
  listQueuedActivities,
  updateQueuedActivity,
} from '@/lib/local-db'
import { registerActivityBackgroundSync } from '@/lib/pwa'
import { isSupabaseConfigured } from '@/lib/supabase'
import type { ActivitySaveInput } from '@/lib/types'
import { saveTrackedActivity } from '@/lib/mvp-api'

export async function queueActivityForSync(payload: ActivitySaveInput, error: string | null) {
  const queuedActivity = createQueuedActivity(payload, error)
  await enqueueActivity(queuedActivity)

  try {
    await registerActivityBackgroundSync()
  } catch {
    // The online listener fallback handles unsupported or denied Background Sync.
  }

  return queuedActivity
}

export async function syncPendingActivities(userId: string | undefined) {
  if (!userId || !navigator.onLine || !isSupabaseConfigured) {
    return { attempted: 0, synced: 0, failed: 0 }
  }

  const candidates = await listQueuedActivities(['pending', 'failed'])
  const ownedCandidates = candidates.filter((activity) => activity.user_id === userId)
  let synced = 0
  let failed = 0

  for (const queued of ownedCandidates) {
    await updateQueuedActivity(queued.client_activity_id, {
      status: 'syncing',
      attempt_count: queued.attempt_count + 1,
      last_error: null,
    })

    try {
      await saveTrackedActivity(queued.payload)
      await updateQueuedActivity(queued.client_activity_id, {
        status: 'synced',
        last_error: null,
        synced_at: new Date().toISOString(),
      })
      synced += 1
    } catch (error) {
      failed += 1
      await updateQueuedActivity(queued.client_activity_id, {
        status: 'failed',
        last_error: error instanceof Error ? error.message : 'Sync failed.',
      })
    }
  }

  if (synced > 0) {
    toast.success(`${synced} offline activit${synced === 1 ? 'y' : 'ies'} synced.`)
  }
  if (failed > 0) {
    toast.error(`${failed} offline activit${failed === 1 ? 'y' : 'ies'} still need sync.`)
  }

  return { attempted: ownedCandidates.length, synced, failed }
}
