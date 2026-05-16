import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import {
  Activity,
  AlertTriangle,
  Award,
  Backpack,
  BadgePercent,
  Bell,
  Binoculars,
  Camera,
  CheckCircle2,
  ChevronRight,
  CloudSun,
  Droplets,
  Flame,
  Gift,
  Heart,
  Home,
  Map,
  MapPin,
  Mountain,
  Navigation,
  Play,
  Route,
  Search,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Sun,
  Timer,
  Trophy,
  User,
  Utensils,
  Zap,
} from 'lucide-react'

import { MetricCard } from '@/components/common/MetricCard'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

const heroImage =
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80'
const forestImage =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'
const lakeImage =
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80'

const tokenSwatches = [
  { name: 'Deep Forest', value: '#234B36', className: 'bg-primary text-primary-foreground' },
  { name: 'Sage Moss', value: '#6B8F71', className: 'bg-secondary text-secondary-foreground' },
  { name: 'Warm Sand', value: '#DCC9A3', className: 'bg-accent text-accent-foreground' },
  { name: 'Off White', value: '#F7F8F5', className: 'bg-background text-foreground' },
  { name: 'Charcoal', value: '#1E1E1E', className: 'bg-foreground text-background' },
  { name: 'Soft Gold', value: '#D4AF37', className: 'bg-gold text-gold-foreground' },
] as const

const trailCards = [
  {
    name: 'Johnston Canyon',
    meta: 'Banff National Park',
    difficulty: 'Easy',
    distance: '2.4 km',
    time: '55 min',
    image: heroImage,
  },
  {
    name: 'Grassi Lakes',
    meta: 'Canmore',
    difficulty: 'Moderate',
    distance: '4.0 km',
    time: '1h 45m',
    image: lakeImage,
  },
] as const

const missions = [
  { title: 'Sunrise Starter', reward: '+120 XP', progress: 68, icon: Sun },
  { title: 'Wildlife Watch', reward: '+80 XP', progress: 42, icon: Binoculars },
  { title: '5K Forest Loop', reward: '+150 XP', progress: 86, icon: Trophy },
] as const

const rewards = [
  { title: '15% off trail snacks', partner: 'Summit Pantry', cost: '420 pts', icon: Utensils },
  { title: 'Boot fitting credit', partner: 'North Ridge Gear', cost: '900 pts', icon: ShoppingBag },
  { title: 'Family discovery pack', partner: 'Park Friends', cost: '650 pts', icon: Gift },
] as const

const photoTiles = [
  { src: heroImage, label: 'Falls overlook' },
  { src: forestImage, label: 'Forest trail' },
  { src: lakeImage, label: 'Lake view' },
] as const

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{eyebrow}</p>
      <h2 className="text-2xl font-bold leading-tight">{title}</h2>
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  )
}

function TokenSwatch({
  name,
  value,
  className,
}: {
  name: string
  value: string
  className: string
}) {
  return (
    <div className={cn('flex min-h-28 flex-col justify-between rounded-2xl p-4 shadow-soft', className)}>
      <span className="text-sm font-bold">{name}</span>
      <span className="text-xs font-semibold opacity-80">{value}</span>
    </div>
  )
}

function PhoneFrame({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <article className={cn('mx-auto w-full max-w-[390px]', className)}>
      <div className="rounded-[2rem] bg-foreground p-2 shadow-lift">
        <div className="overflow-hidden rounded-[1.6rem] bg-background">
          <div className="flex items-center justify-between border-b bg-card/90 px-4 py-3">
            <span className="text-xs font-semibold text-muted-foreground">9:41</span>
            <span className="h-1.5 w-20 rounded-full bg-muted" />
            <span className="text-xs font-semibold text-muted-foreground">100%</span>
          </div>
          <div className="min-h-[680px] p-4">{children}</div>
        </div>
      </div>
      <p className="mt-3 text-center text-sm font-semibold text-muted-foreground">{title}</p>
    </article>
  )
}

