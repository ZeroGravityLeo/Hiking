import { Link } from 'react-router-dom'
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  Lock,
  MapPinned,
  Send,
  Star,
  Trophy,
  User,
  X,
} from 'lucide-react'

import { MetricCard } from '@/components/common/MetricCard'
import { RoutePreviewMap } from '@/components/maps/RoutePreviewMap'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { formatDuration } from '@/lib/tracking'
import type {
  ActivityPhotoAttachment,
  ActivityPoint,
  ActivityPreparationSummary,
  MissionCompletion,
  Trail,
} from '@/lib/types'

export type PostHikeSaveMode = 'private' | 'feed'

export function PostHikeSummaryCard({
  calories,
  caption,
  distanceKm,
  estimatedCalories,
  missionCompletions,
  movingSeconds,
  onAddPhotos,
  onCaptionChange,
  onRemovePhoto,
  onSavePrivate,
  onSetCover,
  onShareToFeed,
  photos,
  points,
  pointsEarned,
  preparationSummary,
  savedMessage,
  savingMode,
  totalSeconds,
  trail,
}: {
  calories: number
  caption: string
  distanceKm: number
  estimatedCalories: ActivityPreparationSummary['estimatedCalories'] | null
  missionCompletions: MissionCompletion[]
  movingSeconds: number
  onAddPhotos: (files: FileList | null) => void
  onCaptionChange: (value: string) => void
  onRemovePhoto: (photoId: string) => void
  onSavePrivate: () => void
  onSetCover: (photoId: string) => void
  onShareToFeed: () => void
  photos: ActivityPhotoAttachment[]
  points: ActivityPoint[]
  pointsEarned: number
  preparationSummary: ActivityPreparationSummary | null
  savedMessage: string | null
  savingMode: PostHikeSaveMode | null
  totalSeconds: number
  trail: Trail | null
}) {
  const readinessScore = preparationSummary?.readinessScore ?? null
  const recommendedWater = preparationSummary?.recommendedWaterLiters
  const coverPhoto = photos.find((photo) => photo.isCover) ?? photos[0]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Hike summary</CardTitle>
            <CardDescription>
              {trail ? trail.name : 'Free hike'} is ready to save privately or share with the trail feed.
            </CardDescription>
          </div>
          <Badge variant={savedMessage ? 'secondary' : 'outline'}>
            {savedMessage ? 'saved' : 'draft'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Distance" value={`${distanceKm.toFixed(2)} km`} />
          <MetricCard label="Moving time" value={formatDuration(movingSeconds)} />
          <MetricCard label="Total time" value={formatDuration(totalSeconds)} />
          <MetricCard label="Calories" value={`${calories}`} />
          <MetricCard
            label="Est. calories"
            value={estimatedCalories ? `${estimatedCalories.min}-${estimatedCalories.max}` : '-'}
          />
          <MetricCard label="Points earned" value={`+${pointsEarned}`} />
        </div>

        <div className="rounded-lg border bg-background p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-sm font-medium">Preparation recap</span>
            {readinessScore === null ? (
              <Badge variant="outline">no prep</Badge>
            ) : (
              <Badge variant={readinessScore < 60 ? 'destructive' : 'secondary'}>
                {readinessScore}% ready
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <SummaryMetric
              label="Water plan"
              value={
                recommendedWater
                  ? `${recommendedWater.min.toFixed(1)}-${recommendedWater.max.toFixed(1)} L`
                  : '-'
              }
            />
            <SummaryMetric label="Weather" value={preparationSummary?.weatherSummary ?? '-'} />
          </div>
          {preparationSummary?.warnings.length ? (
            <div className="mt-3 flex flex-col gap-1 text-sm text-muted-foreground">
              {preparationSummary.warnings.slice(0, 3).map((warning) => (
                <span className="flex items-start gap-2" key={warning}>
                  <Star aria-hidden="true" />
                  {warning}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {missionCompletions.length > 0 ? (
          <div className="rounded-lg border bg-background p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Trophy aria-hidden="true" />
              Completed missions
            </div>
            <div className="flex flex-col gap-2">
              {missionCompletions.map((mission) => (
                <div className="flex items-center justify-between gap-3 text-sm" key={mission.slug}>
                  <span>Mission completed: {mission.title}</span>
                  <Badge variant="secondary">+{mission.points} points</Badge>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {points.length > 1 ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPinned aria-hidden="true" />
              Route preview
            </div>
            <RoutePreviewMap className="h-64" points={points} trail={trail} />
          </div>
        ) : null}

        <div className="flex flex-col gap-3 rounded-lg border bg-background p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">Feed post</span>
              <span className="text-sm text-muted-foreground">
                Add a caption and optional photos before sharing.
              </span>
            </div>
            <Badge variant={photos.length > 0 ? 'secondary' : 'outline'}>
              {photos.length} photo{photos.length === 1 ? '' : 's'}
            </Badge>
          </div>

          <Textarea
            aria-label="Feed post caption"
            onChange={(event) => onCaptionChange(event.target.value)}
            placeholder="How was the trail today?"
            value={caption}
          />

          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline">
              <label className="cursor-pointer">
                <ImagePlus data-icon="inline-start" />
                Add photos
                <input
                  accept="image/*"
                  className="sr-only"
                  multiple
                  onChange={(event) => {
                    onAddPhotos(event.target.files)
                    event.currentTarget.value = ''
                  }}
                  type="file"
                />
              </label>
            </Button>
            {coverPhoto ? (
              <Badge className="justify-center" variant="secondary">
                <Camera aria-hidden="true" />
                Cover ready
              </Badge>
            ) : (
              <Badge className="justify-center" variant="outline">
                no cover
              </Badge>
            )}
          </div>

          {photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {photos.map((photo) => (
                <div className="overflow-hidden rounded-lg border bg-card" key={photo.id}>
                  <img alt={photo.name} className="h-28 w-full object-cover" src={photo.url} />
                  <div className="flex items-center justify-between gap-2 p-2">
                    <Button onClick={() => onSetCover(photo.id)} size="sm" variant="ghost">
                      {photo.isCover ? (
                        <CheckCircle2 data-icon="inline-start" />
                      ) : (
                        <Camera data-icon="inline-start" />
                      )}
                      Cover
                    </Button>
                    <Button onClick={() => onRemovePhoto(photo.id)} size="sm" variant="ghost">
                      <X data-icon="inline-start" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {savedMessage ? (
          <div className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">
            {savedMessage}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <Button disabled={savingMode !== null} onClick={onSavePrivate} variant="outline">
            <Lock data-icon="inline-start" />
            {savingMode === 'private' ? 'Saving...' : 'Save privately'}
          </Button>
          <Button disabled={savingMode !== null} onClick={onShareToFeed}>
            <Send data-icon="inline-start" />
            {savingMode === 'feed' ? 'Sharing...' : 'Share to feed'}
          </Button>
          <Button asChild variant="outline">
            <Link to="/profile">
              <User data-icon="inline-start" />
              View profile
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={trail ? `/trails/${trail.slug}` : '/explore'}>Back to trail</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  )
}
