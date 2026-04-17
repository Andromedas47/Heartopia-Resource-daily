"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CalendarClock, Check, Copy, Filter, Gift, Search, Sparkles } from "lucide-react"
import { toast } from "sonner"

interface RedeemCodeItem {
  code: string
  rewards: string
  expires: string
  isNew?: boolean
}

interface RedeemCodesProps {
  items: RedeemCodeItem[]
  lastUpdated?: string
}

export function RedeemCodes({ items, lastUpdated }: RedeemCodesProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [showNewOnly, setShowNewOnly] = useState(false)

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return items.filter((item) => {
      if (showNewOnly && !item.isNew) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      return [item.code, item.rewards, item.expires]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    })
  }, [items, query, showNewOnly])

  const visibleCodes = useMemo(() => filteredItems.map((item) => item.code).join("\n"), [filteredItems])

  async function copyToClipboard(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      toast.success(`Copied ${code}`)
      window.setTimeout(() => setCopiedCode(null), 1800)
    } catch {
      toast.error("Copy failed")
    }
  }

  async function copyAllVisible() {
    if (!visibleCodes) return

    try {
      await navigator.clipboard.writeText(visibleCodes)
      toast.success(`Copied ${filteredItems.length} codes`)
    } catch {
      toast.error("Copy all failed")
    }
  }

  if (!items.length) {
    return (
      <Card className="overflow-hidden border-border/60 bg-card/95 shadow-sm">
        <CardHeader
          className="border-b border-border/50 px-4 py-4 sm:px-6"
          style={{ backgroundImage: "linear-gradient(90deg, color-mix(in oklab, var(--accent) 20%, transparent), transparent)" }}
        >
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg" style={{ fontFamily: 'var(--font-display)' }}>
            <Gift className="h-5 w-5 text-chart-4" />
            Redeem Codes
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-5 sm:px-6">
          <p className="rounded-2xl border border-dashed border-border bg-muted/50 p-4 text-sm text-muted-foreground">
            No redeem codes available.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border-border/60 bg-card/95 shadow-sm">
      <CardHeader
        className="border-b border-border/50 px-4 py-4 sm:px-6"
        style={{ backgroundImage: "linear-gradient(90deg, color-mix(in oklab, var(--accent) 20%, transparent), transparent)" }}
      >
        <div className="flex flex-col gap-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg" style={{ fontFamily: 'var(--font-display)' }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/25 text-chart-4 shadow-sm">
              <Gift className="h-4 w-4" />
            </div>
            Redeem Codes
            {lastUpdated ? (
              <span className="hidden text-xs font-normal text-muted-foreground sm:inline">Codes updated {lastUpdated}</span>
            ) : null}
            <span className="ml-auto rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {filteredItems.length} of {items.length}
            </span>
          </CardTitle>

          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search codes, rewards, or expiry"
                className="h-10 rounded-2xl pl-9"
              />
            </div>

            <div className="grid gap-2 sm:flex sm:flex-wrap">
              <Button
                type="button"
                variant={showNewOnly ? "default" : "outline"}
                size="sm"
                className="rounded-2xl text-xs sm:text-sm"
                onClick={() => setShowNewOnly((value) => !value)}
              >
                <Filter className="h-4 w-4" />
                New only
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-2xl text-xs sm:text-sm"
                onClick={() => void copyAllVisible()}
                disabled={!filteredItems.length}
              >
                Copy all visible
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-4 sm:px-6 sm:py-6">
        {filteredItems.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            No redeem codes match your search.
          </p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          {filteredItems.map((item) => (
            <article
              key={item.code}
              className="group relative flex flex-col gap-3 rounded-3xl border border-border/60 p-4 shadow-sm transition-all hover:-translate-y-0.5"
              style={{ backgroundImage: "linear-gradient(135deg, color-mix(in oklab, var(--muted) 60%, white 40%), color-mix(in oklab, var(--secondary) 20%, transparent))" }}
            >
              {item.isNew ? (
                <Badge className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em]">
                  <Sparkles className="h-3 w-3" />
                  New
                </Badge>
              ) : null}

              <div className="flex items-start justify-between gap-3 pr-16">
                <div className="min-w-0 space-y-2">
                  <code className="block truncate text-base font-black tracking-[0.14em] text-foreground">
                    {item.code}
                  </code>
                  <p className="text-sm leading-6 text-muted-foreground">{item.rewards}</p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 rounded-2xl border border-border/60 bg-background/90 hover:bg-primary/10"
                  onClick={() => void copyToClipboard(item.code)}
                >
                  {copiedCode === item.code ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                  )}
                  <span className="sr-only">Copy code</span>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="rounded-full px-2.5 py-1">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {item.expires}
                </Badge>
                <span className="rounded-full bg-muted px-2.5 py-1">Reward: {item.rewards}</span>
              </div>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
