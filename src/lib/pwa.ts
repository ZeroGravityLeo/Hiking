const SYNC_TAG = 'wild-alberta-sync-activities'

interface SyncRegistration {
  register: (..._args: [string]) => Promise<void>
}

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync?: SyncRegistration
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) {
    return false
  }

  await navigator.serviceWorker.register('/sw.js')
  return true
}

export async function registerActivityBackgroundSync() {
  if (!('serviceWorker' in navigator)) {
    return false
  }

  const registration = (await navigator.serviceWorker.ready) as ServiceWorkerRegistrationWithSync

  if (!registration.sync) {
    return false
  }

  await registration.sync.register(SYNC_TAG)
  return true
}

export function listenForServiceWorkerSync(callback: () => void) {
  if (!('serviceWorker' in navigator)) {
    return () => undefined
  }

  const listener = (event: MessageEvent) => {
    if (event.data?.type === 'WILD_ALBERTA_SYNC_QUEUED_ACTIVITIES') {
      callback()
    }
  }

  navigator.serviceWorker.addEventListener('message', listener)

  return () => navigator.serviceWorker.removeEventListener('message', listener)
}
