import { Link } from 'react-router-dom'
import { AlertTriangle, Backpack, Droplets, Play, Share2, Shirt, Utensils } from 'lucide-react'

import { ReadinessScore } from '@/components/preparation/HikePreparationSection'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { HikePreparationPlan } from '@/lib/hike-preparation'

export function BeforeStartPreparationCard({
  plan,
  onStart,
  onShareTripPlan,
  disabled,
}: {
  plan: HikePreparationPlan
  onStart: () => void
  onShareTripPlan?: () => void
  disabled: boolean
}) {
  const firstWarning = plan.safetyWarnings[0] ?? 'No major preparation warnings from the mock provider.'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Before you start</CardTitle>
            <CardDescription>
              Weather, water, food, clothing, and readiness for {plan.trail.name}.
            </CardDescription>
          </div>
          <Badge variant={plan.readiness.score < 60 ? 'destructive' : 'secondary'}>
            {plan.readiness.score}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ReadinessScore score={plan.readiness.score} />
        {plan.readiness.score < 60 ? (
          <div className="rounded-lg border bg-background p-3 text-sm">
            <p className="font-medium">You may not be fully prepared for this hike.</p>
            <p className="mt-1 text-muted-foreground">{plan.readiness.missing[0]}</p>
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <CompactFact label="Weather" value={plan.weatherSummary} />
          <CompactFact
            icon={Droplets}
            label="Water"
            value={`${plan.recommendedWaterLiters.min.toFixed(1)}-${plan.recommendedWaterLiters.max.toFixed(1)} L`}
          />
          <CompactFact
            icon={Utensils}
            label="Food"
            value={plan.foodRecommendation.items.slice(0, 3).join(', ')}
          />
          <CompactFact
            icon={Shirt}
            label="Clothing"
            value={plan.clothingRecommendation.shell}
          />
        </div>
        <div className="rounded-lg border bg-background p-3 text-sm">
          <p className="flex items-center gap-2 font-medium">
            <AlertTriangle aria-hidden="true" />
            Safety warning
          </p>
          <p className="mt-1 text-muted-foreground">{firstWarning}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button asChild variant="outline">
            <Link to={`/trails/${plan.trail.slug}#prepare`}>
              <Backpack data-icon="inline-start" />
              Checklist
            </Link>
          </Button>
          <Button onClick={onShareTripPlan} variant="outline">
            <Share2 data-icon="inline-start" />
            Share trip plan
          </Button>
          <Button disabled={disabled} onClick={onStart}>
            <Play data-icon="inline-start" />
            Start tracking
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function CompactFact({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon?: typeof Droplets
}) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        {Icon ? <Icon aria-hidden="true" /> : null}
        {label}
      </p>
      <p className="mt-1 line-clamp-3 font-medium">{value}</p>
    </div>
  )
}
