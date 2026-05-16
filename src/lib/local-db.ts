import type { LocalTrackingSession, QueueStatus, QueuedActivity } from '@/lib/types'

const DB_NAME = 'wild-alberta-reliability'
const DB_VERSION = 1
const ACTIVE_SESSION_STORE = 'active_tracking_session'
const ACTIVITY_QUEUE_STORE = 'activity_queue'
const ACTIVE_SESSION_KEY = 'active'

type StoreName = typeof ACTIVE_SESSION_STORE | typeof ACTIVITY_QUEUE_STORE
type TransactionMode = 'readonly' | 'readwrite'

function openDatabase(): Promise<IDBDatabase> {
  if (!('indexedDB' in window)) {
    return Promise.reject(new Error('IndexedDB is not available in this browser.'))
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains(ACTIVE_SESSION_STORE)) {
        db.createObjectStore(ACTIVE_SESSION_STORE, { keyPath: 'id' })
      }

      if (!db.objectStoreNames.contains(ACTIVITY_QUEUE_STORE)) {
        const queueStore = db.createObjectStore(ACTIVITY_QUEUE_STORE, {
          keyPath: 'client_activity_id',
        })
        queueStore.createIndex('status', 'status', { unique: false })
        queueStore.createIndex('updated_at', 'updated_at', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open IndexedDB.'))
  })
}

async function transaction<T>(
  storeName: StoreName,
  mode: TransactionMode,
  action: (..._args: [IDBObjectStore]) => IDBRequest<T> | void,
): Promise<T | undefined> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode)
    const store = tx.objectStore(storeName)
    const request = action(store)
    let result: T | undefined

    if (request) {
      request.onsuccess = () => {
        result = request.result
      }
      request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'))
    }

    tx.oncomplete = () => {
      db.close()
      resolve(result)
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error ?? new Error('IndexedDB transaction failed.'))
    }
  })
}

export async function saveActiveTrackingSession(session: LocalTrackingSession) {
  await transaction(ACTIVE_SESSION_STORE, 'readwrite', (store) => store.put(session))
}

export async function getActiveTrackingSession() {
  const session = await transaction<LocalTrackingSession>(
    ACTIVE_SESSION_STORE,
    'readonly',
    (store) => store.get(ACTIVE_SESSION_KEY),
  )

  return session ?? null
}

export async function clearActiveTrackingSession() {
  await transaction(ACTIVE_SESSION_STORE, 'readwrite', (store) => store.delete(ACTIVE_SESSION_KEY))
}

export async function enqueueActivity(activity: QueuedActivity) {
  await transaction(ACTIVITY_QUEUE_STORE, 'readwrite', (store) => store.put(activity))
}

export async function listQueuedActivities(statuses?: QueueStatus[]) {
  const db = await openDatabase()

  return new Promise<QueuedActivity[]>((resolve, reject) => {
    const tx = db.transaction(ACTIVITY_QUEUE_STORE, 'readonly')
    const store = tx.objectStore(ACTIVITY_QUEUE_STORE)
    const request = store.getAll()

    request.onsuccess = () => {
      const activities = (request.result as QueuedActivity[]).filter((activity) => {
        return statuses ? statuses.includes(activity.status) : true
      })
      resolve(activities)
    }
    request.onerror = () => reject(request.error ?? new Error('Could not read queued activities.'))
    tx.oncomplete = () => db.close()
    tx.onerror = () => {
      db.close()
      reject(tx.error ?? new Error('Could not read queued activities.'))
    }
  })
}

export async function updateQueuedActivity(
  clientActivityId: string,
  update: Partial<QueuedActivity>,
) {
  const existing = await getQueuedActivity(clientActivityId)
  if (!existing) {
    return
  }

  await enqueueActivity({
    ...existing,
    ...update,
    updated_at: new Date().toISOString(),
  })
}

export async function getQueuedActivity(clientActivityId: string) {
  const activity = await transaction<QueuedActivity>(
    ACTIVITY_QUEUE_STORE,
    'readonly',
    (store) => store.get(clientActivityId),
  )

  return activity ?? null
}

export async function getPendingQueueCount() {
  const pending = await listQueuedActivities(['pending', 'syncing', 'failed'])
  return pending.filter((activity) => activity.status !== 'synced').length
}

export function createQueuedActivity(payload: QueuedActivity['payload'], error: string | null) {
  const now = new Date().toISOString()

  return {
    client_activity_id: payload.clientActivityId,
    user_id: payload.userId,
    payload,
    status: 'pending',
    attempt_count: 0,
    last_error: error,
    created_at: now,
    updated_at: now,
    synced_at: null,
  } satisfies QueuedActivity
}
