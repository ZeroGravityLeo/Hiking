import { Navigate } from 'react-router-dom'

import { AuthPanel } from '@/components/auth/AuthPanel'
import { useAuth } from '@/hooks/useAuth'

export function LoginPage() {
  const { user } = useAuth()

  if (user) {
    return <Navigate replace to="/settings" />
  }

  return (
    <main className="wa-page">
      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">Account safety</p>
        <h1 className="text-3xl font-bold tracking-normal">Secure your Wild Alberta profile</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to manage email verification, export your data, and control account deletion.
        </p>
      </section>
      <AuthPanel />
    </main>
  )
}