function MiniSearch() {
  return (
    <div className="flex h-12 items-center gap-3 rounded-2xl border bg-card px-4 shadow-soft">
      <Search className="size-5 text-muted-foreground" aria-hidden="true" />
      <span className="text-sm font-semibold text-muted-foreground">Search trails, parks, wildlife</span>
    </div>
  )
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border bg-background/80 p-3">
      <p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  )
}

function TrailShowcaseCard({
  name,
  meta,
  difficulty,
  distance,
  time,
  image,
}: (typeof trailCards)[number]) {
  return (
    <div className="min-w-[245px] overflow-hidden rounded-2xl border bg-card shadow-soft">
      <div
        className="flex h-36 items-end bg-cover bg-center p-3"
        style={{
          backgroundImage: `linear-gradient(180deg, hsl(var(--foreground) / 0), hsl(var(--foreground) / 0.62)), url(${image})`,
        }}
      >
        <Badge className="bg-card/95 text-foreground" variant="outline">
          {difficulty}
        </Badge>
      </div>
      <div className="p-4">
        <p className="font-bold">{name}</p>
        <p className="text-sm text-muted-foreground">{meta}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <span className="rounded-full bg-muted px-3 py-1 font-semibold">{distance}</span>
          <span className="rounded-full bg-muted px-3 py-1 font-semibold">{time}</span>
        </div>
      </div>
    </div>
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="wa-progress-track">
      <div className="wa-progress-fill" style={{ width: `${value}%` }} />
    </div>
  )
}

