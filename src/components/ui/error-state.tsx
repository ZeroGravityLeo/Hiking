import { AlertTriangle } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  message: string
}

export function ErrorState({ title = 'Something needs attention', message }: ErrorStateProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-4 text-sm shadow-soft">
      <AlertTriangle aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
