import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Download,
  ExternalLink,
  Loader2,
  LogOut,
  MailCheck,
  ShieldAlert,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import { AuthPanel } from '@/components/auth/AuthPanel'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { downloadJson, exportUserDataFromClient, type ExportedUserData } from '@/lib/user-data'
import { supabase } from '@/lib/supabase'

export function SettingsPage() {
  const navigate = useNavigate()
  const { user, configured } = useAuth()
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const emailVerified = Boolean(user?.email_confirmed_at)

  const resendVerification = async () => {
    if (!user?.email) {
      toast.error('No email is attached to this account.')
      return
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/settings`,
      },
    })

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Verification email sent.')
  }

  const exportData = async () => {
    setExporting(true)
    try {
      let exportPayload: ExportedUserData | null = null

      const { data, error } = await supabase.functions.invoke<ExportedUserData>('account-export')
      if (!error && data) {
        exportPayload = data
      } else {
        exportPayload = await exportUserDataFromClient()
      }

      downloadJson(`wild-alberta-export-${new Date().toISOString().slice(0, 10)}.json`, exportPayload)
      toast.success('User data export downloaded.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not export user data.')
    } finally {
      setExporting(false)
    }
  }

  const deleteAccount = async () => {
    setDeleting(true)
    try {
      const { error } = await supabase.functions.invoke('delete-account', {
        body: {
          requestedAt: new Date().toISOString(),
        },
      })

      if (error) {
        const { error: requestError } = await supabase.from('deletion_requests').insert({
          user_id: user?.id,
          status: 'pending_admin_review',
          requested_email: user?.email ?? null,
          metadata: {
            edgeFunctionError: error.message,
          },
        })

        if (requestError) {
          throw requestError
        }

        await supabase.auth.signOut()
        toast.success('Deletion request saved for admin review.')
      } else {
        await supabase.auth.signOut()
        toast.success('Account deletion completed.')
      }

      navigate('/login', { replace: true })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete account.')
    } finally {
      setDeleting(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    toast.message('Signed out.')
    navigate('/login')
  }

  if (!user) {
    return (
      <main className="wa-page">
        <section className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">Settings</p>
          <h1 className="text-3xl font-bold tracking-normal">Sign in to manage account safety</h1>
          <p className="text-sm text-muted-foreground">
            Export, verification, and deletion controls require an authenticated session.
          </p>
        </section>
        <AuthPanel />
        <Card>
          <CardHeader>
            <CardTitle>Legal and privacy</CardTitle>
            <CardDescription>Review launch policies before creating an account.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <LegalLink label="Privacy Policy" to="/privacy" />
            <Separator />
            <LegalLink label="Terms of Service" to="/terms" />
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="wa-page">
      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted-foreground">Settings</p>
        <h1 className="text-3xl font-bold tracking-normal">Account safety</h1>
        <p className="text-sm text-muted-foreground">
          Manage verification, privacy links, export, and account deletion from one mobile-first
          screen.
        </p>
      </section>

      {!configured ? (
        <Card>
          <CardHeader>
            <CardTitle>Supabase configuration required</CardTitle>
            <CardDescription>
              Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable live account actions.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">Email verification</span>
              <span className="text-sm text-muted-foreground">
                {emailVerified ? 'Verified and ready for launch.' : 'Verification is still pending.'}
              </span>
            </div>
            <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
              {emailVerified ? 'verified' : 'pending'}
            </span>
          </div>
          {!emailVerified ? (
            <Button onClick={resendVerification} variant="outline">
              <MailCheck data-icon="inline-start" />
              Resend verification email
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Legal and privacy</CardTitle>
          <CardDescription>Launch links for Canada/EU readiness.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <LegalLink label="Privacy Policy" to="/privacy" />
          <Separator />
          <LegalLink label="Terms of Service" to="/terms" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data controls</CardTitle>
          <CardDescription>
            Export user-owned data as JSON or request deletion with confirmation.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button disabled={exporting} onClick={exportData}>
            {exporting ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Download data-icon="inline-start" />}
            {exporting ? 'Exporting...' : 'Export my data'}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={deleting} variant="destructive">
                <Trash2 data-icon="inline-start" />
                Delete account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your Wild Alberta account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes user-owned application data first and then deletes the auth account
                  when the Supabase Edge Function is configured. If admin deletion is unavailable,
                  a deletion request is saved for follow-up.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction disabled={deleting} onClick={deleteAccount}>
                  {deleting ? 'Deleting...' : 'Yes, delete my account'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex items-start gap-2 rounded-lg border bg-background p-3 text-sm text-muted-foreground">
            <ShieldAlert aria-hidden="true" />
            Deletion is permanent. Export your data first if you need a personal copy.
          </div>
        </CardContent>
      </Card>

      <Button onClick={signOut} variant="outline">
        <LogOut data-icon="inline-start" />
        Sign out
      </Button>
    </main>
  )
}

function LegalLink({ label, to }: { label: string; to: string }) {
  return (
    <Link
      className="flex items-center justify-between rounded-md py-2 text-sm font-medium no-underline hover:text-primary"
      to={to}
    >
      {label}
      <ExternalLink aria-hidden="true" />
    </Link>
  )
}
