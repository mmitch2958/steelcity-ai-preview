import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Clock, DollarSign, ChevronRight } from 'lucide-react'
import { useAnalytics } from '@/components/Analytics'
import { cn } from '@/lib/utils'

interface WinItem {
  id: string
  icon: 'trending' | 'clock' | 'dollar'
  metric: string
  company: string
  description: string
}

const recentWins: WinItem[] = [
  {
    id: 'win-1',
    icon: 'clock',
    metric: 'Saved 14 hrs/week',
    company: 'Absolute Pest Services',
    description: 'Automated dispatch scheduling and customer follow-ups'
  },
  {
    id: 'win-2',
    icon: 'dollar',
    metric: 'Reduced inventory waste by 18%',
    company: 'Lawrenceville Specialty Cafe',
    description: 'Predictive weekend ordering alerts and stock optimization'
  },
  {
    id: 'win-3',
    icon: 'trending',
    metric: 'Cut onboarding time by 65%',
    company: 'Shadyside CPA Firm',
    description: 'Automated client document intake and intelligent data extraction'
  }
]

const getIcon = (iconType: 'trending' | 'clock' | 'dollar') => {
  switch (iconType) {
    case 'clock': return Clock
    case 'dollar': return DollarSign
    case 'trending': return TrendingUp
  }
}

export default function RecentWinsTicker() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const { trackEvent } = useAnalytics()

  const nextWin = useCallback(() => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % recentWins.length)
      setIsTransitioning(false)
    }, 300) // Match CSS transition duration
  }, [])

  useEffect(() => {
    const interval = setInterval(nextWin, 4000)
    return () => clearInterval(interval)
  }, [nextWin])

  const handleWinClick = (win: WinItem) => {
    trackEvent({
      action: 'recent_win_clicked',
      category: 'case_studies',
      label: win.company,
      custom_parameters: {
        win_id: win.id,
        metric: win.metric,
        company: win.company
      }
    })
  }

  const currentWin = recentWins[currentIndex]
  const Icon = getIcon(currentWin.icon)

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs font-semibold">
            Recent Wins
          </Badge>
          <span className="text-sm text-muted-foreground">Real results from real clients</span>
        </div>
        
        {/* Manual navigation dots */}
        <div className="flex gap-1.5" aria-label="Ticker navigation">
          {recentWins.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsTransitioning(true)
                setTimeout(() => {
                  setCurrentIndex(index)
                  setIsTransitioning(false)
                }, 300)
              }}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentIndex 
                  ? "bg-primary w-6" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
              aria-label={`Go to win ${index + 1}`}
              data-testid={`button-ticker-dot-${index}`}
            />
          ))}
        </div>
      </div>

      <Card className="bg-primary/5 border-primary/20 overflow-hidden">
        <CardContent className="p-0">
          <div 
            className={cn(
              "flex items-center gap-4 p-4 sm:p-6 cursor-pointer transition-all duration-300 hover:bg-primary/10",
              isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
            )}
            onClick={() => handleWinClick(currentWin)}
            data-testid={`card-recent-win-${currentWin.id}`}
            role="button"
            tabIndex={0}
            aria-label={`${currentWin.metric} for ${currentWin.company}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleWinClick(currentWin)
              }
            }}
          >
            <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-lg text-foreground">
                  {currentWin.metric}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-primary">
                {currentWin.company}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {currentWin.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
