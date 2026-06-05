import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, Clock, CheckCircle, ArrowRight, Lightbulb, Target, Zap } from 'lucide-react'
import { Link } from 'wouter'

export default function DiscoveryCTA() {
  const benefits = [
    {
      icon: Lightbulb,
      title: "Personalized Analysis",
      description: "Get a custom AI automation roadmap based on your specific business needs"
    },
    {
      icon: Target,
      title: "Clear Next Steps",
      description: "Receive actionable recommendations you can implement right away"
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Our AI analyzes your inputs and delivers your outline in under a minute"
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-primary/10" id="discover-ai">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Free AI Assessment
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4" data-testid="text-discovery-title">
            Discover How AI Can Transform Your Business
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-discovery-subtitle">
            Answer a few simple questions about your business processes, and our AI will create 
            a personalized automation roadmap tailored to your needs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <Card key={index} className="bg-card/50 border-border/50">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-card border-primary/20 overflow-hidden">
          <CardContent className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Ready to See What's Possible?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Our Automation Discovery takes just 5 minutes to complete. You'll receive:
                </p>
                <ul className="space-y-3 text-left inline-block">
                  <li className="flex items-center gap-3 text-foreground">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Executive summary of your automation opportunities</span>
                  </li>
                  <li className="flex items-center gap-3 text-foreground">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Recommended AI approach for your specific needs</span>
                  </li>
                  <li className="flex items-center gap-3 text-foreground">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Step-by-step implementation roadmap</span>
                  </li>
                  <li className="flex items-center gap-3 text-foreground">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Timeline and investment estimates</span>
                  </li>
                </ul>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Takes only 5 minutes</span>
                </div>
                <Link href="/automation-discovery">
                  <Button size="lg" className="px-8" data-testid="button-start-discovery">
                    Start Your Free Assessment
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground">No commitment required</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
