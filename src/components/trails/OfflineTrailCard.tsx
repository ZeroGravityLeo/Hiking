import { Download, MapPinned, Share2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  buildOfflineTrailSnapshot,
  buildTripPlan,
  buildTripPlanText,
  getOfflineTrailState,
  removeOfflineTrail,
  saveOfflineTrail,
  saveTripPlan,
  shareOrCopyText,
} from '@/lib/trail-navigation'
import type { HikePreparationPlan } from '@/lib/hike-preparation'
import type { ChecklistItemState, Trail } from '@/lib/types'

export function OfflineTrailCard({
  checklistState,
  onOfflineStateChange,
  plan,
  trail,
}: {
  checklistState: ChecklistItemState[]
  onOfflineStateChange: () => void
  plan: HikePreparationPlan | null
  trail: Trail
}) {
  const offlineState = getOfflineTrailState(trail.slug)

  const downloadTrail = () => {
    saveOfflineTrail(buildOfflineTrailSnapshot({ trail, plan, checklistState }))
    onOfflineStateChange()
    toast.success(`${trail.name} is available offline.`)
  }

  const removeTrail = () => {
    removeOfflineTrail(trail.slug)
    onOfflineStateChange()
    toast.message('Offline trail removed.')
  }

  const shareTripPlan = async () => {
    const tripPlan = buildTripPlan(trail)
    saveTripPlan(tripPlan)
    const outcome = await shareOrCopyText(buildTripPlanText(tripPlan))
    toast.success(outcome === 'shared' ? 'Trip plan shared.' : 'Trip plan copied.')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Offline trail</CardTitle>
            <CardDescription>
              Save route, hazards, prep, checklist, and emergency info for weak-signal hikes.
            </CardDescription>
          </div>
          <Badge variant={offlineState.snapshot ? 'secondary' : 'outline'}>
            {offlineState.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">
          Trail route and key info are available offline. Full map tiles may require future
          offline tile support.
        </div>
        <div className="rounded-lg border bg-background p-3 text-sm">
          <p className="flex items-center gap-2 font-medium">
            <MapPinned aria-hidden="true" />
            Offline map tile architecture
          </p>
          <p className="mt-1 text-muted-foreground">
            Prepared for Mapbox offline packs, MapLibre tile caching, PMTiles, MBTiles, or a
            custom tile server.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={downloadTrail}>
            <Download data-icon="inline-start" />
            {offlineState.updateAvailable ? 'Update offline trail' : 'Download trail for offline use'}
          </Button>
          <Button onClick={shareTripPlan} variant="outline">
            <Share2 data-icon="inline-start" />
            Share trip plan
          </Button>
          {offlineState.snapshot ? (
            <Button className="col-span-2" onClick={removeTrail} variant="outline">
              <Trash2 data-icon="inline-start" />
              Remove offline trail
            </Button>
          ) : null}
        </div>
        {offlineState.snapshot ? (
          <div className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">
            Available offline · downloaded {new Date(offlineState.snapshot.downloadedAt).toLocaleString()}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
