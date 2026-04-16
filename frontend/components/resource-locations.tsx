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
            <MapPin className="w-5 h-5 text-muted-foreground inline-block mr-2" />
            No resource locations available.
          </p>
        ) : (
          items.map((item, index) => {
            const { icon: Icon, color, bgColor, label } = locationStyle(item.type);
            return (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-xl border border-border ${bgColor}`}
              >
                <Icon className={`w-5 h-5 ${color}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
