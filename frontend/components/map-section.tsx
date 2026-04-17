"use client"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Compass, Gem, Map, MapPin, Trees } from "lucide-react"

interface MapMarker {
  id: string
  name: string
  x: number
  y: number
  type: "oak" | "glowstone" | "unknown"
}

interface MapSectionProps {
  id?: string
  markers: MapMarker[]
  missingLocationNames: string[]
  mapImageSrc: string
}

function markerVisual(type: MapMarker["type"]) {
  if (type === "oak") return { icon: Trees, color: "bg-primary" }
  if (type === "glowstone") return { icon: Gem, color: "bg-chart-3" }
  return { icon: MapPin, color: "bg-chart-4" }
}

export function MapSection({ id, markers, missingLocationNames, mapImageSrc }: MapSectionProps) {
  const typeCounts = markers.reduce(
    (counts, marker) => {
      counts[marker.type] += 1
      return counts
    },
    { oak: 0, glowstone: 0, unknown: 0 },
  )

  return (
    <Card id={id} className="w-full overflow-hidden border-border/60 bg-card/95 shadow-sm">
      <CardHeader
        className="border-b border-border/50 px-4 py-4 sm:px-6"
        style={{ backgroundImage: "linear-gradient(90deg, color-mix(in oklab, var(--chart-3) 10%, transparent), transparent)" }}
      >
        <div className="flex flex-col gap-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg" style={{ fontFamily: 'var(--font-display)' }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-3/20 text-chart-3 shadow-sm">
              <Map className="h-4 w-4" />
            </div>
            World Map
            <Compass className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
          </CardTitle>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-full px-2.5 py-1">
              {markers.length} markers
            </Badge>
            <Badge variant="outline" className="rounded-full px-2.5 py-1">
              {typeCounts.oak} oak
            </Badge>
            <Badge variant="outline" className="rounded-full px-2.5 py-1">
              {typeCounts.glowstone} glowstone
            </Badge>
            {missingLocationNames.length > 0 ? (
              <Badge variant="destructive" className="rounded-full px-2.5 py-1">
                {missingLocationNames.length} unmapped
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-4 sm:px-6 sm:py-6">
        <div
          className="rounded-[1.75rem] border border-border/60 p-3"
          style={{ backgroundImage: "linear-gradient(135deg, color-mix(in oklab, var(--muted) 25%, transparent), color-mix(in oklab, var(--primary) 5%, transparent))" }}
        >
          <div className="relative mx-auto aspect-square w-full max-w-240 overflow-hidden rounded-3xl bg-sky-100/20">
            <Image
              src={mapImageSrc}
              alt="Heartopia map"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 1000px"
              className="object-contain opacity-100"
            />

            <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(to top, color-mix(in oklab, var(--background) 10%, transparent), transparent)" }} />

            {markers.map((location) => {
              const visual = markerVisual(location.type)
              const Icon = visual.icon
              return (
                <button
                  key={location.id}
                  type="button"
                  className="group absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${location.x}%`, top: `${location.y}%` }}
                  aria-label={location.name}
                >
                  <div className={`relative flex h-6 w-6 items-center justify-center rounded-xl ${visual.color} text-white shadow-sm transition-transform group-hover:scale-110 group-focus-visible:scale-110`}>
                    <Icon className="h-3.5 w-3.5" />
                    <div className={`absolute inset-0 rounded-xl ${visual.color} opacity-5`} />
                  </div>

                  <div className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full border border-border/60 bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    {location.name}
                  </div>
                </button>
              )
            })}

            <div className="absolute inset-x-3 bottom-3 hidden flex-col gap-2 rounded-2xl border border-border/60 bg-card/95 p-2.5 text-xs shadow-sm sm:inset-x-auto sm:bottom-5 sm:left-5 sm:flex sm:flex-row sm:flex-wrap sm:items-center">
              {[
                { label: "Oak", color: "bg-primary", icon: Trees },
                { label: "Glowstone", color: "bg-chart-3", icon: Gem },
                { label: "Unknown", color: "bg-chart-4", icon: MapPin },
              ].map((entry) => {
                const Icon = entry.icon
                return (
                  <div key={entry.label} className="flex items-center gap-1.5 rounded-full border border-border/40 bg-background/70 px-2.5 py-1">
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full ${entry.color} text-white`}>
                      <Icon className="h-2.5 w-2.5" />
                    </span>
                    <span className="text-foreground">{entry.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-border/60 bg-card/95 p-2.5 text-xs shadow-sm sm:hidden">
            {[
              { label: "Oak", color: "bg-primary", icon: Trees },
              { label: "Glowstone", color: "bg-chart-3", icon: Gem },
              { label: "Unknown", color: "bg-chart-4", icon: MapPin },
            ].map((entry) => {
              const Icon = entry.icon
              return (
                <div key={entry.label} className="flex items-center gap-1.5 rounded-full border border-border/40 bg-background/70 px-2.5 py-1">
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full ${entry.color} text-white`}>
                    <Icon className="h-2.5 w-2.5" />
                  </span>
                  <span className="text-foreground">{entry.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {missingLocationNames.length > 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            {missingLocationNames.length} locations are awaiting coordinate mapping.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
