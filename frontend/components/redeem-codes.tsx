"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gift, Copy, Check, Sparkles, Clock } from "lucide-react"

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

  const copyToClipboard = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <Card className="overflow-hidden border-border/50 shadow-sm">
      <CardHeader className="pb-2 sm:pb-3 bg-gradient-to-r from-accent/20 to-transparent px-3 sm:px-6 py-3 sm:py-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg" style={{ fontFamily: 'var(--font-display)' }}>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-accent/30 flex items-center justify-center shrink-0">
            <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-chart-4" />
          </div>
          Redeem Codes
            {lastUpdated ? (
              <span className="hidden text-xs font-normal text-muted-foreground sm:inline">Codes updated {lastUpdated}</span>
            ) : null}
          <span className="ml-auto text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 sm:py-1 rounded-full">
              {items.length} active
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 py-3 sm:py-6">
          {items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-muted/50 p-4 text-sm text-muted-foreground">
              No redeem codes available in the latest report.
            </p>
          ) : null}

        <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2">
            {items.map((item) => (
            <div
              key={item.code}
              className="relative flex flex-col gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-secondary/30 hover:from-muted/70 hover:to-secondary/50 transition-colors group active:scale-95 sm:active:scale-100"
            >
              {item.isNew && (
                <div className="absolute -top-1.5 -right-1.5">
                  <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-sm">
                    <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span className="hidden sm:inline">New</span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between gap-2 min-w-0">
                <code className="text-sm sm:text-base font-bold text-foreground tracking-wide font-mono truncate">
                  {item.code}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(item.code)}
                  className="h-8 w-8 p-0 hover:bg-primary/10 shrink-0"
                >
                  {copiedCode === item.code ? (
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  )}
                  <span className="sr-only">Copy code</span>
                </Button>
              </div>
              
              <p className="text-xs sm:text-sm text-foreground/80">{item.rewards}</p>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                <span className="truncate">Expires {item.expires}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
