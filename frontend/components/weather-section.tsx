import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sun, Cloud, CloudRain, Snowflake, Wind, Droplets } from "lucide-react"

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
      <Card className="overflow-hidden border-border/50 shadow-sm">
        <CardHeader className="pb-2 sm:pb-3 bg-gradient-to-r from-primary/10 to-transparent px-3 sm:px-6 py-3 sm:py-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Sun className="w-5 h-5 text-primary" />
            Weather Information
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 py-3 sm:py-6">
          <p className="rounded-xl border border-dashed border-border bg-muted/50 p-3 text-sm text-muted-foreground">
            No weather data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentLine = today[0] ?? forecast[0] ?? "No weather data"
  const humidityLine = today[1] ?? "No humidity info"
  const windLine = forecast[0] ?? "No wind info"
  const slots = [
    { time: "Morning", line: today[0] ?? forecast[0] ?? "-" },
    { time: "Afternoon", line: today[1] ?? forecast[1] ?? "-" },
    { time: "Evening", line: today[2] ?? forecast[2] ?? "-" },
  ]

  return (
    <Card className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 sm:pb-3 bg-gradient-to-r from-chart-3/10 to-transparent px-3 sm:px-6 py-3 sm:py-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg" style={{ fontFamily: 'var(--font-display)' }}>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-chart-3/20 flex items-center justify-center shrink-0">
            <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-chart-3" />
          </div>
          In-Game Weather
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 py-3 sm:py-6">
        {/* Current Weather */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-secondary/50 to-accent/20">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-accent/30 flex items-center justify-center shrink-0">
            <WeatherIcon condition={lineToCondition(currentLine)} className="w-7 h-7 sm:w-8 sm:h-8 text-chart-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base font-semibold text-foreground">{currentLine}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Current in-game weather</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:space-y-1 sm:text-sm text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Droplets className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span>{humidityLine}</span>
            </div>
            <div className="flex items-center gap-1">
              <Wind className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span>{windLine}</span>
            </div>
          </div>
        </div>

        {/* Forecast */}
        <div className="grid grid-cols-3 gap-2">
          {slots.map((item) => (
            <div
              key={item.time}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <span className="text-xs text-muted-foreground font-medium">{item.time}</span>
              <WeatherIcon condition={lineToCondition(item.line)} className="w-5 h-5 text-foreground/70" />
              <span className="text-center text-xs font-semibold text-foreground">{item.line}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
