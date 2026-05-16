import { useState, type FormEvent } from 'react'
import { LogIn, Mail } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

type AuthMode = 'signin' | 'signup'

export function AuthPanel() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEmailAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!isSupabaseConfigured) {
      toast.error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast.success('Welcome back.')
        navigate('/settings')
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/settings`,
          },
        })
        if (error) throw error
        toast.success('Check your inbox to verify your email.')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    if (!isSupabaseConfigured) {
      toast.error('Supabase is not configured yet.')
      return
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
      },
    })

    if (error) {
      toast.error(error.message)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'signin' ? 'Sign in' : 'Create account'}</CardTitle>
        <CardDescription>
          Use email or Google to unlock account safety, data export, and deletion controls.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleEmailAuth}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              autoComplete="email"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              id="password"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>
          <Button disabled={loading} type="submit">
            <Mail data-icon="inline-start" />
            {loading ? 'Working...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
        </form>
        <div className="mt-4 flex flex-col gap-3">
          <Button onClick={handleGoogleAuth} variant="outline">
            <LogIn data-icon="inline-start" />
            Continue with Google
          </Button>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <button
              className="text-primary underline-offset-4 hover:underline"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              type="button"
            >
              {mode === 'signin' ? 'Need an account?' : 'Already have an account?'}
            </button>
            <Link to="/reset-password">Reset password</Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
