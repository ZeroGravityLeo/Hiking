import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Backpack,
  CheckCircle2,
  CloudSun,
  Droplets,
  Shirt,
  Soup,
  Sun,
  Utensils,
} from 'lucide-react'

import { MetricCard } from '@/components/common/MetricCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import type { PreparationAcknowledgements } from '@/lib/hike-preparation'
import type { HikePreparationPlan } from '@/lib/hike-preparation'
import type { ChecklistItemState } from '@/lib/types'
import { cn } from '@/lib/utils'

interface HikePreparationSectionProps {
  plan: HikePreparationPlan
  checklistState: ChecklistItemState[]
  acknowledgements: PreparationAcknowledgements
  onChecklistChange: (id: string, checked: boolean) => void
  onAcknowledgementChange: (key: keyof PreparationAcknowledgements, checked: boolean) => void
}

const acknowledgementRows: Array<{
  key: keyof PreparationAcknowledgements
  label: string
  description: string
}> = [
  {
    key: 'weatherChecked',
    label: 'Weather checked',
    description: 'I reviewed the current conditions and forecast assumptions.',
  },
  {
    key: 'waterPlanned',
    label: 'Water planned',
    description: 'I can carry the recommended water range.',
  },
  {
    key: 'foodPlanned',
    label: 'Food planned',
    description: 'I packed enough snacks for the route duration.',
  },
  {
    key: 'offlineMapAcknowledged',
    label: 'Offline map gap acknowledged',
    description: 'I understand offline maps are not downloaded in this MVP yet.',
  },
  {
    key: 'safetyWarningsAcknowledged',
    label: 'Safety warnings reviewed',
    description: 'I reviewed the weather, daylight, wildlife, and remoteness warnings.',
  },
]

