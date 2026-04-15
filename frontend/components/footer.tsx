"use client"

import { Heart } from "lucide-react"

export function Footer() {
  return (
    <footer className="mt-12 border-t border-border/50 bg-muted/30">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-sm">Made with</span>
            <Heart className="w-4 h-4 text-chart-5 fill-chart-5" />
            <span className="text-sm">for Heartopia players</span>
          </div>
          <p className="text-xs text-muted-foreground/70">
            This is a fan-made companion site. Not affiliated with the official game.
          </p>
        </div>
      </div>
    </footer>
  )
}