function ElevationChart() {
  const bars = [18, 34, 42, 55, 76, 68, 88, 64, 48, 36, 52, 44]

  return (
    <div className="flex h-28 items-end gap-1 rounded-2xl border bg-background/75 p-3">
      {bars.map((height, index) => (
        <span
          className="flex-1 rounded-full bg-primary/80"
          key={`${height}-${index}`}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  )
}

function MapPreview() {
  return (
    <div className="relative h-44 overflow-hidden rounded-2xl border bg-secondary/25 shadow-soft">
      <div className="absolute inset-0 opacity-80 [background-image:linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px),linear-gradient(180deg,hsl(var(--border))_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute left-8 top-8 h-24 w-52 rotate-[-18deg] rounded-full border-4 border-primary" />
      <div className="absolute left-16 top-24 h-16 w-36 rotate-[10deg] rounded-full border-4 border-accent" />
      <span className="absolute left-8 top-8 size-4 rounded-full bg-primary ring-4 ring-card" />
      <span className="absolute bottom-8 right-10 size-4 rounded-full bg-gold ring-4 ring-card" />
      <div className="absolute right-3 top-3 flex flex-col gap-2">
        <button className="wa-map-control" aria-label="Zoom in">
          +
        </button>
        <button className="wa-map-control" aria-label="Locate me">
          <Navigation className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="absolute bottom-3 left-3 rounded-2xl bg-card/95 p-3 text-xs font-semibold shadow-soft">
        2 trails nearby
      </div>
    </div>
  )
}

function MockBottomNav() {
  const items = [
    { label: 'Home', icon: Home, active: true },
    { label: 'Map', icon: Map, active: false },
    { label: 'Track', icon: MapPin, active: false },
    { label: 'Missions', icon: Trophy, active: false },
    { label: 'Profile', icon: User, active: false },
  ]

  return (
    <div className="mt-4 grid grid-cols-5 gap-1 rounded-3xl border bg-card p-2 shadow-soft">
      {items.map(({ label, icon: Icon, active }) => (
        <div
          className={cn(
            'flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-semibold',
            active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
          )}
          key={label}
        >
          <Icon className="size-4" aria-hidden="true" />
          {label}
        </div>
      ))}
    </div>
  )
}

function ExploreHomeMockup() {
  return (
    <PhoneFrame title="Explore / Home">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Good morning</p>
            <h3 className="text-2xl font-bold">Find your next trail</h3>
          </div>
          <button className="wa-fab" aria-label="Notifications">
            <Bell className="size-5" aria-hidden="true" />
          </button>
        </div>
        <MiniSearch />
        <div className="flex gap-3 overflow-x-auto pb-1">
          {trailCards.map((trail) => (
            <TrailShowcaseCard key={trail.name} {...trail} />
          ))}
        </div>
        <MapPreview />
        <div className="grid grid-cols-2 gap-3">
          <StatPill icon={CloudSun} label="Trail weather" value="12 C, clear" />
          <StatPill icon={Shield} label="Condition" value="Dry, busy" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today&apos;s mission</CardTitle>
            <CardDescription>Complete one easy trail before sunset.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressBar value={64} />
          </CardContent>
        </Card>
        <Card className="border-accent bg-accent/25">
          <CardContent className="flex items-center justify-between pt-5">
            <div>
              <p className="text-sm font-bold">Partner reward</p>
              <p className="text-xs text-muted-foreground">Save on post-hike coffee</p>
            </div>
            <Badge className="bg-gold text-gold-foreground">320 pts</Badge>
          </CardContent>
        </Card>
        <MockBottomNav />
      </div>
    </PhoneFrame>
  )
}

function TrailDetailsMockup() {
  return (
    <PhoneFrame title="Trail Details">
      <div className="flex flex-col gap-4">
        <div
          className="wa-hero-media flex h-56 flex-col justify-between bg-cover bg-center p-4 text-primary-foreground"
          style={{
            backgroundImage: `linear-gradient(180deg, hsl(var(--foreground) / 0.08), hsl(var(--foreground) / 0.74)), url(${heroImage})`,
          }}
        >
          <div className="flex justify-end gap-2">
            <button className="wa-map-control text-foreground" aria-label="Save trail">
              <Heart className="size-4" aria-hidden="true" />
            </button>
            <button className="wa-map-control text-foreground" aria-label="Share trail">
              <Navigation className="size-4" aria-hidden="true" />
            </button>
          </div>
          <div>
            <Badge className="mb-2 bg-card/95 text-foreground" variant="outline">
              Family friendly
            </Badge>
            <h3 className="text-2xl font-bold">Johnston Canyon Lower Falls</h3>
            <p className="text-sm opacity-90">Banff National Park</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <StatPill icon={Route} label="Distance" value="2.4 km" />
          <StatPill icon={Mountain} label="Gain" value="120 m" />
          <StatPill icon={Timer} label="Time" value="55 min" />
          <StatPill icon={Flame} label="Energy" value="320" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Elevation and difficulty</CardTitle>
            <CardDescription>Short climb with shaded canyon exposure.</CardDescription>
          </CardHeader>
          <CardContent>
            <ElevationChart />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="grid grid-cols-[1fr_auto] gap-3 pt-5">
            <div>
              <p className="text-sm font-bold">Prepare for this hike</p>
              <p className="text-xs text-muted-foreground">1.5 L water, shell layer, snacks, offline map.</p>
            </div>
            <Badge className="bg-success text-success-foreground">86%</Badge>
          </CardContent>
        </Card>
        <PhotoStrip />
        <Card>
          <CardContent className="flex items-center justify-between pt-5">
            <div>
              <p className="text-sm font-bold">4.8 average rating</p>
              <p className="text-xs text-muted-foreground">Quiet early, icy near railings.</p>
            </div>
            <Star className="size-5 fill-gold text-gold" aria-hidden="true" />
          </CardContent>
        </Card>
        <Button className="sticky bottom-3">
          <Play className="size-4" aria-hidden="true" />
          Start hike
        </Button>
      </div>
    </PhoneFrame>
  )
}

function PhotoStrip() {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold">Community photos</p>
        <Badge variant="outline">128</Badge>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {photoTiles.map(({ src, label }) => (
          <img
            alt={label}
            className="aspect-square rounded-2xl object-cover shadow-soft"
            key={label}
            src={src}
          />
        ))}
      </div>
    </div>
  )
}

function LiveHikeMockup() {
  return (
    <PhoneFrame title="Live Hike / Recording">
      <div className="flex min-h-[650px] flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Recording</p>
            <h3 className="text-2xl font-bold">On trail</h3>
          </div>
          <Badge className="bg-success text-success-foreground">GPS strong</Badge>
        </div>
        <div className="relative min-h-[315px] flex-1 overflow-hidden rounded-[1.5rem] border bg-secondary/25 shadow-soft">
          <div className="absolute inset-0 opacity-80 [background-image:linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px),linear-gradient(180deg,hsl(var(--border))_1px,transparent_1px)] [background-size:46px_46px]" />
          <div className="absolute left-12 top-20 h-52 w-64 rotate-[-30deg] rounded-full border-4 border-primary" />
          <div className="absolute left-20 top-32 h-28 w-44 rotate-[16deg] rounded-full border-4 border-gold" />
          <span className="absolute left-[48%] top-[48%] size-5 rounded-full bg-primary ring-8 ring-primary/20" />
          <div className="absolute left-4 top-4 flex gap-2">
            <Badge className="bg-card/95 text-foreground">1.84 km</Badge>
            <Badge className="bg-card/95 text-foreground">24:18</Badge>
          </div>
          <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-2">
            <StatPill icon={Activity} label="Pace" value="8:22" />
            <StatPill icon={Mountain} label="Gain" value="88 m" />
            <StatPill icon={Flame} label="Cals" value="241" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <button className="wa-panel flex flex-col items-center gap-1 p-3 text-xs font-bold">
            <Binoculars className="size-5" aria-hidden="true" />
            Spot
          </button>
          <button className="wa-panel flex flex-col items-center gap-1 p-3 text-xs font-bold">
            <Shield className="size-5" aria-hidden="true" />
            SOS
          </button>
          <button className="wa-panel flex flex-col items-center gap-1 p-3 text-xs font-bold">
            <Backpack className="size-5" aria-hidden="true" />
            Gear
          </button>
          <button className="wa-panel flex flex-col items-center gap-1 p-3 text-xs font-bold">
            <MapPin className="size-5" aria-hidden="true" />
            Route
          </button>
        </div>
        <Button variant="secondary">Pause hike</Button>
      </div>
    </PhoneFrame>
  )
}

function MissionsMockup() {
  return (
    <PhoneFrame title="Missions / Gamification">
      <div className="flex flex-col gap-4">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle>Level 7 Explorer</CardTitle>
            <CardDescription className="text-primary-foreground/80">1,240 XP until the next badge.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-2 overflow-hidden rounded-full bg-primary-foreground/20">
              <div className="h-full w-[72%] rounded-full bg-gold" />
            </div>
          </CardContent>
        </Card>
        {missions.map(({ title, reward, progress, icon: Icon }) => (
          <Card key={title}>
            <CardContent className="flex items-center gap-3 pt-5">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold">{title}</p>
                  <Badge variant="secondary">{reward}</Badge>
                </div>
                <div className="mt-2">
                  <ProgressBar value={progress} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Animal collection</CardTitle>
            <CardDescription>Elk, black bear, moose, and bighorn sheep discovered.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-4 gap-2">
            {['Elk', 'Bear', 'Moose', 'Sheep'].map((animal) => (
              <div className="rounded-2xl border bg-background/70 p-3 text-center text-xs font-bold" key={animal}>
                <Binoculars className="mx-auto mb-2 size-5 text-primary" aria-hidden="true" />
                {animal}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PhoneFrame>
  )
}

function RewardsMockup() {
  return (
    <PhoneFrame title="Rewards / Shop">
      <div className="flex flex-col gap-4">
        <Card className="overflow-hidden bg-primary text-primary-foreground">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>2,860 points</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  Redeem with local outdoor partners.
                </CardDescription>
              </div>
              <Sparkles className="size-6 text-gold" aria-hidden="true" />
            </div>
          </CardHeader>
        </Card>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold">Available offers</p>
          <Badge variant="outline">Near Banff</Badge>
        </div>
        {rewards.map(({ title, partner, cost, icon: Icon }) => (
          <Card key={title}>
            <CardContent className="flex items-center gap-3 pt-5">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{title}</p>
                <p className="text-xs text-muted-foreground">{partner}</p>
              </div>
              <Badge className="bg-gold text-gold-foreground">{cost}</Badge>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gear recommendation</CardTitle>
            <CardDescription>Light rain shell, compact first aid kit, and bear spray for canyon trails.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              View gear picks
            </Button>
          </CardContent>
        </Card>
      </div>
    </PhoneFrame>
  )
}

function ProfileMockup() {
  return (
    <PhoneFrame title="Profile">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-16 items-center justify-center rounded-3xl bg-primary text-xl font-bold text-primary-foreground shadow-soft">
            A
          </div>
          <div>
            <h3 className="text-2xl font-bold">Avery Trail</h3>
            <p className="text-sm text-muted-foreground">Canmore weekend explorer</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Hikes" value="34" />
          <MetricCard label="Distance" value="182 km" />
          <MetricCard label="Elevation" value="6,420 m" />
          <MetricCard label="Calories" value="21,840" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Achievement shelf</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2">
            {[Award, Mountain, Shield].map((Icon, index) => (
              <div className="rounded-2xl border bg-background/70 p-3 text-center" key={index}>
                <Icon className="mx-auto mb-2 size-6 text-gold" aria-hidden="true" />
                <p className="text-xs font-bold">Badge</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <PhotoStrip />
        <Card>
          <CardContent className="flex items-center justify-between pt-5">
            <div>
              <p className="text-sm font-bold">Saved routes</p>
              <p className="text-xs text-muted-foreground">12 offline-ready trails</p>
            </div>
            <ChevronRight className="size-5 text-muted-foreground" aria-hidden="true" />
          </CardContent>
        </Card>
      </div>
    </PhoneFrame>
  )
}

function KidsModeMockup() {
  return (
    <PhoneFrame title="Kids Mode / Explorer Mode">
      <div className="flex flex-col gap-4">
        <Card className="border-accent bg-accent/35">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Explorer mode</p>
                <CardTitle>Nature quest</CardTitle>
                <CardDescription>Find 3 safe plants and listen for birds.</CardDescription>
              </div>
              <Badge className="bg-gold text-gold-foreground">Family</Badge>
            </div>
          </CardHeader>
        </Card>
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-5">
              <Binoculars className="mb-3 size-7 text-primary" aria-hidden="true" />
              <p className="text-sm font-bold">Animal cards</p>
              <p className="mt-1 text-xs text-muted-foreground">Collect safe sightings.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <CheckCircle2 className="mb-3 size-7 text-success" aria-hidden="true" />
              <p className="text-sm font-bold">Mini missions</p>
              <p className="mt-1 text-xs text-muted-foreground">Short, bright, clear.</p>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Discovery checklist</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {['Water packed', 'Stay with grown-up', 'Bear spray carried by adult'].map((item) => (
              <div className="flex items-center gap-3 rounded-2xl border bg-background/70 p-3" key={item}>
                <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
                <span className="text-sm font-semibold">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Button>
          <Sparkles className="size-4" aria-hidden="true" />
          Start family adventure
        </Button>
      </div>
    </PhoneFrame>
  )
}

function ComponentGallery() {
  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Reusable product components</CardTitle>
          <CardDescription>Core building blocks for trail discovery, preparation, rewards, and activity stats.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="wa-panel">
            <CloudSun className="mb-3 size-6 text-primary" aria-hidden="true" />
            <p className="font-bold">Weather widget</p>
            <p className="text-sm text-muted-foreground">12 C, wind 18 kph, UV 6</p>
          </div>
          <div className="wa-panel">
            <Droplets className="mb-3 size-6 text-primary" aria-hidden="true" />
            <p className="font-bold">Water card</p>
            <p className="text-sm text-muted-foreground">Bring 1.5-2.0 L plus electrolytes.</p>
          </div>
          <div className="wa-panel">
            <BadgePercent className="mb-3 size-6 text-gold" aria-hidden="true" />
            <p className="font-bold">Reward card</p>
            <p className="text-sm text-muted-foreground">Partner offers with points cost.</p>
          </div>
          <div className="wa-panel">
            <AlertTriangle className="mb-3 size-6 text-warning" aria-hidden="true" />
            <p className="font-bold">Safety warning</p>
            <p className="text-sm text-muted-foreground">Late start, high UV, weak GPS.</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Controls and motion language</CardTitle>
          <CardDescription>Large tap targets, smooth progress, floating map controls, and clear CTAs.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge>Primary badge</Badge>
            <Badge variant="secondary">Difficulty</Badge>
            <Badge className="bg-gold text-gold-foreground">Reward</Badge>
            <Badge className="bg-success text-success-foreground">Ready</Badge>
          </div>
          <ProgressBar value={78} />
          <div className="flex items-center gap-3">
            <button className="wa-fab" aria-label="Start">
              <Play className="size-5" aria-hidden="true" />
            </button>
            <button className="wa-map-control" aria-label="Map">
              <Map className="size-4" aria-hidden="true" />
            </button>
            <button className="wa-map-control" aria-label="Camera">
              <Camera className="size-4" aria-hidden="true" />
            </button>
            <Button>
              <Zap className="size-4" aria-hidden="true" />
              Start hike
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

export function DesignSystemPage() {
  return (
    <main className="wa-page max-w-6xl">
      <PageHeader
        description="A premium, mobile-first UI direction for Wild Alberta: calm forest palette, large outdoor-friendly controls, soft depth, reusable cards, and high-fidelity screen compositions."
        eyebrow="Design system"
        title="Premium outdoor app mockups"
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {tokenSwatches.map((token) => (
          <TokenSwatch key={token.name} {...token} />
        ))}
      </section>

      <Card className="overflow-hidden">
        <CardContent className="grid gap-5 pt-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="flex flex-col gap-4">
            <Badge className="bg-accent text-accent-foreground">
              <Sparkles className="size-3.5" aria-hidden="true" />
              App Store ready visual direction
            </Badge>
            <div>
              <h2 className="text-3xl font-bold leading-tight">Calm, practical, and premium for hikers in motion.</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                The system blends Scandinavian restraint with outdoor utility: readable surfaces, refined spacing,
                scan-first stats, clear safety hierarchy, and warm reward moments.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/home">View live home</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/explore">Open trails</Link>
              </Button>
            </div>
          </div>
          <MapPreview />
        </CardContent>
      </Card>

      <SectionIntro
        description="These components are intentionally simple to compose: trail cards, mission cards, reward cards, stat widgets, badges, map controls, weather modules, photo cards, CTAs, and floating actions."
        eyebrow="Component architecture"
        title="Reusable design system"
      />
      <ComponentGallery />

      <SectionIntro
        description="The following high-fidelity mobile mockups cover the core product surfaces and can be used as implementation targets for future page-by-page redesign work."
        eyebrow="High-fidelity screens"
        title="Mobile product mockups"
      />
      <section className="grid gap-8 xl:grid-cols-2">
        <ExploreHomeMockup />
        <TrailDetailsMockup />
        <LiveHikeMockup />
        <MissionsMockup />
        <RewardsMockup />
        <ProfileMockup />
        <KidsModeMockup />
      </section>
    </main>
  )
}
