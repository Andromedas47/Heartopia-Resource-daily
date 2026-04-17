"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowRight, Copy, Flower2, Gem, MapPin, Search, Trees } from "lucide-react"

interface ResourceItem {
  name: string
  type: "oak" | "glowstone" | "unknown"
  source: "database" | "fallback" | "missing"
  mappedBy?: string
}

interface ResourceLocationsProps {
  items: ResourceItem[]
}

const filterOptions = ["all", "oak", "glowstone", "unknown"] as const

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
  const [query, setQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<(typeof filterOptions)[number]>("all")

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return items.filter((item) => {
      if (activeFilter !== "all" && item.type !== activeFilter) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      return [item.name, item.mappedBy, item.type, item.source].join(" ").toLowerCase().includes(normalizedQuery)
    })
  }, [activeFilter, items, query])

  return (
    <Card className="overflow-hidden border-border/60 bg-card/95 shadow-sm">
      <CardHeader
        className="border-b border-border/50 px-4 py-4 sm:px-6"
        style={{ backgroundImage: "linear-gradient(90deg, color-mix(in oklab, var(--primary) 10%, transparent), transparent)" }}
      >
        <div className="flex flex-col gap-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg" style={{ fontFamily: 'var(--font-display)' }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-sm">
              <MapPin className="h-4 w-4" />
            </div>
            Resource Locations
            <span className="ml-auto rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {filteredItems.length} visible
            </span>
          </CardTitle>

          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search locations, aliases, or source"
                className="h-10 rounded-2xl pl-9"
              />
            </div>

            <div className="grid gap-2 sm:flex sm:flex-wrap">
              {filterOptions.map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={activeFilter === option ? "default" : "outline"}
                  size="sm"
                  className="rounded-2xl capitalize text-xs sm:text-sm"
                  onClick={() => setActiveFilter(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 py-4 sm:px-6 sm:py-6">
        {filteredItems.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            No locations match your search or filter.
          </p>
        ) : (
          filteredItems.map((item) => {
            const { icon: Icon, color, bgColor, label } = locationStyle(item.type)
            return (
              <article
                key={`${item.name}-${item.type}`}
                className="group flex flex-col gap-3 rounded-3xl border border-border/60 p-4 shadow-sm transition-all hover:-translate-y-0.5 sm:flex-row sm:items-center"
                style={{ backgroundImage: "linear-gradient(135deg, color-mix(in oklab, var(--card) 90%, white 10%), color-mix(in oklab, var(--muted) 40%, transparent))" }}
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${bgColor} ${color} shadow-sm`}>
                  <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground sm:text-base">{item.name}</p>
                    <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.16em]">
                      {label}
                    </Badge>
                    <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.16em]">
                      {item.source}
                    </Badge>
                  </div>

                  {item.mappedBy ? (
                    <p className="text-xs text-muted-foreground">Mapped by {item.mappedBy}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Waiting for map matching</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:flex-nowrap">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-2xl border border-border/60 bg-background/90 hover:bg-primary/10"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(item.name)
                        toast.success(`Copied ${item.name}`)
                      } catch {
                        toast.error("Copy failed")
                      }
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy location name</span>
                  </Button>

                  <Button asChild variant="secondary" size="sm" className="rounded-2xl">
                    <a href="#world-map" aria-label={`View ${item.name} on the map`}>
                      Map
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </article>
            )
          })
        )}
      </CardContent>
    </Card>
  );
}
