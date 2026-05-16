import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Download, FileDown, FileUp, Printer, Route, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { MetricCard } from '@/components/common/MetricCard'
import { PageHeader } from '@/components/common/PageHeader'
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
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { useAuth } from '@/hooks/useAuth'
import {
  deleteImportedRoute,
  downloadTextFile,
  listImportedRoutes,
  parseGpxFile,
  printRouteToPdf,
  routeToGpx,
  routeToKml,
  saveImportedRoute,
  saveImportedRouteAsActivity,
  type ImportedRoute,
  type ParsedRouteFile,
} from '@/lib/route-files'

export function ImportExportPage() {
  const { user } = useAuth()
  const [parsedRoute, setParsedRoute] = useState<ParsedRouteFile | null>(null)
  const [routes, setRoutes] = useState<ImportedRoute[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loadingFile, setLoadingFile] = useState(false)

  useEffect(() => {
    setRoutes(listImportedRoutes())
  }, [])

  const refreshRoutes = () => setRoutes(listImportedRoutes())

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.currentTarget.value = ''
    if (!file) {
      return
    }

    setLoadingFile(true)
    setError(null)
    try {
      if (!file.name.toLowerCase().endsWith('.gpx')) {
        throw new Error('Only GPX files are supported in this Sprint 6 importer.')
      }

      const text = await file.text()
      const route = parseGpxFile(text, file.name.replace(/\\.gpx$/i, ''))
      setParsedRoute(route)
      toast.success('GPX route imported.')
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Could not import GPX file.'
      setError(message)
      toast.error(message)
    } finally {
      setLoadingFile(false)
    }
  }

  const saveAsRoute = () => {
    if (!parsedRoute) {
      return
    }
    saveImportedRoute(parsedRoute)
    refreshRoutes()
    toast.success('Imported GPX saved as a local route.')
  }

  const saveAsActivity = () => {
    if (!parsedRoute) {
      return
    }
    const activity = saveImportedRouteAsActivity(parsedRoute, user?.id ?? 'local-demo-user')
    toast.success(`${activity.title} saved to local activity history.`)
  }

  const deleteRoute = (routeId: string) => {
    deleteImportedRoute(routeId)
    refreshRoutes()
    toast.message('Imported route removed.')
  }

  return (
    <main className="wa-page">
      <PageHeader
        description="Import GPX routes, preview them on the map, save them locally, and export activity routes for other tools."
        eyebrow="Route files"
        title="Import / export"
      />

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle>Import GPX</CardTitle>
              <CardDescription>
                Upload a GPX track or route file to preview, validate, and save it.
              </CardDescription>
            </div>
            <Badge variant="secondary">GPX</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button asChild variant="outline">
            <label className="cursor-pointer">
              <FileUp data-icon="inline-start" />
              {loadingFile ? 'Reading GPX...' : 'Choose GPX file'}
              <input accept=".gpx,application/gpx+xml,text/xml" className="sr-only" onChange={importFile} type="file" />
            </label>
          </Button>
          {error ? <ErrorState message={error} /> : null}
          <div className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">
            Invalid GPX/KML files show a helpful error. KML import is planned after GPX parsing stabilizes.
          </div>
        </CardContent>
      </Card>

      {parsedRoute ? (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <CardTitle>{parsedRoute.name}</CardTitle>
                <CardDescription>Imported GPX preview route</CardDescription>
              </div>
              <Badge variant="secondary">{parsedRoute.points.length} points</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-2">
              <MetricCard label="Distance" value={`${parsedRoute.distanceKm.toFixed(2)} km`} />
              <MetricCard label="Gain" value={`${parsedRoute.elevationGainM} m`} />
              <MetricCard label="Source" value="GPX" />
            </div>
            <RoutePreviewMap className="h-72" points={parsedRoute.points} trail={null} />
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={saveAsRoute}>
                <Route data-icon="inline-start" />
                Save as route
              </Button>
              <Button onClick={saveAsActivity} variant="outline">
                Save as activity
              </Button>
              <Button
                onClick={() =>
                  downloadTextFile(`${parsedRoute.name}.gpx`, routeToGpx(parsedRoute), 'application/gpx+xml')
                }
                variant="outline"
              >
                <FileDown data-icon="inline-start" />
                Export GPX
              </Button>
              <Button
                onClick={() =>
                  downloadTextFile(`${parsedRoute.name}.kml`, routeToKml(parsedRoute), 'application/vnd.google-earth.kml+xml')
                }
                variant="outline"
              >
                <Download data-icon="inline-start" />
                Export KML
              </Button>
              <Button className="col-span-2" onClick={() => printRouteToPdf(parsedRoute)} variant="outline">
                <Printer data-icon="inline-start" />
                Print route PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle>Saved imported routes</CardTitle>
              <CardDescription>Local route library foundation for future GPX, KML, Strava, and Garmin workflows.</CardDescription>
            </div>
            <Badge variant="secondary">{routes.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {routes.length === 0 ? (
            <EmptyState
              description="Import a GPX file and save it as a route to build your local route library."
              title="No imported routes yet"
            />
          ) : null}
          {routes.map((route) => (
            <div className="flex flex-col gap-3 rounded-lg border bg-background p-3" key={route.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{route.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {route.distanceKm.toFixed(2)} km · {route.elevationGainM} m gain · {route.points.length} points
                  </span>
                </div>
                <Badge variant="outline">{route.source.toUpperCase()}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() =>
                    downloadTextFile(`${route.name}.gpx`, routeToGpx(route), 'application/gpx+xml')
                  }
                  size="sm"
                  variant="outline"
                >
                  GPX
                </Button>
                <Button
                  onClick={() =>
                    downloadTextFile(`${route.name}.kml`, routeToKml(route), 'application/vnd.google-earth.kml+xml')
                  }
                  size="sm"
                  variant="outline"
                >
                  KML
                </Button>
                <Button onClick={() => printRouteToPdf(route)} size="sm" variant="outline">
                  Print
                </Button>
                <Button onClick={() => deleteRoute(route.id)} size="sm" variant="outline">
                  <Trash2 data-icon="inline-start" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  )
}
