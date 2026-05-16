import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

type CallbackState = 'loading' | 'success' | 'error'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [state, setState] = useState<CallbackState>('loading')
  const [message, setMessage] = useState('Completing secure sign in...')

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          throw error
        }
        if (!data.session) {
          setState('error')
          setMessage('No session was found. Try signing in again.')
          return
        }

        setState('success')
        setMessage('Your account is ready.')
        const next = searchParams.get('next') ?? '/settings'
        window.setTimeout(() => navigate(next, { replace: true }), 900)
      })
      .catch((error: unknown) => {
        setState('error')
        setMessage(error instanceof Error ? error.message : 'Unable to complete sign in.')
      })
  }, [navigate, searchParams])

  const Icon = state === 'loading' ? Loader2 : state === 'success' ? CheckCircle2 : XCircle

  return (
    <main className="wa-page">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Icon aria-hidden="true" className={state === 'loading' ? 'animate-spin' : ''} />
            <CardTitle>Authentication</CardTitle>
          </div>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          {state === 'error' ? (
            <Button asChild>
              <Link to="/login">Return to sign in</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </main>
  )
}
