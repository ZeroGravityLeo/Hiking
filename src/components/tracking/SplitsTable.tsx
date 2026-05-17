import { Timer } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { formatPace, type Split } from '@/lib/tracking'

export function SplitsTable({ splits }: { splits: Split[] }) {
  if (splits.length === 0) {
    return null
  }

  const validPaces = splits
    .map((split) => split.paceMinPerKm)
    .filter((pace) => Number.isFinite(pace) && pace > 0)
  const bestPace = validPaces.length > 0 ? Math.min(...validPaces) : null

  return (
    <section className="wa-section">
      <div className="mb-4 flex items-center gap-2">
        <Timer className="size-5 text-primary" aria-hidden="true" />
        <h2 className="text-lg font-semibold leading-tight">Km splits</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <tbody className="divide-y divide-border">
            {splits.map((split) => {
              const isBest = bestPace !== null && split.paceMinPerKm === bestPace

              return (
                <tr key={split.kilometer}>
                  <td className="py-3 pr-3 font-bold">km {split.kilometer}</td>
                  <td className="px-3 py-3 text-right font-medium">
                    {formatPace(split.paceMinPerKm)}/km
                  </td>
                  <td className="px-3 py-3 text-right text-muted-foreground">
                    +{split.elevationGainM.toFixed(0)}m
                  </td>
                  <td className="py-3 pl-3 text-right">
                    {isBest ? (
                      <Badge className="bg-success text-success-foreground">★ Best</Badge>
                    ) : null}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
