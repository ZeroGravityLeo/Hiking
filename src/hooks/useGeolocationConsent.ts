import { useCallback, useState } from 'react'

import { supabase } from '@/lib/supabase'

const GEOLOCATION_CONSENT_KEY = 'wild-alberta-geolocation-consent-v1'

export type GeolocationConsent = 'granted' | 'declined' | null

export function useGeolocationConsent(userId: string | undefined) {
  const [consent, setConsent] = useState<GeolocationConsent>(() => {
    return window.localStorage.getItem(GEOLOCATION_CONSENT_KEY) as GeolocationConsent
  })

  const saveConsent = useCallback(
    async (nextConsent: Exclude<GeolocationConsent, null>) => {
      window.localStorage.setItem(GEOLOCATION_CONSENT_KEY, nextConsent)
      setConsent(nextConsent)

      if (userId) {
        await supabase.from('consent_logs').insert({
          user_id: userId,
          consent_type: 'geolocation_tracking',
          status: nextConsent,
          metadata: {
            userAgent: navigator.userAgent,
          },
        })
      }
    },
    [userId],
  )

  return {
    consent,
    grantConsent: () => saveConsent('granted'),
    declineConsent: () => saveConsent('declined'),
    resetConsent: () => {
      window.localStorage.removeItem(GEOLOCATION_CONSENT_KEY)
      setConsent(null)
    },
  }
}
