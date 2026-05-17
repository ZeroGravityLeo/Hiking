import { useEffect, useMemo, useState } from 'react'

import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-state'
import { useAuth } from '@/hooks/useAuth'
import { fetchCollectedAnimals, fetchWildlifeSpecies } from '@/lib/mvp-api'
import type { CollectedAnimal, WildlifeSpecies } from '@/lib/types'

const WILDLIFE_HINTS = [
  'Found near Banff',
  'Lives in mountain lakes',
  'Spotted at dawn',
  'Roams Jasper valleys',
  'Seen near rivers',
]

const COLLECTION_TIERS = [
  { key: 'common', label: 'Common', barClassName: 'bg-success' },
  { key: 'rare', label: 'Rare', barClassName: 'bg-warning' },
  { key: 'epic', label: 'Epic', barClassName: 'bg-gold' },
] as const

type CollectionTierKey = (typeof COLLECTION_TIERS)[number]['key']

function getCollectionTier(rarity: string): CollectionTierKey | null {
  const normalized = rarity.toLowerCase()

  if (normalized === 'common') {
    return 'common'
  }
  if (normalized === 'rare' || normalized === 'uncommon') {
    return 'rare'
  }
  if (normalized === 'epic' || normalized === 'legendary') {
    return 'epic'
  }

  return null
}

export function WildlifePage() {
  const { user } = useAuth()
  const [species, setSpecies] = useState<WildlifeSpecies[]>([])
  const [collected, setCollected] = useState<CollectedAnimal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    Promise.all([fetchWildlifeSpecies(), fetchCollectedAnimals(user?.id)])
      .then(([nextSpecies, nextCollected]) => {
        if (mounted) {
          setSpecies(nextSpecies)
          setCollected(nextCollected)
        }
      })
      .catch((caught: unknown) => {
        if (mounted) {
          setError(caught instanceof Error ? caught.message : 'Could not load wildlife.')
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [user?.id])

  const collectedSpecies = useMemo(
    () => new Set(collected.map((animal) => animal.species_id)),
    [collected],
  )

  const collectionProgress = useMemo(
    () =>
      COLLECTION_TIERS.map((tier) => {
        const tierSpecies = species.filter((animal) => getCollectionTier(animal.rarity) === tier.key)
        const found = tierSpecies.filter((animal) => collectedSpecies.has(animal.id)).length
        const total = tierSpecies.length
        const percent = total > 0 ? Math.round((found / total) * 100) : 0

        return {
          ...tier,
          found,
          percent,
          total,
        }
      }),
    [collectedSpecies, species],
  )

  return (
    <main className="wa-page">
      <PageHeader
        description="A collection-ready wildlife guide with safety tips and kids facts."
        eyebrow="Wildlife"
        title="Alberta animal collection"
      />

      {loading ? <LoadingState label="Loading wildlife..." /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && species.length === 0 ? (
        <EmptyState description="Seed wildlife species to start the collection guide." title="No wildlife yet" />
      ) : null}

      {species.length > 0 ? (
        <section className="grid grid-cols-3 gap-2" aria-label="Wildlife collection progress">
          {collectionProgress.map((tier) => (
            <div className="rounded-lg border bg-card p-3 shadow-soft" key={tier.key}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold">{tier.label}</span>
                <span className="text-[0.7rem] font-medium text-muted-foreground">
                  {tier.found}/{tier.total}
                </span>
              </div>
              <div
                aria-label={`${tier.label}: ${tier.found} found of ${tier.total}`}
                aria-valuemax={tier.total}
                aria-valuemin={0}
                aria-valuenow={tier.found}
                className="h-2 overflow-hidden rounded-full bg-muted"
                role="progressbar"
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ${tier.barClassName}`}
                  style={{ width: `${tier.percent}%` }}
                />
              </div>
            </div>
          ))}
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        {species.map((animal, index) => {
          const isCollected = collectedSpecies.has(animal.id)

          return (
            <Card className={isCollected ? 'ring-1 ring-success/40' : undefined} key={animal.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <CardTitle>{isCollected ? animal.name : 'Mystery wildlife'}</CardTitle>
                    <CardDescription>{isCollected ? animal.category : animal.rarity}</CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={isCollected ? 'default' : 'secondary'}>
                      {isCollected ? 'collected' : animal.rarity}
                    </Badge>
                    <Badge variant={animal.danger_level.includes('high') ? 'destructive' : 'outline'}>
                      {animal.danger_level}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                {isCollected ? (
                  <>
                    <p className="text-muted-foreground">{animal.description}</p>
                    <div className="rounded-lg border bg-background p-3">
                      <p className="font-medium">Safety</p>
                      <p className="mt-1 text-muted-foreground">{animal.safety_tips}</p>
                    </div>
                    <div className="rounded-lg border bg-background p-3">
                      <p className="font-medium">Kids fact</p>
                      <p className="mt-1 text-muted-foreground">{animal.kids_fact}</p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 rounded-lg border bg-background p-5 text-center">
                    {animal.image_url ? (
                      <img
                        alt="Uncollected wildlife silhouette"
                        className="h-28 w-28 rounded-full object-cover grayscale brightness-0 opacity-40"
                        src={animal.image_url}
                      />
                    ) : (
                      <span aria-hidden="true" className="text-5xl text-muted-foreground/50">
                        🐾
                      </span>
                    )}
                    <p className="text-xs font-medium text-muted-foreground">
                      {WILDLIFE_HINTS[index % WILDLIFE_HINTS.length]}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </section>
    </main>
  )
}
