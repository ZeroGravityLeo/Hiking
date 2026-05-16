import { Loader2 } from 'lucide-react'

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card p-4 text-sm text-muted-foreground shadow-soft">
      <Loader2 aria-hidden="true" className="animate-spin" />
      {label}
    </div>
  )
}
