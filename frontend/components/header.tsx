import { Heart, Sparkles, Calendar, Clock } from "lucide-react"

interface HeaderProps {
  reportDate: string
  lastScraped: string
}

export function Header({ reportDate, lastScraped }: HeaderProps) {

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 max-w-6xl">
        <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground fill-primary-foreground" />
              </div>
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-accent absolute -top-1 -right-1" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                Heartopia Daily
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Your cozy game companion</p>
            </div>
          </div>

          {/* Report Info */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-secondary/80 whitespace-nowrap">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-primary shrink-0" />
              <span className="text-secondary-foreground font-medium text-xs sm:text-sm">{reportDate}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-muted/80 whitespace-nowrap">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground text-xs sm:text-sm">Updated {lastScraped}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
