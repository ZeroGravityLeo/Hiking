import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Camera, MessageSquareText, Star } from 'lucide-react'
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
import { EmptyState } from '@/components/ui/empty-state'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
import {
  formatActivityDate,
  getTrailCommunityPhotos,
  getTrailReviews,
  saveTrailReview,
} from '@/lib/community'
import type { CommunityPhoto, Trail, TrailCondition, TrailReview } from '@/lib/types'
import { cn } from '@/lib/utils'

const TRAIL_CONDITIONS: TrailCondition[] = [
  'Dry',
  'Muddy',
  'Snowy',
  'Icy',
  'Closed section',
  'Bear activity',
  'Busy',
  'Quiet',
]

export function CommunityPhotosSection({ trail }: { trail: Trail }) {
  const [photos, setPhotos] = useState<CommunityPhoto[]>([])

  useEffect(() => {
    setPhotos(getTrailCommunityPhotos(trail))
  }, [trail])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Community photos</CardTitle>
            <CardDescription>Public photos shared from completed hikes on this trail.</CardDescription>
          </div>
          <Badge variant="secondary">{photos.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {photos.length === 0 ? (
          <EmptyState
            description="Share a completed hike with photos to populate this trail gallery."
            title="No community photos yet"
          />
        ) : null}
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {photos.map((photo) => (
              <div className="overflow-hidden rounded-lg border bg-background" key={photo.id}>
                <img
                  alt={photo.caption ?? `${trail.name} community photo`}
                  className="h-36 w-full object-cover"
                  src={photo.image_url}
                />
                <div className="flex flex-col gap-2 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{photo.user_name}</span>
                    <Badge variant="outline">{photo.likes_count} likes</Badge>
                  </div>
                  <span className="text-muted-foreground">{formatActivityDate(photo.created_at)}</span>
                  {photo.activity_id ? (
                    <Badge className="w-fit" variant="secondary">
                      <Camera aria-hidden="true" />
                      activity linked
                    </Badge>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function TrailReviewsSection({ trail }: { trail: Trail }) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<TrailReview[]>([])
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [condition, setCondition] = useState<TrailCondition>('Dry')
  const [wouldRecommend, setWouldRecommend] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setReviews(getTrailReviews(trail))
  }, [trail])

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) {
      toast.error('Add a short review before submitting.')
      return
    }

    setSaving(true)
    try {
      const review = saveTrailReview({
        trail,
        userId: user?.id,
        userName: (user?.user_metadata?.name as string | undefined) ?? undefined,
        rating,
        body: trimmed,
        condition,
        wouldRecommend,
      })
      setReviews((current) => [review, ...current])
      setBody('')
      toast.success('Trail review added.')
    } finally {
      setSaving(false)
    }
  }

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
      : null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Trail reviews</CardTitle>
            <CardDescription>Community trail conditions, ratings, and recommendations.</CardDescription>
          </div>
          <Badge variant={averageRating ? 'secondary' : 'outline'}>
            {averageRating ? `${averageRating.toFixed(1)} stars` : 'new'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form className="flex flex-col gap-3" onSubmit={onSubmit}>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Rating</span>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <Button
                  className={cn(value === rating && 'bg-secondary text-secondary-foreground')}
                  key={value}
                  onClick={() => setRating(value)}
                  size="sm"
                  type="button"
                  variant={value === rating ? 'secondary' : 'outline'}
                >
                  <Star data-icon="inline-start" />
                  {value}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Trail condition</span>
            <div className="grid grid-cols-2 gap-2">
              {TRAIL_CONDITIONS.map((option) => (
                <Button
                  key={option}
                  onClick={() => setCondition(option)}
                  size="sm"
                  type="button"
                  variant={option === condition ? 'secondary' : 'outline'}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>

          <Textarea
            aria-label="Trail review"
            onChange={(event) => setBody(event.target.value)}
            placeholder="How were the conditions?"
            value={body}
          />

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => setWouldRecommend(true)}
              type="button"
              variant={wouldRecommend ? 'secondary' : 'outline'}
            >
              Recommend
            </Button>
            <Button
              onClick={() => setWouldRecommend(false)}
              type="button"
              variant={!wouldRecommend ? 'secondary' : 'outline'}
            >
              Would skip
            </Button>
          </div>

          <Button disabled={saving} type="submit">
            <MessageSquareText data-icon="inline-start" />
            {saving ? 'Submitting...' : 'Submit review'}
          </Button>
        </form>

        {reviews.length === 0 ? (
          <EmptyState
            description="Be the first to leave a trail condition report."
            title="No reviews yet"
          />
        ) : null}

        {reviews.length > 0 ? (
          <div className="flex flex-col gap-3">
            {reviews.map((review) => (
              <div className="rounded-lg border bg-background p-3" key={review.id}>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{review.user_name}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatActivityDate(review.created_at)}
                    </span>
                  </div>
                  <Badge variant="secondary">{review.rating}/5</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{review.body}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline">{review.condition}</Badge>
                  <Badge variant={review.would_recommend ? 'secondary' : 'outline'}>
                    {review.would_recommend ? 'recommended' : 'would skip'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
