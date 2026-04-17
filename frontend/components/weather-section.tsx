import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cloud, CloudRain, Droplets, Snowflake, Sun, Wind } from "lucide-react"

interface WeatherSectionProps {
  today: string[]
  forecast: string[]
}

const WeatherIcon = ({ condition, className }: { condition: string; className?: string }) => {
  switch (condition.toLowerCase()) {
    case "sunny":
      return <Sun className={className} />
    case "cloudy":
      return <Cloud className={className} />
    case "rainy":
      return <CloudRain className={className} />
    case "snowy":
      return <Snowflake className={className} />
    default:
      return <Sun className={className} />
  }
}

function lineToCondition(line: string): string {
  if (/ฝน|rain|storm|พายุ/i.test(line)) return "rainy"
  if (/หิมะ|snow/i.test(line)) return "snowy"
  if (/เมฆ|cloud/i.test(line)) return "cloudy"
  return "sunny"
}

export function WeatherSection({ today, forecast }: WeatherSectionProps) {
  if (!today.length && !forecast.length) {
    return (
      <Card className="overflow-hidden border-border/60 bg-card/95 shadow-sm">
        <CardHeader
          className="border-b border-border/50 px-4 py-4 sm:px-6"
          style={{ backgroundImage: "linear-gradient(90deg, color-mix(in oklab, var(--chart-3) 10%, transparent), transparent)" }}
        >
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg" style={{ fontFamily: 'var(--font-display)' }}>
            <Sun className="h-5 w-5 text-primary" />
            Weather Information
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-5 sm:px-6">
          <p className="rounded-2xl border border-dashed border-border bg-muted/50 p-4 text-sm text-muted-foreground">
            No weather data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentLine = today[0] ?? forecast[0] ?? "No weather data"
  const humidityLine = today[1] ?? "No humidity info"
  const windLine = forecast[0] ?? "No wind info"
  return (
    <Card className="overflow-hidden border-border/60 bg-card/95 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader
        className="border-b border-border/50 px-4 py-4 sm:px-6"
        style={{ backgroundImage: "linear-gradient(90deg, color-mix(in oklab, var(--chart-3) 10%, transparent), transparent)" }}
      >
        <div className="flex flex-col gap-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg" style={{ fontFamily: 'var(--font-display)' }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-chart-3/20 text-chart-3 shadow-sm">
              <Sun className="h-4 w-4" />
            </div>
            In-Game Weather
            <Badge variant="secondary" className="ml-auto rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.16em]">
              {today.length + forecast.length} lines
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Quick view of today&apos;s live weather notes and the short forecast window.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 py-4 sm:px-6 sm:py-6">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div
            className="rounded-3xl border border-border/60 p-4"
            style={{ backgroundImage: "linear-gradient(135deg, color-mix(in oklab, var(--secondary) 70%, white 30%), color-mix(in oklab, var(--accent) 20%, transparent))" }}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-background/80 shadow-sm">
                <WeatherIcon condition={lineToCondition(currentLine)} className="h-8 w-8 text-chart-4" />
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-base font-black text-foreground sm:text-xl">{currentLine}</p>
                <p className="text-sm text-muted-foreground">Current in-game weather</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-full px-2.5 py-1">
                    <Droplets className="h-3.5 w-3.5" />
                    {humidityLine}
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-2.5 py-1">
                    <Wind className="h-3.5 w-3.5" />
                    {windLine}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-2 lg:grid-cols-1">
            {[
              { title: "Morning", line: today[0] ?? forecast[0] ?? "-" },
              { title: "Afternoon", line: today[1] ?? forecast[1] ?? "-" },
              { title: "Evening", line: today[2] ?? forecast[2] ?? "-" },
            ].map((slot) => (
              <div
                key={slot.title}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/50 p-3 shadow-sm transition-colors hover:bg-muted"
              >
                <WeatherIcon condition={lineToCondition(slot.line)} className="h-5 w-5 text-foreground/80" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{slot.title}</p>
                  <p className="truncate text-sm font-medium text-foreground">{slot.line}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
