import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface GeolocationConsentDialogProps {
  open: boolean
  onAccept: () => Promise<void>
  onDecline: () => Promise<void>
}

export function GeolocationConsentDialog({
  open,
  onAccept,
  onDecline,
}: GeolocationConsentDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Allow GPS tracking?</DialogTitle>
          <DialogDescription>
            Wild Alberta needs explicit geolocation consent before recording hikes. Your route
            points are used for distance, pace, elevation, safety status, and rewards.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="w-full" onClick={onAccept}>
            Allow tracking
          </Button>
          <Button className="w-full" onClick={onDecline} variant="outline">
            Not now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
