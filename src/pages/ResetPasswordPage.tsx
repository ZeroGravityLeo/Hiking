import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound, Mail } from 'lucide-react'
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
import { useAuth } from '@/hooks/useAuth'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export function ResetPasswordPage() {
  const { session } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const requestReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isSupabaseConfigured) {
      toast.error('Supabase is not configured yet.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      toast.success('Password reset email sent.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send reset email.')
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Password updated.')
      setPassword('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="wa-page">
      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">Recovery</p>
        <h1 className="text-3xl font-bold tracking-normal">Reset password</h1>
        <p className="text-sm text-muted-foreground">
          Request a secure email link, then set a new password after Supabase verifies the token.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{session ? 'Set a new password' : 'Request reset email'}</CardTitle>
          <CardDescription>
            {session
              ? 'You are signed in through a recovery link.'
              : 'Enter the email attached to your Wild Alberta account.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {session ? (
            <form className="flex flex-col gap-4" onSubmit={updatePassword}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  autoComplete="new-password"
                  id="new-password"
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </div>
              <Button disabled={loading} type="submit">
                <KeyRound data-icon="inline-start" />
                {loading ? 'Updating...' : 'Update password'}
              </Button>
            </form>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={requestReset}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  autoComplete="email"
                  id="reset-email"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </div>
              <Button disabled={loading} type="submit">
                <Mail data-icon="inline-start" />
                {loading ? 'Sending...' : 'Send reset email'}
              </Button>
            </form>
          )}
          <Link className="mt-4 inline-block text-sm" to="/login">
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
