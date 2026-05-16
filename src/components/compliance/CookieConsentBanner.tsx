import { useState } from 'react'
import { Cookie } from 'lucide-react'

import { Button } from '@/components/ui/button'

const COOKIE_CONSENT_KEY = 'wild-alberta-cookie-consent-v1'

type CookieChoice = 'accepted' | 'declined'

export function CookieConsentBanner() {
  const [choice, setChoice] = useState<CookieChoice | null>(() => {
    return window.localStorage.getItem(COOKIE_CONSENT_KEY) as CookieChoice | null
  })

  const saveChoice = (nextChoice: CookieChoice) => {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, nextChoice)
    setChoice(nextChoice)
  }

  if (choice) {
    return null
  }

  return (
    <section
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-xl rounded-lg border bg-card p-4 text-card-foreground shadow-soft"
    >
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            <Cookie aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold">Cookie preferences</h2>
            <p className="text-sm text-muted-foreground">
              Wild Alberta uses local storage for essential preferences like this consent choice.
              Analytics cookies stay off unless you accept them.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="w-full" onClick={() => saveChoice('accepted')}>
            Accept
          </Button>
          <Button className="w-full" onClick={() => saveChoice('declined')} variant="outline">
            Decline
          </Button>
        </div>
      </div>
    </section>
  )
}
