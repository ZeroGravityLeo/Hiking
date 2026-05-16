import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  CloudSun,
  Flame,
  Heart,
  MapPinned,
  MessageCircle,
  Route,
  Send,
  Timer,
  Trash2,
  Trophy,
} from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import {
  addFeedComment,
  deleteFeedComment,
  formatActivityDate,
  getFeedComments,
  isFeedLiked,
  toggleFeedLike,
} from '@/lib/community'
import { formatDuration } from '@/lib/tracking'
import type { FeedComment, FeedItem } from '@/lib/types'

export function FeedPostCard({ item }: { item: FeedItem }) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(() => isFeedLiked(item.id))
  const [likesCount, setLikesCount] = useState(item.metadata.likes_count ?? 0)
  const [comments, setComments] = useState<FeedComment[]>(() => getFeedComments(item.id))
  const [commentBody, setCommentBody] = useState('')

  useEffect(() => {
    setLiked(isFeedLiked(item.id))
    setLikesCount(item.metadata.likes_count ?? 0)
    setComments(getFeedComments(item.id))
  }, [item])

  const initials = useMemo(() => {
    const name = item.metadata.display_name ?? 'Explorer'
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [item.metadata.display_name])

  const coverPhoto = item.metadata.cover_photo_url ?? item.metadata.photos?.[0]?.url ?? null
  const trailHref = item.metadata.trail_slug ? `/trails/${item.metadata.trail_slug}` : '/explore'

  const onToggleLike = () => {
    const nextLiked = toggleFeedLike(item.id)
    setLiked(nextLiked)
    setLikesCount((current) => Math.max(0, current + (nextLiked ? 1 : -1)))
  }

  const onSubmitComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = commentBody.trim()
    if (!trimmed) {
      return
    }

    const comment = addFeedComment(
      item.id,
      trimmed,
      user?.id,
      user?.user_metadata?.name as string | undefined,
    )
    setComments((current) => [comment, ...current])
    setCommentBody('')
    toast.success('Comment added.')
  }

  const onDeleteComment = (commentId: string) => {
    deleteFeedComment(commentId, user?.id)
    setComments((current) => current.filter((comment) => comment.id !== commentId))
    toast.message('Comment deleted.')
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-soft">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate">{item.metadata.display_name ?? 'Explorer'}</CardTitle>
              <CardDescription>
                <Link to={trailHref}>{item.metadata.trail_name ?? 'Free hike'}</Link> · {formatActivityDate(item.created_at)}
              </CardDescription>
            </div>
          </div>
          {item.metadata.difficulty ? (
            <Badge variant="secondary">{item.metadata.difficulty}</Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <p className="text-lg font-bold leading-tight">{item.title}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
        </div>

        {coverPhoto ? (
          <img
            alt={`${item.title} cover`}
            className="h-56 w-full rounded-2xl border object-cover shadow-soft"
            src={coverPhoto}
          />
        ) : item.metadata.route_preview ? (
          <FeedRouteVisual />
        ) : null}

        {item.metadata.route_preview ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border bg-background/75 p-3 text-sm">
            <span className="flex items-center gap-2 font-medium">
              <MapPinned aria-hidden="true" />
              Route preview
            </span>
            <span className="text-muted-foreground">Saved with activity</span>
          </div>
        ) : null}

        <div className="grid grid-cols-3 gap-2 text-sm">
          <FeedMetric icon={Route} label="Distance" value={`${(item.metadata.distance_km ?? 0).toFixed(2)} km`} />
          <FeedMetric icon={Timer} label="Duration" value={formatDuration(item.metadata.duration_seconds ?? 0)} />
          <FeedMetric icon={Flame} label="Calories" value={`${item.metadata.calories ?? 0}`} />
        </div>

        <div className="flex flex-wrap gap-2">
          {typeof item.metadata.readiness_score === 'number' ? (
            <Badge variant={item.metadata.readiness_score < 60 ? 'destructive' : 'secondary'}>
              <Activity aria-hidden="true" />
              {item.metadata.readiness_score}% ready
            </Badge>
          ) : null}
          {item.metadata.weather_summary ? (
            <Badge variant="outline">
              <CloudSun aria-hidden="true" />
              {item.metadata.weather_summary}
            </Badge>
          ) : null}
          {item.metadata.route_preview ? (
            <Badge variant="outline">
              <MapPinned aria-hidden="true" />
              route preview
            </Badge>
          ) : null}
          {item.metadata.points_earned ? (
            <Badge className="bg-gold text-gold-foreground">
              <Trophy aria-hidden="true" />+{item.metadata.points_earned} points
            </Badge>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={onToggleLike} variant={liked ? 'secondary' : 'outline'}>
            <Heart data-icon="inline-start" />
            {likesCount} like{likesCount === 1 ? '' : 's'}
          </Button>
          <Badge className="justify-center" variant="outline">
            <MessageCircle aria-hidden="true" />
            {comments.length} comment{comments.length === 1 ? '' : 's'}
          </Badge>
        </div>

        <form className="flex gap-2" onSubmit={onSubmitComment}>
          <Input
            aria-label="Add a comment"
            onChange={(event) => setCommentBody(event.target.value)}
            placeholder="Add a comment"
            value={commentBody}
          />
          <Button size="icon" type="submit">
            <Send />
            <span className="sr-only">Post comment</span>
          </Button>
        </form>

        {comments.length > 0 ? (
          <div className="flex flex-col gap-2">
            {comments.slice(0, 4).map((comment) => (
              <div className="rounded-2xl border bg-background/75 p-3 text-sm" key={comment.id}>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="font-medium">{comment.user_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatActivityDate(comment.created_at)}
                  </span>
                </div>
                <p className="text-muted-foreground">{comment.body}</p>
                {(user?.id ?? 'local-demo-user') === comment.user_id ? (
                  <Button
                    className="mt-2"
                    onClick={() => onDeleteComment(comment.id)}
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 data-icon="inline-start" />
                    Delete
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function FeedMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Route
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border bg-background/75 p-3">
      <p className="flex items-center gap-1 text-xs font-semibold uppercase text-muted-foreground">
        <Icon aria-hidden="true" />
        {label}
      </p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  )
}

function FeedRouteVisual() {
  return (
    <div className="relative h-56 overflow-hidden rounded-2xl border bg-secondary/20 shadow-soft">
      <div className="absolute inset-0 opacity-80 [background-image:linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px),linear-gradient(180deg,hsl(var(--border))_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute left-10 top-10 h-36 w-64 rotate-[-20deg] rounded-full border-[5px] border-primary" />
      <div className="absolute left-16 top-24 h-20 w-44 rotate-[14deg] rounded-full border-[5px] border-gold" />
      <span className="absolute left-12 top-12 size-4 rounded-full bg-primary ring-4 ring-card" />
      <span className="absolute bottom-11 right-12 size-4 rounded-full bg-gold ring-4 ring-card" />
      <Badge className="absolute bottom-3 left-3 bg-card/95 text-foreground" variant="outline">
        recorded route
      </Badge>
    </div>
  )
}
