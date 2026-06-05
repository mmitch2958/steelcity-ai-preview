import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Loader2, Star } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'wouter'
import type { Service } from '@shared/schema'
import { useAnalytics } from '@/components/Analytics'

import documentProcessingImg from '@assets/generated_images/ai_document_processing_visual.png'
import customAgentImg from '@assets/generated_images/custom_agent_automation_visual.png'
import marketingAutomationImg from '@assets/generated_images/marketing_automation_visual.png'
import dataAnalyticsImg from '@assets/generated_images/data_analytics_visual.png'
import customSolutionsImg from '@assets/generated_images/custom_ai_solutions_visual.png'

const getServiceImage = (slug: string) => {
  switch (slug) {
    case 'document-processing': return documentProcessingImg
    case 'custom-agent-automation': return customAgentImg
    case 'marketing-automation': return marketingAutomationImg
    case 'data-analysis': return dataAnalyticsImg
    case 'custom-solutions': return customSolutionsImg
    default: return customSolutionsImg
  }
}

export default function Services() {
  const { data: services, isLoading, error } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  })
  const { trackServiceInterest, trackBusinessGoal, trackEvent } = useAnalytics()

  const handleLearnMore = (serviceSlug: string, serviceName: string) => {
    trackServiceInterest(serviceName, 'click')
    trackBusinessGoal('service_inquiry', {
      service_slug: serviceSlug,
      service_name: serviceName,
      action: 'learn_more_click'
    })
  }

  const handleGetStarted = () => {
    trackEvent({ action: 'get_started_click', category: 'services', label: 'general_services_cta' })
    trackBusinessGoal('consultation_request', { source: 'services_section', action: 'get_started_click' })
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  const sectionHeader = (
    <div className="text-center mb-16">
      <Badge variant="secondary" className="mb-4">What We Build</Badge>
      <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4" data-testid="text-services-title">
        AI Built Around Your Workflow
      </h2>
      <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-services-subtitle">
        Every agent is custom-built for your specific task — and connected to the tools and systems your team already uses every day.
      </p>
    </div>
  )

  if (isLoading) {
    return (
      <section className="py-24 bg-background" id="services">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {sectionHeader}
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    )
  }

  if (error || !services || !Array.isArray(services)) {
    return (
      <section className="py-24 bg-background" id="services">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {sectionHeader}
          <div className="text-center py-12">
            <p className="text-muted-foreground">Unable to load services at this time.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-24 bg-background" id="services">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {sectionHeader}

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {services.map((service) => {
            const serviceImage = getServiceImage(service.slug)
            const isFeatured = service.featured

            return (
              <div key={service.id} className="relative" data-testid={`card-service-${service.slug}`}>
                {isFeatured && (
                  <Badge
                    className="absolute top-3 left-4 bg-primary text-primary-foreground z-10"
                    data-testid={`badge-popular-${service.slug}`}
                  >
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
                <Card className="hover-elevate transition-all duration-200 h-full overflow-hidden">
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={serviceImage}
                      alt={`${service.title} visualization`}
                      className="w-full h-full object-cover"
                      width={1280}
                      height={896}
                      loading="lazy"
                      decoding="async"
                      data-testid={`img-service-${service.slug}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                  </div>

                  <CardHeader className="text-center pb-4 pt-4">
                    <CardTitle className="text-xl mb-2" data-testid={`text-service-title-${service.slug}`}>
                      {service.title}
                    </CardTitle>
                    <CardDescription className="text-base mb-3" data-testid={`text-service-description-${service.slug}`}>
                      {service.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {service.features.slice(0, 4).map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-center text-sm text-muted-foreground"
                          data-testid={`text-feature-${service.slug}-${index}`}
                        >
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                      {service.features.length > 4 && (
                        <li className="text-sm text-muted-foreground">
                          <span className="font-medium">+{service.features.length - 4} more features</span>
                        </li>
                      )}
                    </ul>

                    <div className="mb-4">
                      <Badge variant="secondary" className="text-xs">
                        {service.category}
                      </Badge>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      asChild
                      data-testid={`button-learn-more-${service.slug}`}
                    >
                      <Link
                        href={`/services/${service.slug}`}
                        onClick={() => handleLearnMore(service.slug, service.title)}
                      >
                        Learn More
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-muted-foreground mb-6" data-testid="text-services-cta">
            Don't see exactly what you need? We build custom agents for any task.
          </p>
          <Button
            size="lg"
            onClick={handleGetStarted}
            data-testid="button-services-get-started"
          >
            Tell Us What You Need
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  )
}
