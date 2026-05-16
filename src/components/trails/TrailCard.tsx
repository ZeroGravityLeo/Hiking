import { Link } from 'react-router-dom'
import { Clock, Map, Mountain, Play, Route } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Trail } from '@/lib/types'

export function TrailSummaryCard({
  trail,
  onOpen,
}: {
  trail: Trail
  onOpen?: () => void
}) {
  return (
    <Card className="overflow-hidden">
      <div className="h-2 bg-primary" />
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>{trail.name}</CardTitle>
            <CardDescription>{trail.region}</CardDescription>
          </div>
          <Badge variant="secondary">{trail.difficulty}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">{trail.description}</p>
        <TrailMetricGrid trail={trail} />
        <div className="grid grid-cols-2 gap-2">
          <Button asChild variant="outline">
            <Link onClick={onOpen} to={`/trails/${trail.slug}`}>
              <Route data-icon="inline-start" />
              Details
            </Link>
          </Button>
          <Button asChild>
            <Link to={`/tracking?trail=${trail.slug}`}>
              <Play data-icon="inline-start" />
              Track
            </Link>
          </Button>
          <Button asChild className="col-span-2" variant="outline">
            <Link to={`/map?trail=${trail.slug}`}>
              <Map data-icon="inline-start" />
              Open on map
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function TrailMetricGrid({ trail }: { trail: Trail }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <TrailMetric icon={Route} label="Distance" value={`${trail.distance_km} km`} />
      <TrailMetric icon={Mountain} label="Gain" value={`${trail.elevation_gain_m} m`} />
      <TrailMetric icon={Clock} label="Time" value={`${trail.estimated_time_minutes} min`} />
    </div>
  )
}

export function TrailMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon?: typeof Route
}) {
  return (
    <div className="rounded-2xl border bg-background/70 p-2.5">
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        {Icon ? <Icon aria-hidden="true" /> : null}
        {label}
      </p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  )
}
