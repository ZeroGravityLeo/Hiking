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

      <section className="flex flex-col gap-3">
        {species.map((animal) => {
          const isCollected = collectedSpecies.has(animal.id)

          return (
            <Card key={animal.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <CardTitle>{animal.name}</CardTitle>
                    <CardDescription>{animal.category}</CardDescription>
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
                <p className="text-muted-foreground">{animal.description}</p>
                <div className="rounded-lg border bg-background p-3">
                  <p className="font-medium">Safety</p>
                  <p className="mt-1 text-muted-foreground">{animal.safety_tips}</p>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <p className="font-medium">Kids fact</p>
                  <p className="mt-1 text-muted-foreground">{animal.kids_fact}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>
    </main>
  )
}
