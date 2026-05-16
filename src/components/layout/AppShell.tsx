import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Binoculars,
  Compass,
  FileText,
  FolderInput,
  Flag,
  Home,
  Loader2,
  Map,
  MapPin,
  MessageSquare,
  Settings,
  User,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useActivityQueue } from '@/hooks/useActivityQueue'
import { useAuth } from '@/hooks/useAuth'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { usePwaInstall } from '@/hooks/usePwaInstall'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/map', label: 'Map', icon: Map },
  { to: '/tracking', label: 'Track', icon: MapPin },
  { to: '/missions', label: 'Missions', icon: Flag },
  { to: '/wildlife', label: 'Wildlife', icon: Binoculars },
  { to: '/feed', label: 'Feed', icon: MessageSquare },
  { to: '/import-export', label: 'Files', icon: FolderInput },
  { to: '/profile', label: 'Profile', icon: User },
] as const

export function AppShell() {
  const online = useNetworkStatus()
  const { user } = useAuth()
  const location = useLocation()
  const { canInstall, install } = usePwaInstall()
  const { pendingCount, failedCount, syncing, syncNow } = useActivityQueue(user?.id, online)
  const visibleQueueCount = pendingCount + failedCount
  const isHomeRoute = location.pathname === '/' || location.pathname === '/home'

  const handleInstall = async () => {
    const outcome = await install()
    if (outcome === 'accepted') {
      toast.success('Wild Alberta install started.')
    } else if (outcome === 'dismissed') {
      toast.message('Install dismissed.')
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {!isHomeRoute ? (
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-full max-w-3xl items-center justify-between px-4">
          <Link className="flex items-center gap-2 no-underline" to="/home">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-soft">
              WA
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-foreground">Wild Alberta</span>
              <span className="text-xs text-muted-foreground">Explore, track, collect</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-muted-foreground no-underline hover:bg-secondary hover:text-secondary-foreground"
              to="/settings"
            >
              <Settings aria-hidden="true" className="size-3.5" />
              Settings
            </Link>
            <Link
              className="hidden items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-muted-foreground no-underline hover:bg-secondary hover:text-secondary-foreground sm:inline-flex"
              to="/terms"
            >
              <FileText aria-hidden="true" className="size-3.5" />
              Terms
            </Link>
          </div>
        </div>
      </header>
      ) : null}

      {!isHomeRoute ? (
      <section className="border-b bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-2 overflow-x-auto px-4 py-2 text-xs text-muted-foreground">
          <Badge variant={online ? 'secondary' : 'destructive'}>
            {online ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}
            {online ? 'Online' : 'Offline mode'}
          </Badge>
          {!online ? <span className="shrink-0">Activity will sync later.</span> : null}
          {visibleQueueCount > 0 ? (
            <Button
              className="h-7 shrink-0 px-2 text-xs"
              disabled={syncing || !online || !user}
              onClick={() => syncNow().catch(() => toast.error('Sync failed.'))}
              size="sm"
              variant="outline"
            >
              {syncing ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
              {visibleQueueCount} pending sync
            </Button>
          ) : null}
          {canInstall ? (
            <Button className="h-7 shrink-0 px-2 text-xs" onClick={handleInstall} size="sm" variant="outline">
              Install
            </Button>
          ) : null}
        </div>
      </section>
      ) : null}

      <Outlet />

      <nav className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 shadow-lift backdrop-blur-xl',
        isHomeRoute ? 'md:hidden' : '',
      )}>
        <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-2 py-2.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  'flex min-w-16 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs font-semibold no-underline transition',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-soft'
                    : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground',
                )
              }
              key={to}
              to={to}
            >
              <Icon aria-hidden="true" className="size-5" />
              <span className="leading-none">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
