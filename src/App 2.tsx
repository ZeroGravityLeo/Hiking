import L from 'leaflet'
import {
  BadgeCheck,
  CalendarDays,
  ClipboardCheck,
  MapPin,
  MessageSquareQuote,
  MessageSquareText,
  Search,
  ShieldCheck,
  Wrench,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { Link, Navigate, Route, Routes, useParams } from 'react-router-dom'

type Business = {
  id: string
  name: string
  slug: string
  category: string
  description: string
  neighbourhood: string
  serviceArea: string
  latitude: number
  longitude: number
  verified: boolean
  tags: string[]
}

type InspectionIssue = {
  id: string
  title: string
  severity: 'Low' | 'Medium' | 'High'
  trade: string
  description: string
}

const businesses: Business[] = [
  {
    id: 'b1',
    name: 'Evergreen Home Services',
    slug: 'evergreen-home-services',
    category: 'Handyman',
    description: 'Small repairs, seasonal maintenance, and inspection punch-list fixes for southwest Calgary homes.',
    neighbourhood: 'Evergreen',
    serviceArea: 'Evergreen, Shawnessy, Bridlewood',
    latitude: 50.9142,
    longitude: -114.1064,
    verified: true,
    tags: ['Inspection Repairs', 'Drywall', 'Doors'],
  },
  {
    id: 'b2',
    name: 'Shawnessy Electric Pros',
    slug: 'shawnessy-electric-pros',
    category: 'Electrician',
    description: 'Licensed residential electricians for GFCI protection, panels, fixtures, and safety upgrades.',
    neighbourhood: 'Shawnessy',
    serviceArea: 'Shawnessy, Somerset, Evergreen',
    latitude: 50.9048,
    longitude: -114.0668,
    verified: true,
    tags: ['GFCI', 'Electrical Safety', 'Inspection Repairs'],
  },
  {
    id: 'b3',
    name: 'Seton HVAC Care',
    slug: 'seton-hvac-care',
    category: 'HVAC',
    description: 'Furnace service, humidifier checks, filters, and pre-sale comfort inspections.',
    neighbourhood: 'Seton',
    serviceArea: 'Seton, Auburn Bay, Mahogany',
    latitude: 50.8789,
    longitude: -113.9522,
    verified: true,
    tags: ['Furnace', 'HVAC', 'Maintenance'],
  },
  {
    id: 'b4',
    name: 'Inglewood Roof & Gutter',
    slug: 'inglewood-roof-gutter',
    category: 'Roofer',
    description: 'Roof repairs, missing shingles, gutter drainage corrections, and storm follow-up visits.',
    neighbourhood: 'Inglewood',
    serviceArea: 'Inglewood, Ramsay, Beltline',
    latitude: 51.0394,
    longitude: -114.0266,
    verified: true,
    tags: ['Roofing', 'Gutter Company', 'Drainage'],
  },
  {
    id: 'b5',
    name: 'Beltline Move-Out Cleaning',
    slug: 'beltline-move-out-cleaning',
    category: 'Cleaner',
    description: 'Apartment, condo, and move-out cleaning with landlord checklist support.',
    neighbourhood: 'Beltline',
    serviceArea: 'Beltline, Mission, Downtown West',
    latitude: 51.0415,
    longitude: -114.0752,
    verified: true,
    tags: ['Move-Out', 'Deep Cleaning', 'Condo'],
  },
  {
    id: 'b6',
    name: 'Mahogany Dog Walkers',
    slug: 'mahogany-dog-walkers',
    category: 'Dog Walker',
    description: 'Neighbourhood dog walking, pet check-ins, and lake community routes.',
    neighbourhood: 'Mahogany',
    serviceArea: 'Mahogany, Auburn Bay, Seton',
    latitude: 50.8936,
    longitude: -113.9431,
    verified: false,
    tags: ['Pets', 'Dog Walking'],
  },
  {
    id: 'b7',
    name: 'Calgary Moisture & Thermal Scan',
    slug: 'calgary-moisture-thermal-scan',
    category: 'Home Inspector',
    description: 'Moisture checks, infrared scan follow-ups, and practical repair guidance after inspection reports.',
    neighbourhood: 'Shawnessy',
    serviceArea: 'South Calgary and inner-city communities',
    latitude: 50.9334,
    longitude: -114.0728,
    verified: true,
    tags: ['Moisture Specialist', 'Thermal Imaging'],
  },
  {
    id: 'b8',
    name: 'SnowReady Calgary',
    slug: 'snowready-calgary',
    category: 'Snow Removal',
    description: 'Seasonal snow clearing for homes, seniors, sidewalks, and small condo properties.',
    neighbourhood: 'Evergreen',
    serviceArea: 'Evergreen, Shawnessy, Silverado',
    latitude: 50.9227,
    longitude: -114.0952,
    verified: false,
    tags: ['Snow Removal', 'Sidewalks'],
  },
]

const requests = [
  ['Need help moving a couch', 'Moving', 'Shawnessy', 'Open', 'Paid'],
  ['Looking for snow removal', 'Snow Removal', 'Evergreen', 'In progress', 'Paid'],
  ['Need cleaner before move-out', 'Cleaning', 'Beltline', 'Open', 'Paid'],
  ['Borrow ladder for one day', 'Borrow', 'Auburn Bay', 'Completed', 'Free'],
]

const events = [
  ['Evergreen garage sale loop', 'Evergreen', 'May 16', 'Neighbour-organized multi-home garage sale.'],
  ['Inglewood community cleanup', 'Inglewood', 'May 24', 'Meet near the community hall for gloves, bags, and coffee after.'],
  ['Newcomer coffee meetup', 'Inglewood', 'May 30', 'Casual coffee for new residents to meet neighbours.'],
  ['Home maintenance workshop', 'Seton', 'June 7', 'Inspectors and trades explain common inspection repairs.'],
]

const inspectionIssues: InspectionIssue[] = [
  {
    id: 'roof',
    title: 'Roof shingles damaged',
    severity: 'High',
    trade: 'Roofer',
    description: 'Several shingles are lifted or missing granules. Repair is recommended before storm season.',
  },
  {
    id: 'gfci',
    title: 'GFCI protection missing near kitchen countertop',
    severity: 'Medium',
    trade: 'Electrician',
    description: 'Countertop receptacles should be reviewed by a licensed electrician.',
  },
  {
    id: 'furnace',
    title: 'Furnace needs service',
    severity: 'Medium',
    trade: 'HVAC',
    description: 'The furnace is operating but due for cleaning and service.',
  },
  {
    id: 'drainage',
    title: 'Gutter drainage issue',
    severity: 'Medium',
    trade: 'Gutter Company',
    description: 'Downspouts discharge near the foundation. Extensions and slope corrections are recommended.',
  },
  {
    id: 'moisture',
    title: 'Possible moisture problem',
    severity: 'High',
    trade: 'Moisture Specialist',
    description: 'Elevated readings were observed near a finished basement wall.',
  },
]

const markerIcon = L.divIcon({
  className: '',
  html: '<span class="lb-map-marker">B</span>',
  iconAnchor: [17, 17],
  iconSize: [34, 34],
  popupAnchor: [0, -18],
})

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/businesses" element={<BusinessesPage />} />
        <Route path="/businesses/:slug" element={<BusinessPage />} />
        <Route path="/requests" element={<RequestsPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/inspection-connect" element={<InspectionConnectPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

function Header() {
  const links = [
    ['/map', 'Map'],
    ['/businesses', 'Businesses'],
    ['/requests', 'Requests'],
    ['/events', 'Events'],
    ['/inspection-connect', 'Inspection Connect'],
  ]

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <Link className="flex w-fit items-center gap-3 no-underline" to="/">
          <span className="grid size-10 place-items-center rounded-lg bg-primary text-sm font-black text-primary-foreground shadow-soft">LB</span>
          <span>
            <span className="block text-base font-black text-foreground">LocalBridge</span>
            <span className="block text-xs font-medium text-muted-foreground">Calgary neighbourhood demo</span>
          </span>
        </Link>
        <nav className="flex gap-1 overflow-x-auto pb-1 lg:pb-0">
          {links.map(([href, label]) => (
            <Link className="shrink-0 rounded-lg px-3 py-2 text-sm font-bold text-muted-foreground no-underline transition hover:bg-muted hover:text-foreground" key={href} to={href}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}

function HomePage() {
  return (
    <main>
      <section className="border-b bg-card">
        <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1fr]">
          <div>
            <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-normal sm:text-6xl">Your neighbourhood, organized.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              LocalBridge is a calm neighbourhood platform for local businesses, verified services, help requests, community events, and future inspection repair matching.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to="/map">Explore Local Map</ButtonLink>
              <ButtonLink variant="secondary" to="/businesses">
                Find Local Services
              </ButtonLink>
              <ButtonLink variant="secondary" to="/inspection-connect">
                Connect Inspection Report
              </ButtonLink>
            </div>
          </div>
          <div className="rounded-lg border bg-background p-3 shadow-lift">
            <div className="grid min-h-[460px] overflow-hidden rounded-lg border bg-muted lg:grid-cols-[1fr_230px]">
              <div className="relative bg-[linear-gradient(135deg,hsl(var(--muted)),hsl(var(--accent)))]">
                {businesses.slice(0, 7).map((business, index) => (
                  <span
                    className="absolute grid size-9 place-items-center rounded-full border-4 border-white bg-primary text-xs font-black text-primary-foreground shadow-lift"
                    key={business.id}
                    style={{ left: `${18 + ((index * 17) % 62)}%`, top: `${18 + ((index * 13) % 58)}%` }}
                  >
                    B
                  </span>
                ))}
              </div>
              <div className="border-l bg-card p-5">
                <p className="text-xs font-bold uppercase text-secondary">Selected provider</p>
                <h2 className="mt-2 text-xl font-black">Shawnessy Electric Pros</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">Licensed electricians for GFCI protection, fixtures, panels, and inspection repairs.</p>
                <Verification verified />
                <button className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground" type="button">
                  Request Quote
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:px-6 md:grid-cols-2 xl:grid-cols-5">
        {[
          [MapPin, 'Local business map', 'Find services and places directly on our own map.'],
          [MessageSquareText, 'Neighbour help requests', 'Structured local asks without feed noise.'],
          [CalendarDays, 'Events and announcements', 'Garage sales, cleanups, and workshops.'],
          [ShieldCheck, 'Verified local services', 'Trust signals for real providers.'],
          [ClipboardCheck, 'Inspection report connection', 'Match report issues to nearby repair pros.'],
        ].map(([Icon, title, text]) => (
          <article className="rounded-lg border bg-card p-5 shadow-soft" key={String(title)}>
            <Icon className="size-6 text-primary" />
            <h2 className="mt-4 text-lg font-black">{title as string}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{text as string}</p>
          </article>
        ))}
      </section>
    </main>
  )
}

function MapPage() {
  const [query, setQuery] = useState('')
  const filtered = useMemo(
    () => businesses.filter((business) => [business.name, business.category, business.neighbourhood, ...business.tags].join(' ').toLowerCase().includes(query.toLowerCase())),
    [query],
  )

  return (
    <Page title="Local businesses, requests, events, and issues." kicker="Open neighbourhood map">
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="grid gap-4">
          <SearchBox onChange={setQuery} value={query} />
          <div className="h-[560px] overflow-hidden rounded-lg border bg-muted shadow-soft">
            <MapContainer center={[50.965, -114.03]} scrollWheelZoom zoom={11}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {filtered.map((business) => (
                <Marker icon={markerIcon} key={business.id} position={[business.latitude, business.longitude]}>
                  <Popup>
                    <strong>{business.name}</strong>
                    <br />
                    {business.category} · {business.neighbourhood}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </section>
        <aside className="h-fit rounded-lg border bg-card p-5 shadow-soft">
          <p className="text-xs font-bold uppercase text-secondary">Map results</p>
          <h2 className="mt-1 text-2xl font-black">{filtered.length} local points</h2>
          <div className="mt-4 grid gap-3">
            {filtered.slice(0, 5).map((business) => (
              <BusinessMini business={business} key={business.id} />
            ))}
          </div>
        </aside>
      </div>
    </Page>
  )
}

function BusinessesPage() {
  const [query, setQuery] = useState('')
  const filtered = businesses.filter((business) => [business.name, business.category, business.neighbourhood, ...business.tags].join(' ').toLowerCase().includes(query.toLowerCase()))

  return (
    <Page title="Find verified local services." kicker="Local service directory">
      <SearchBox onChange={setQuery} value={query} />
      <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((business) => (
          <BusinessCard business={business} key={business.id} />
        ))}
      </section>
    </Page>
  )
}

function BusinessPage() {
  const { slug } = useParams()
  const business = businesses.find((item) => item.slug === slug)

  if (!business) {
    return <Navigate to="/businesses" replace />
  }

  return (
    <Page title={business.name} kicker={business.category}>
      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <article className="rounded-lg border bg-card p-6 shadow-soft">
          <Verification verified={business.verified} />
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{business.description}</p>
          <div className="mt-6 grid gap-4 rounded-lg border bg-background p-5 sm:grid-cols-2">
            <Info label="Address area" value={`${business.neighbourhood}, Calgary`} />
            <Info label="Service area" value={business.serviceArea} />
            <Info label="Phone" value="(403) 555-0100" />
            <Info label="Website" value="example.com" />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {business.tags.map((tag) => (
              <span className="rounded-lg border bg-card px-3 py-1 text-xs font-bold text-muted-foreground" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </article>
        <aside className="h-fit rounded-lg border bg-card p-5 shadow-soft">
          <h2 className="text-xl font-black">Work with this provider</h2>
          <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground" type="button">
            <MessageSquareQuote className="size-4" />
            Request Quote
          </button>
          <button className="mt-2 w-full rounded-lg border bg-card px-4 py-2 text-sm font-bold" type="button">
            Save Business
          </button>
        </aside>
      </section>
    </Page>
  )
}

function RequestsPage() {
  return (
    <Page title="Structured local asks without feed noise." kicker="Neighbour help requests">
      <button className="mb-5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground" type="button">
        Create Request
      </button>
      <section className="grid gap-4 md:grid-cols-2">
        {requests.map(([title, category, area, status, paid]) => (
          <article className="rounded-lg border bg-card p-5 shadow-soft" key={title}>
            <p className="text-xs font-bold uppercase text-secondary">{category}</p>
            <h2 className="mt-1 text-xl font-black">{title}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{area} · {status} · {paid}</p>
          </article>
        ))}
      </section>
    </Page>
  )
}

function EventsPage() {
  return (
    <Page title="Local events and announcements." kicker="Community events">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map(([title, area, date, description]) => (
          <article className="rounded-lg border bg-card p-5 shadow-soft" key={title}>
            <p className="text-xs font-bold uppercase text-secondary">{area} · {date}</p>
            <h2 className="mt-1 text-xl font-black">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
          </article>
        ))}
      </section>
    </Page>
  )
}

function InspectionConnectPage() {
  const [selected, setSelected] = useState(inspectionIssues[1])
  const matches = businesses.filter((business) => business.category === selected.trade || business.tags.includes(selected.trade))

  return (
    <Page title="Turn report issues into local repair matches." kicker="Inspection connect demo">
      <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
        <section className="grid gap-4">
          {inspectionIssues.map((issue) => (
            <article className={`rounded-lg border bg-card p-5 shadow-soft ${selected.id === issue.id ? 'ring-2 ring-primary' : ''}`} key={issue.id}>
              <p className="text-xs font-bold uppercase text-secondary">Inspection issue</p>
              <h2 className="mt-2 text-xl font-black">{issue.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{issue.description}</p>
              <p className="mt-3 text-sm font-bold">Severity: {issue.severity} · Recommended trade: {issue.trade}</p>
              <button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground" onClick={() => setSelected(issue)} type="button">
                <Search className="size-4" />
                Find Local Pros
              </button>
            </article>
          ))}
        </section>
        <aside className="h-fit rounded-lg border bg-card p-5 shadow-soft">
          <p className="text-xs font-bold uppercase text-secondary">Matching marketplace</p>
          <h2 className="mt-1 text-2xl font-black">{selected.trade}</h2>
          <div className="mt-4 grid gap-3">
            {matches.map((business) => (
              <BusinessMini business={business} key={business.id} />
            ))}
          </div>
        </aside>
      </div>
    </Page>
  )
}

function Page({ children, kicker, title }: { children: ReactNode; kicker: string; title: string }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <p className="text-xs font-bold uppercase text-secondary">{kicker}</p>
      <h1 className="mt-2 text-4xl font-black leading-tight tracking-normal">{title}</h1>
      <div className="mt-6">{children}</div>
    </main>
  )
}

function BusinessCard({ business }: { business: Business }) {
  return (
    <article className="rounded-lg border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-secondary">{business.category}</p>
          <h2 className="mt-1 text-xl font-black">{business.name}</h2>
        </div>
        <Verification verified={business.verified} />
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{business.description}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <ButtonLink variant="secondary" to="/map">
          View on Map
        </ButtonLink>
        <ButtonLink to={`/businesses/${business.slug}`}>Request Quote</ButtonLink>
      </div>
    </article>
  )
}

function BusinessMini({ business }: { business: Business }) {
  return (
    <Link className="block rounded-lg border bg-background p-4 no-underline hover:bg-muted" to={`/businesses/${business.slug}`}>
      <p className="text-xs font-bold uppercase text-secondary">{business.category}</p>
      <h3 className="mt-1 font-black">{business.name}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{business.neighbourhood}</p>
    </Link>
  )
}

function SearchBox({ onChange, value }: { onChange: (value: string) => void; value: string }) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        className="h-12 w-full rounded-lg border bg-card px-10 text-sm font-medium outline-none focus:ring-2 focus:ring-ring"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search businesses, trades, neighbourhoods, or tags"
        type="search"
        value={value}
      />
    </label>
  )
}

function ButtonLink({ children, to, variant = 'primary' }: { children: ReactNode; to: string; variant?: 'primary' | 'secondary' }) {
  const className =
    variant === 'primary'
      ? 'inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground no-underline shadow-soft'
      : 'inline-flex items-center justify-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-bold text-foreground no-underline shadow-sm hover:bg-muted'

  return (
    <Link className={className} to={to}>
      {children}
    </Link>
  )
}

function Verification({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex w-fit items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
      <BadgeCheck className="size-3.5" />
      Verified
    </span>
  ) : (
    <span className="inline-flex w-fit rounded-lg border bg-card px-2.5 py-1 text-xs font-bold text-muted-foreground">Unverified</span>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <Wrench className="mt-1 size-4 shrink-0 text-primary" />
      <div>
        <dt className="text-xs font-bold uppercase text-muted-foreground">{label}</dt>
        <dd className="mt-1 text-sm font-semibold">{value}</dd>
      </div>
    </div>
  )
}

export default App
