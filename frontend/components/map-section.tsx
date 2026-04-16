"use client"
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
    <Card className="w-full overflow-hidden border-border/50 shadow-sm">
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
        <div className="rounded-2xl border border-border/30 bg-muted/20 p-2 sm:p-3">
          <div className="relative mx-auto w-full max-w-[960px] aspect-square overflow-hidden rounded-xl bg-sky-100/20">
            <Image
              src={mapImageSrc}
              alt="Heartopia map"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 1000px"
              className="object-contain opacity-100"
            />

            {/* Map Locations */}
            {markers.map((location) => {
              const visual = markerVisual(location.type)
              const Icon = visual.icon
              return (
                <div
                  key={location.id}
                  className="absolute group cursor-pointer"
                  style={{ left: `${location.x}%`, top: `${location.y}%`, transform: 'translate(-50%, -50%)' }}
                  tabIndex={0} // Enable focus for accessibility
                  onFocus={(e) => {
                    const label = e.currentTarget.querySelector<HTMLElement>('.marker-label');
                    if (label) label.style.opacity = '1';
                  }}
                  onBlur={(e) => {
                    const label = e.currentTarget.querySelector<HTMLElement>('.marker-label');
                    if (label) label.style.opacity = '0';
                  }}
                  onClick={(e) => {
                    const label = e.currentTarget.querySelector<HTMLElement>('.marker-label');
                    if (label) label.style.opacity = label.style.opacity === '1' ? '0' : '1';
                  }}
                >
                  <div className={`relative w-8 h-8 sm:w-10 sm:h-10 ${visual.color} rounded-xl shadow-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <div className={`absolute inset-0 ${visual.color} rounded-xl animate-ping opacity-20`} />
                  </div>
                  <div className="marker-label absolute top-full left-1/2 -translate-x-1/2 mt-1 sm:mt-2 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-card text-foreground text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-md border border-border/50">
                    {location.name}
                  </div>
                </div>
              )
            })}

            {/* Map Legend */}
            <div
              className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5 flex flex-wrap gap-2 p-2 sm:p-3 bg-card/80 backdrop-blur-md rounded-lg shadow-md border border-border/30"
              style={{ maxWidth: 'calc(100% - 1rem)' }} // Ensure it fits on small screens
            >
              {markers.slice(0, 8).map((location) => {
                const visual = markerVisual(location.type);
                const Icon = visual.icon;
                return (
                  <div
                    key={`${location.id}-legend`}
                    className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-card text-xs text-foreground border border-border/30"
                  >
                    <div className={`w-3 h-3 sm:w-4 sm:h-4 ${visual.color} rounded flex items-center justify-center shrink-0`}>
                      <Icon className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                    </div>
                    <span className="hidden max-w-36 truncate sm:inline text-xs">{location.name}</span>
                  </div>
                );
              })}
            </div>
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
