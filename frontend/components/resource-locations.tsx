import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Gem, Trees, Fish, Flower2 } from "lucide-react"

interface ResourceItem {
  name: string
  type: "oak" | "glowstone" | "unknown"
  source: "database" | "fallback" | "missing"
  mappedBy?: string
}

interface ResourceLocationsProps {
  items: ResourceItem[]
}

function locationStyle(type: ResourceItem["type"]) {
  if (type === "oak") {
    return { icon: Trees, color: "text-primary", bgColor: "bg-primary/20", label: "Oak" }
  }

  if (type === "glowstone") {
    return { icon: Gem, color: "text-chart-3", bgColor: "bg-chart-3/20", label: "Glowstone" }
  }

  return { icon: Flower2, color: "text-chart-4", bgColor: "bg-chart-4/20", label: "Unknown" }
}

export function ResourceLocations({ items }: ResourceLocationsProps) {
  return (
    <Card className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 sm:pb-3 bg-gradient-to-r from-primary/10 to-transparent px-3 sm:px-6 py-3 sm:py-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg" style={{ fontFamily: 'var(--font-display)' }}>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          </div>
          Resource Locations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5 sm:space-y-3 px-3 sm:px-6 py-3 sm:py-6">
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/50 p-3 text-sm text-muted-foreground">
            No locations available in the latest report.
          </p>
        ) : null}

        {items.map((resource) => {
          const style = locationStyle(resource.type)
          const Icon = style.icon

          return (
            <div
              key={resource.name}
              className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group active:scale-95 sm:active:scale-100"
            >
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${style.bgColor} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${style.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-xs sm:text-sm">{resource.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {style.label}
                  {resource.mappedBy ? ` • mapped by ${resource.mappedBy}` : ""}
                  {resource.source === "fallback" ? " • fallback" : ""}
                  {resource.source === "missing" ? " • awaiting mapping" : ""}
                </p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
