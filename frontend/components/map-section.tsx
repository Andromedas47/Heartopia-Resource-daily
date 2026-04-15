import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Map, Compass, Gem, Trees, MapPin } from "lucide-react"

interface MapMarker {
  id: string
  name: string
  x: number
  y: number
  type: "oak" | "glowstone" | "unknown"
}

interface MapSectionProps {
  markers: MapMarker[]
  missingLocationNames: string[]
  mapImageSrc: string
}

function markerVisual(type: MapMarker["type"]) {
  if (type === "oak") return { icon: Trees, color: "bg-primary" }
  if (type === "glowstone") return { icon: Gem, color: "bg-chart-3" }
  return { icon: MapPin, color: "bg-chart-4" }
}

export function MapSection({ markers, missingLocationNames, mapImageSrc }: MapSectionProps) {
  return (
    <Card className="overflow-hidden border-border/50 shadow-sm">
      <CardHeader className="pb-2 sm:pb-3 bg-gradient-to-r from-chart-3/10 to-transparent px-3 sm:px-6 py-3 sm:py-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg" style={{ fontFamily: 'var(--font-display)' }}>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-chart-3/20 flex items-center justify-center shrink-0">
            <Map className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-chart-3" />
          </div>
          World Map
          <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground ml-auto shrink-0" />
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 py-3 sm:py-6">
        <div className="relative aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-chart-3/10 border border-border/30">
          <Image
            src={mapImageSrc}
            alt="Heartopia map"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 1200px"
            className="object-cover opacity-20"
          />

          {/* Map Background Pattern */}
          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-4 left-4 w-20 h-20 rounded-full bg-primary/10 blur-xl" />
          <div className="absolute bottom-8 right-8 w-32 h-32 rounded-full bg-chart-3/10 blur-xl" />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full bg-accent/10 blur-xl" />

          {/* Map Locations */}
          {markers.map((location) => {
            const visual = markerVisual(location.type)
            const Icon = visual.icon
            return (
              <div
                key={location.id}
                className="absolute group cursor-pointer"
                style={{ left: `${location.x}%`, top: `${location.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                <div className={`relative w-8 h-8 sm:w-10 sm:h-10 ${visual.color} rounded-xl shadow-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  {/* Pulse animation */}
                  <div className={`absolute inset-0 ${visual.color} rounded-xl animate-ping opacity-20`} />
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 sm:mt-2 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-card text-foreground text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-md border border-border/50">
                  {location.name}
                </div>
              </div>
            )
          })}

          {/* Map Legend */}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            {markers.slice(0, 8).map((location) => {
              const visual = markerVisual(location.type)
              const Icon = visual.icon
              return (
                <div
                  key={`${location.id}-legend`}
                  className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-card/90 backdrop-blur-sm text-xs text-foreground border border-border/30"
                >
                  <div className={`w-3 h-3 sm:w-4 sm:h-4 ${visual.color} rounded flex items-center justify-center shrink-0`}>
                    <Icon className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                  </div>
                  <span className="hidden max-w-36 truncate sm:inline text-xs">{location.name}</span>
                </div>
              )
            })}
          </div>
        </div>

        {missingLocationNames.length > 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-border bg-muted/40 p-2 text-xs text-muted-foreground">
            {missingLocationNames.length} locations are awaiting coordinate mapping.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
