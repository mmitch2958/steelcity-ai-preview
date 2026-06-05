import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, TrendingUp, Clock, DollarSign, Loader2, Sparkles } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'wouter'
import type { CaseStudy } from '@shared/schema'
import { useAnalytics } from '@/components/Analytics'
import RecentWinsTicker from './RecentWinsTicker'

const getResultIcon = (label: string) => {
  const l = label.toLowerCase()
  if (l.includes('time') || l.includes('hour') || l.includes('day') || l.includes('faster') || l.includes('speed') || l.includes('overnight') || l.includes('automatic')) {
    return Clock
  }
  if (l.includes('cost') || l.includes('saving') || l.includes('$') || l.includes('labor') || l.includes('annual')) {
    return DollarSign
  }
  return TrendingUp
}

const sectionHeader = (
  <div className="text-center mb-16">
    <Badge variant="secondary" className="mb-4">Client Work</Badge>
    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4" data-testid="text-case-studies-title">
      Built for Real Businesses
    </h2>
    <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-case-studies-subtitle">
      Every agent was custom-made for how that business actually works —
      connecting to the tools they already had, without a single platform migration.
    </p>
  </div>
)

export default function CaseStudies() {
  const { data: caseStudies, isLoading, error } = useQuery<CaseStudy[]>({
    queryKey: ['/api/case-studies/featured'],
  })
  const { trackCaseStudyEngagement, trackEvent } = useAnalytics()

  const handleGetSimilar = (caseStudyId: string, caseStudyTitle: string) => {
    trackCaseStudyEngagement(caseStudyTitle, 'click')
    trackEvent({
      action: 'case_study_click',
      category: 'content',
      label: caseStudyTitle,
      custom_parameters: { case_study_id: caseStudyId, content_type: 'case_study' }
    })
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  if (isLoading) {
    return (
      <section className="py-24 bg-muted/30" id="case-studies">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {sectionHeader}
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    )
  }

  if (error || !caseStudies) {
    return (
      <section className="py-24 bg-muted/30" id="case-studies">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {sectionHeader}
          <div className="text-center py-12">
            <p className="text-muted-foreground">Unable to load case studies at this time.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-24 bg-muted/30" id="case-studies">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {sectionHeader}

        {/* Dynamic Recent Wins Ticker */}
        <RecentWinsTicker />

        <div className="grid lg:grid-cols-3 gap-8 mb-14">
          {caseStudies.map((study) => (
            <Card
              key={study.id}
              className="hover-elevate transition-all duration-200 flex flex-col"
              data-testid={`card-case-study-${study.id}`}
            >
              <CardHeader className="pb-3">
                {/* Tags + timeline */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {study.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs"
                      data-testid={`badge-tag-${study.id}-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                <CardTitle className="text-lg leading-snug mb-1" data-testid={`text-case-study-title-${study.id}`}>
                  {study.title}
                </CardTitle>

                {/* Company + industry */}
                <p className="text-sm text-muted-foreground" data-testid={`text-case-study-company-${study.id}`}>
                  {study.company} &middot; {study.industry}
                </p>

                {/* Duration pill — key brand proof point */}
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs text-primary border-primary/40 font-medium">
                    <Clock className="w-3 h-3 mr-1" />
                    {study.duration}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col gap-4 flex-1">
                {/* Challenge */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    The problem
                  </p>
                  <p className="text-sm text-foreground" data-testid={`text-challenge-${study.id}`}>
                    {study.challenge}
                  </p>
                </div>

                {/* Solution */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    What we built
                  </p>
                  <p className="text-sm text-foreground" data-testid={`text-solution-${study.id}`}>
                    {study.solution}
                  </p>
                </div>

                {/* Results — stat blocks */}
                <div className="mt-auto pt-3 border-t">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Results
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {study.results.map((result, index) => {
                      const Icon = getResultIcon(result.label)
                      return (
                        <div
                          key={index}
                          className="flex items-start gap-2.5 rounded-md bg-muted/60 px-3 py-2"
                          data-testid={`text-result-${study.id}-${index}`}
                        >
                          <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm leading-tight">
                            <span className="font-bold text-foreground">{result.value}</span>
                            <span className="text-muted-foreground ml-1.5">{result.label}</span>
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleGetSimilar(study.id, study.title)}
                  data-testid={`button-view-case-study-${study.id}`}
                >
                  Get a Similar Solution
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <p className="text-muted-foreground mb-6 text-sm">
            Every engagement starts with understanding your actual workflow — not a demo of generic software.
          </p>
          <Link href="/automation-discovery">
            <Button size="lg" data-testid="button-view-all-case-studies">
              <Sparkles className="mr-2 h-5 w-5" />
              See What We'd Build for You
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