export function HikePreparationSection({
  plan,
  checklistState,
  acknowledgements,
  onChecklistChange,
  onAcknowledgementChange,
}: HikePreparationSectionProps) {
  const checkedIds = new Set(checklistState.filter((item) => item.checked).map((item) => item.id))
  const readinessLow = plan.readiness.score < 60

  return (
    <section className="flex flex-col gap-4" id="prepare">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle>Prepare for this hike</CardTitle>
              <CardDescription>
                Weather-aware calories, water, food, clothing, safety, and backpack planning.
              </CardDescription>
            </div>
            <Badge variant={readinessLow ? 'destructive' : 'secondary'}>
              Trail readiness: {plan.readiness.score}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ReadinessScore score={plan.readiness.score} />
          {readinessLow ? (
            <div className="rounded-lg border bg-background p-3 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <AlertTriangle aria-hidden="true" />
                You may not be fully prepared for this hike.
              </p>
              <ul className="mt-2 flex flex-col gap-1 text-muted-foreground">
                {plan.readiness.missing.slice(0, 6).map((missing) => (
                  <li key={missing}>- {missing}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Weather" value={`${plan.weather.temperatureC}C`} />
            <MetricCard label="Feels like" value={`${plan.weather.feelsLikeC}C`} />
            <MetricCard label="Wind" value={`${plan.weather.windKph} km/h`} />
            <MetricCard label="UV index" value={`${plan.weather.uvIndex}`} />
          </div>

          <RecommendationCard
            icon={CloudSun}
            title="Weather summary"
            description={plan.weatherSummary}
            items={[
              `${plan.weather.precipitationChance}% precipitation chance`,
              `Sunrise ${formatTime(plan.weather.sunrise)}`,
              `Sunset ${formatTime(plan.weather.sunset)}`,
              plan.weather.visibilityKm ? `${plan.weather.visibilityKm} km visibility` : 'Visibility unavailable',
            ]}
          />

          <RecommendationCard
            icon={Soup}
            title="Estimated calories"
            description={`${plan.estimatedCalories.min}-${plan.estimatedCalories.max} kcal before terrain and pace surprises`}
            items={[
              `${plan.trail.distance_km} km route`,
              `${plan.trail.elevation_gain_m} m elevation gain`,
              `${plan.trail.difficulty} effort estimate`,
            ]}
          />

          <RecommendationCard
            icon={Droplets}
            title="Water recommendation"
            description={`Bring ${plan.recommendedWaterLiters.min.toFixed(1)}-${plan.recommendedWaterLiters.max.toFixed(1)} L of water.`}
            items={[
              plan.recommendedWaterLiters.reason,
              plan.recommendedWaterLiters.electrolytes
                ? 'Add electrolytes for heat or longer duration.'
                : 'Electrolytes optional for this route.',
            ]}
          />

          <RecommendationCard
            icon={Utensils}
            title={plan.foodRecommendation.title}
            description="Pack food that is easy to eat without a long stop."
            items={[...plan.foodRecommendation.items, ...plan.foodRecommendation.familyItems]}
          />

          <RecommendationCard
            icon={Shirt}
            title="Clothing recommendation"
            description="Dress for moving uphill, stopping in wind, and changing mountain weather."
            items={[
              `Base layer: ${plan.clothingRecommendation.baseLayer}`,
              `Mid-layer: ${plan.clothingRecommendation.midLayer}`,
              `Shell: ${plan.clothingRecommendation.shell}`,
              `Pants: ${plan.clothingRecommendation.pants}`,
              `Footwear: ${plan.clothingRecommendation.footwear}`,
              ...plan.clothingRecommendation.accessories,
              ...plan.clothingRecommendation.warnings,
            ]}
          />

          <Card className="shadow-none">
            <CardHeader>
              <div className="flex items-start gap-3">
                <Backpack aria-hidden="true" />
                <div className="flex flex-col gap-1">
                  <CardTitle>Backpack checklist</CardTitle>
                  <CardDescription>
                    Essential items count toward readiness. Optional items help customize the hike.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {plan.checklist.map((item) => (
                <label
                  className="flex items-start gap-3 rounded-lg border bg-background p-3 text-sm"
                  key={item.id}
                >
                  <input
                    checked={checkedIds.has(item.id)}
                    className="mt-1 size-4 accent-primary"
                    onChange={(event) => onChecklistChange(item.id, event.target.checked)}
                    type="checkbox"
                  />
                  <span className="flex flex-1 flex-col gap-1">
                    <span className="flex items-center justify-between gap-2 font-medium">
                      {item.label}
                      {item.essential ? <Badge variant="secondary">essential</Badge> : <Badge variant="outline">optional</Badge>}
                    </span>
                    <span className="text-muted-foreground">{item.reason}</span>
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <div className="flex items-start gap-3">
                <CheckCircle2 aria-hidden="true" />
                <div className="flex flex-col gap-1">
                  <CardTitle>Readiness confirmations</CardTitle>
                  <CardDescription>
                    Confirm the planning steps you have actually handled.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {acknowledgementRows.map((row) => (
                <div
                  className="flex items-center justify-between gap-4 rounded-lg border bg-background p-3"
                  key={row.key}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">{row.label}</span>
                    <span className="text-sm text-muted-foreground">{row.description}</span>
                  </div>
                  <Switch
                    checked={acknowledgements[row.key]}
                    onCheckedChange={(checked) => onAcknowledgementChange(row.key, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <SafetyWarnings warnings={plan.safetyWarnings} />

          <Button asChild>
            <Link to={`/tracking?trail=${plan.trail.slug}`}>
              <Sun data-icon="inline-start" />
              Start this hike
            </Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}

export function ReadinessScore({ score }: { score: number }) {
  const low = score < 60

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">Trail readiness: {score}%</span>
        <Badge variant={low ? 'destructive' : 'secondary'}>{low ? 'needs work' : 'ready'}</Badge>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn('h-full rounded-full', low ? 'bg-destructive' : 'bg-primary')}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

export function SafetyWarnings({ warnings }: { warnings: string[] }) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <div className="flex items-start gap-3">
          <AlertTriangle aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <CardTitle>Safety warnings</CardTitle>
            <CardDescription>
              Check official park guidance before relying on app recommendations.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {warnings.length > 0 ? (
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            {warnings.map((warning) => (
              <li className="rounded-lg border bg-background p-3" key={warning}>
                {warning}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No major preparation warnings from the mock provider.</p>
        )}
      </CardContent>
    </Card>
  )
}

function RecommendationCard({
  icon: Icon,
  title,
  description,
  items,
}: {
  icon: typeof CloudSun
  title: string
  description: string
  items: string[]
}) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <div className="flex items-start gap-3">
          <Icon aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}
