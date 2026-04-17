"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Heart, MoonStar, RotateCcw, Settings2, Sparkles, SunMedium } from "lucide-react"

interface HeaderProps {
  reportDate: string
  lastScraped: string
  stats: Array<{
    label: string
    value: string
  }>
}

export function Header({ reportDate, lastScraped, stats }: HeaderProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const activeTheme = mounted ? theme ?? "system" : "system"

  function handleRefresh() {
    toast.success("Refreshing Heartopia data")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95">
      <div className="container mx-auto max-w-7xl px-4 py-2.5 sm:px-6 sm:py-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
            <div className="relative shrink-0">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-[1.1rem] shadow-md shadow-primary/10 sm:h-14 sm:w-14 sm:rounded-[1.4rem]"
                style={{ backgroundImage: "linear-gradient(135deg, var(--primary), color-mix(in oklab, var(--accent) 85%, white 15%))" }}
              >
                <Heart className="h-5 w-5 fill-primary-foreground text-primary-foreground sm:h-7 sm:w-7" />
              </div>
              <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-accent" />
            </div>

            <div className="min-w-0 space-y-2 sm:space-y-3">
              <div className="space-y-1">
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.24em] sm:text-[11px]">
                  Heartopia Daily
                </Badge>
                <h1
                  className="text-base font-black tracking-tight text-foreground sm:text-4xl"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Daily Resources for Heartopia Players
                </h1>
                <p className="hidden max-w-2xl text-xs leading-5 text-muted-foreground sm:block sm:text-base">
                  Fast access to today&apos;s weather, redeem codes, and resource locations.
                </p>
              </div>

              <div className="hidden flex-wrap items-center gap-2 text-xs sm:flex sm:text-sm">
                <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/95 px-3 py-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium text-foreground">{reportDate}</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/95 px-3 py-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Updated {lastScraped}</span>
                </div>
              </div>

              <div className="hidden gap-2 sm:flex sm:flex-wrap">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/95 px-3 py-2 sm:px-4"
                  >
                    <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:text-xs">{stat.label}</span>
                    <span className="text-base font-bold text-foreground sm:text-lg">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card/95 p-2.5 shadow-sm sm:flex-row sm:gap-3 sm:rounded-3xl sm:p-3 lg:min-w-[320px] lg:flex-col">
            <div className="grid flex-1 grid-cols-3 gap-2 sm:grid-cols-3">
              <Button
                type="button"
                variant={activeTheme === "system" ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 rounded-2xl p-0 sm:h-8 sm:w-auto sm:px-3 sm:text-sm"
                onClick={() => setTheme("system")}
                disabled={!mounted}
                aria-label="System theme"
                title="System theme"
              >
                <Settings2 className="h-4 w-4 sm:mr-2" />
                <span className="sr-only sm:not-sr-only">System</span>
              </Button>
              <Button
                type="button"
                variant={activeTheme === "light" ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 rounded-2xl p-0 sm:h-8 sm:w-auto sm:px-3 sm:text-sm"
                onClick={() => setTheme("light")}
                disabled={!mounted}
                aria-label="Light theme"
                title="Light theme"
              >
                <SunMedium className="h-4 w-4 sm:mr-2" />
                <span className="sr-only sm:not-sr-only">Light</span>
              </Button>
              <Button
                type="button"
                variant={activeTheme === "dark" ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 rounded-2xl p-0 sm:h-8 sm:w-auto sm:px-3 sm:text-sm"
                onClick={() => setTheme("dark")}
                disabled={!mounted}
                aria-label="Dark theme"
                title="Dark theme"
              >
                <MoonStar className="h-4 w-4 sm:mr-2" />
                <span className="sr-only sm:not-sr-only">Dark</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="col-span-3 rounded-2xl text-xs sm:text-sm"
                onClick={handleRefresh}
              >
                <RotateCcw className="h-4 w-4" />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
