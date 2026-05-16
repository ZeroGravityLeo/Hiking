import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Binoculars,
  ChevronDown,
  Compass,
  Heart,
  MapPin,
  Navigation,
  Play,
  Search,
  ShieldCheck,
  Star,
  User,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-state'
import { useAuth } from '@/hooks/useAuth'
import { fetchProfileStats, fetchTrails, type ProfileStats } from '@/lib/mvp-api'
import type { Trail } from '@/lib/types'

const heroImage =
  'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=2200&q=85'

const trailImages = [
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80',
] as const

const highlightCards = [
  {
    title: 'Record your activities',
    body: 'Live GPS, route recovery, route previews, and post-hike summaries keep every adventure easy to relive.',
    icon: Navigation,
    to: '/tracking',
  },
  {
    title: 'Prepare before you go',
    body: 'Readiness scores, weather-aware gear, water, snacks, and safety notes stay close to every trail.',
    icon: ShieldCheck,
    to: '/explore',
  },
  {
    title: 'Collect wild moments',
    body: 'Wildlife discovery, missions, points, and community sharing turn hikes into progress.',
    icon: Binoculars,
    to: '/wildlife',
  },
] as const

export function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [trails, setTrails] = useState<Trail[]>([])
  const [query, setQuery] = useState('')
  const [statsLoading, setStatsLoading] = useState(Boolean(user))
  const [trailsLoading, setTrailsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setStatsLoading(Boolean(user))
    setError(null)

    fetchProfileStats(user)
      .then((nextStats) => {
        if (mounted) {
          setStats(nextStats)
        }
      })
      .catch((caught: unknown) => {
        if (mounted) {
          setError(caught instanceof Error ? caught.message : 'Could not load dashboard stats.')
        }
      })
      .finally(() => {
        if (mounted) {
          setStatsLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [user])

  useEffect(() => {
    let mounted = true
    setTrailsLoading(true)

    fetchTrails()
      .then((nextTrails) => {
        if (mounted) {
          setTrails(nextTrails)
        }
      })
      .catch((caught: unknown) => {
        if (mounted) {
          setError(caught instanceof Error ? caught.message : 'Could not load trail favorites.')
        }
      })
      .finally(() => {
        if (mounted) {
          setTrailsLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  const favoriteTrails = useMemo(() => trails.slice(0, 4), [trails])

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigate(query.trim() ? `/explore?search=${encodeURIComponent(query.trim())}` : '/explore')
  }

  return (
    <main className="min-h-screen bg-background pb-28 md:pb-0">
      <section className="relative flex min-h-[690px] overflow-hidden bg-foreground text-primary-foreground md:min-h-[760px]">
        <img
          alt="Hikers moving through an alpine trail"
          className="absolute inset-0 size-full object-cover object-[center_42%]"
          src={heroImage}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/45 via-foreground/25 to-foreground/58" />
        <div className="absolute inset-x-0 top-0 z-10">
          <HomeHeroNav signedIn={Boolean(user)} />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-6 px-5 py-24 text-center">
          <h1 className="max-w-4xl text-5xl font-bold leading-[1.02] tracking-normal md:text-7xl">
            Find your next Alberta adventure
          </h1>
          <form
            className="flex w-full max-w-3xl items-center gap-3 rounded-full bg-card px-5 py-3 text-foreground shadow-lift"
            onSubmit={onSearch}
          >
            <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              aria-label="Search by city, park, or trail name"
              className="min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:text-muted-foreground md:text-lg"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by city, park, or trail name"
              value={query}
            />
            <Button className="hidden rounded-full md:inline-flex" type="submit">
              Search
            </Button>
          </form>
          <Link
            className="text-base font-bold text-primary-foreground underline decoration-primary-foreground/70 underline-offset-4 hover:text-primary-foreground/85"
            to="/explore"
          >
            Explore nearby trails
          </Link>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-12 md:px-8">
        {error ? <ErrorState message={error} /> : null}
        {statsLoading || trailsLoading ? <LoadingState label="Loading local trail picks..." /> : null}

        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-4xl font-bold leading-tight tracking-normal">Local favorites near Calgary</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Curated Alberta trail picks with quick stats for planning the next day outside.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/explore">
              View all trails
              <Compass data-icon="inline-end" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {favoriteTrails.map((trail, index) => (
            <FavoriteTrailCard imageUrl={trailImages[index % trailImages.length]} key={trail.id} trail={trail} />
          ))}
        </div>
      </section>

      <section className="bg-muted/70">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 md:grid-cols-[0.85fr_1fr] md:items-center md:px-8 md:py-24">
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-sm font-bold uppercase text-muted-foreground">Live tracking</p>
              <h2 className="mt-2 text-5xl font-bold leading-[1.05] tracking-normal md:text-6xl">
                Record your activities
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
                Never miss a turn with live trail tracking. Save your route, review the effort, share photos,
                and keep every hike connected to missions, points, and readiness.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <HomeStat label="Distance" value={`${(stats?.totalDistanceKm ?? 0).toFixed(1)} km`} />
              <HomeStat label="Hikes" value={`${stats?.completedHikes ?? 0}`} />
              <HomeStat label="Level" value={`${stats?.profile?.level ?? 1}`} />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link to="/tracking">
                  <Play data-icon="inline-start" />
                  Start recording
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/map">
                  <MapPin data-icon="inline-start" />
                  Open map
                </Link>
              </Button>
            </div>
          </div>

          <PhoneActivityMock />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-5 py-14 md:grid-cols-3 md:px-8">
        {highlightCards.map(({ title, body, icon: Icon, to }) => (
          <Link
            className="group flex min-h-56 flex-col justify-between rounded-[1.5rem] border bg-card p-6 text-card-foreground no-underline shadow-soft transition hover:-translate-y-1 hover:bg-secondary hover:text-secondary-foreground"
            key={title}
            to={to}
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-background text-primary group-hover:bg-card">
              <Icon className="size-6" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-2xl font-bold">{title}</span>
              <span className="mt-3 block text-sm leading-6 text-muted-foreground group-hover:text-secondary-foreground/80">
                {body}
              </span>
            </span>
          </Link>
        ))}
      </section>

      {!user ? (
        <section className="mx-auto w-full max-w-7xl px-5 pb-16 md:px-8">
          <div className="grid gap-5 rounded-[1.75rem] border bg-card p-6 shadow-soft md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm font-bold uppercase text-muted-foreground">Account</p>
              <h2 className="mt-2 text-4xl font-bold leading-tight">Save every route and reward</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Sign in to save GPS activities, publish feed posts, export routes, and build your Wild Alberta points.
              </p>
            </div>
            <Button asChild>
              <Link to="/login">
                <User data-icon="inline-start" />
                Log in
              </Link>
            </Button>
          </div>
        </section>
      ) : null}
    </main>
  )
}

function HomeHeroNav({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 md:px-8">
      <Link className="flex items-center gap-2 text-primary-foreground no-underline" to="/home">
        <span className="flex size-10 items-center justify-center rounded-2xl border border-primary-foreground/35 bg-primary-foreground/10 text-sm font-black backdrop-blur">
          WA
        </span>
        <span className="text-2xl font-black tracking-normal">Wild Alberta</span>
      </Link>
      <nav className="hidden items-center gap-8 text-sm font-bold md:flex">
        <Link className="flex items-center gap-1 text-primary-foreground no-underline hover:text-primary-foreground/80" to="/explore">
          Explore
          <ChevronDown className="size-4" aria-hidden="true" />
        </Link>
        <Link className="flex items-center gap-1 text-primary-foreground no-underline hover:text-primary-foreground/80" to="/profile">
          Saved
          <ChevronDown className="size-4" aria-hidden="true" />
        </Link>
        <Link className="flex items-center gap-1 text-primary-foreground no-underline hover:text-primary-foreground/80" to="/missions">
          Missions
          <ChevronDown className="size-4" aria-hidden="true" />
        </Link>
        <Button asChild className="rounded-full border-primary-foreground/60 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" variant="outline">
          <Link to={signedIn ? '/profile' : '/login'}>{signedIn ? 'Profile' : 'Log in'}</Link>
        </Button>
      </nav>
    </header>
  )
}

function FavoriteTrailCard({ trail, imageUrl }: { trail: Trail; imageUrl: string }) {
  const rating = trail.difficulty === 'easy' ? '4.8' : trail.difficulty === 'moderate' ? '4.6' : '4.4'
  const estimatedHours = trail.estimated_time_minutes >= 90
    ? `${(trail.estimated_time_minutes / 60).toFixed(1)} hr`
    : `${trail.estimated_time_minutes} min`

  return (
    <article className="group">
      <div className="relative overflow-hidden rounded-[1.25rem] bg-muted shadow-soft">
        <Link to={`/trails/${trail.slug}`}>
          <img
            alt={`${trail.name} trail`}
            className="aspect-[1.2] w-full object-cover transition duration-500 group-hover:scale-105"
            src={imageUrl}
          />
        </Link>
        <button
          aria-label={`Save ${trail.name}`}
          className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full bg-card text-foreground shadow-soft transition hover:scale-105"
          onClick={() => toast.message('Saved trails are coming soon.')}
          type="button"
        >
          <Heart className="size-5" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-3 flex flex-col gap-1">
        <Link className="text-lg font-bold text-foreground no-underline hover:underline" to={`/trails/${trail.slug}`}>
          {trail.name}
        </Link>
        <p className="text-sm text-muted-foreground">{trail.region}</p>
        <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <Star className="size-4 fill-muted-foreground text-muted-foreground" aria-hidden="true" />
          <span>{rating}</span>
          <span>•</span>
          <DifficultyDot difficulty={trail.difficulty} />
          <span className="capitalize">{trail.difficulty}</span>
          <span>•</span>
          <span>{trail.distance_km} km</span>
          <span>•</span>
          <span>Est. {estimatedHours}</span>
        </div>
      </div>
    </article>
  )
}

function DifficultyDot({ difficulty }: { difficulty: Trail['difficulty'] }) {
  const colorClass =
    difficulty === 'easy' ? 'bg-success' : difficulty === 'moderate' ? 'bg-warning' : 'bg-destructive'

  return <span className={`size-2 rounded-full ${colorClass}`} />
}

function HomeStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-soft">
      <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  )
}

function PhoneActivityMock() {
  return (
    <div className="mx-auto w-full max-w-[390px] md:max-w-[440px]">
      <div className="rounded-[2rem] bg-foreground p-2 shadow-lift">
        <div className="overflow-hidden rounded-[1.55rem] bg-card">
          <div className="relative h-[560px] bg-secondary/25">
            <img
              alt="Satellite style trail terrain"
              className="absolute inset-0 size-full object-cover opacity-80"
              src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80"
            />
            <div className="absolute inset-0 bg-primary/20" />
            <button
              aria-label="Close activity preview"
              className="absolute left-5 top-5 flex size-9 items-center justify-center rounded-full bg-card text-foreground shadow-soft"
              type="button"
            >
              ×
            </button>
            <div className="absolute bottom-0 left-0 right-0 rounded-t-[1.5rem] bg-card p-5 shadow-lift">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">Live recap</p>
                  <h3 className="text-2xl font-bold">Johnston Canyon</h3>
                </div>
                <span className="rounded-full bg-success px-3 py-1 text-xs font-bold text-success-foreground">
                  GPS
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <PhoneMetric label="Km" value="2.4" />
                <PhoneMetric label="Time" value="54m" />
                <PhoneMetric label="Ready" value="86%" />
              </div>
              <Button asChild className="mt-4 w-full">
                <Link to="/tracking?trail=johnston-canyon-lower-falls">
                  <Play data-icon="inline-start" />
                  Start this hike
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PhoneMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-background/75 p-3 text-center">
      <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  )
}
