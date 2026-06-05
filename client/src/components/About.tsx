import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Users, Target, Zap, CheckCircle, Wrench, BookOpen, Layers, Plug } from 'lucide-react'
import { useAnalytics } from '@/components/Analytics'

const values = [
  {
    icon: Layers,
    title: "Built Around You",
    description: "Every agent is purpose-built for your specific task and your specific business. No templates. No one-size-fits-all."
  },
  {
    icon: Plug,
    title: "Fits Your Systems",
    description: "We connect directly to the tools you already use — your CRM, your inbox, your spreadsheets, your data. Zero migration required."
  },
  {
    icon: BookOpen,
    title: "No Learning Curve",
    description: "Your team keeps working the way they always have. The AI handles what slows them down, invisibly, in the background."
  },
  {
    icon: Wrench,
    title: "Custom-Built for Every Task",
    description: "From document review to customer follow-ups to data entry — if it's repetitive and time-consuming, we can build an agent for it."
  }
]

const achievements = [
  { metric: "100+", label: "Custom Agents Deployed", icon: Zap },
  { metric: "0", label: "New Systems to Learn", icon: CheckCircle },
  { metric: "85%", label: "Average Time Saved on Automated Tasks", icon: Target },
  { metric: "4 weeks", label: "Average Time to First Working Agent", icon: Users }
]

export default function About() {
  const { trackEvent } = useAnalytics()

  const handleGetStarted = () => {
    trackEvent({
      action: 'get_started_click',
      category: 'about',
      label: 'about_section_cta'
    })
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="py-24 bg-muted/30" id="about">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">Our Approach</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4" data-testid="text-about-title">
            We don't sell software.
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-about-subtitle">
            We build the AI that works the way you already do.
          </p>
        </div>

        {/* Company Story + Mission */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h3 className="text-2xl font-semibold mb-6" data-testid="text-our-story">Our Story</h3>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Steel City AI started with a straightforward problem: the businesses that needed AI the most
                were the ones least able to adopt it. Not because the technology wasn't there — but because
                every solution on the market required companies to change how they work, learn new platforms,
                and rip out the systems they'd spent years building.
              </p>
              <p>
                We took a different approach. Instead of asking you to fit your business into our tool,
                we build custom AI agents that fit into yours. Your CRM, your inbox, your spreadsheets,
                your workflows — we meet you exactly where you are, and we automate the parts that slow you down.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-semibold mb-6" data-testid="text-our-mission">Our Mission</h3>
            <div className="space-y-4 text-muted-foreground">
              <p>
                To build AI that works around you — not the other way around.
              </p>
              <p>
                Every agent we build is purpose-built for your specific task, connected to your existing
                systems from day one. There's no new software to learn, no migration headaches, and no
                disruption to how your team already operates. You keep doing what you do. The AI handles the rest.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Badge variant="secondary" className="text-sm">No New Software</Badge>
              <Badge variant="secondary" className="text-sm">Connects to Existing Systems</Badge>
              <Badge variant="secondary" className="text-sm">Custom-Built Agents</Badge>
            </div>
          </div>
        </div>

        {/* Achievement Metrics */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {achievements.map((achievement, index) => {
            const Icon = achievement.icon
            return (
              <Card key={index} className="text-center" data-testid={`card-achievement-${index}`}>
                <CardContent className="p-6">
                  <Icon className="w-8 h-8 text-primary mx-auto mb-3" />
                  <div className="text-3xl font-bold text-foreground mb-1" data-testid={`text-metric-${index}`}>
                    {achievement.metric}
                  </div>
                  <div className="text-sm text-muted-foreground" data-testid={`text-metric-label-${index}`}>
                    {achievement.label}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Our Values */}
        <div className="mb-16">
          <h3 className="text-2xl font-semibold text-center mb-12" data-testid="text-our-values">
            How We Work
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <Card key={index} className="hover-elevate transition-all duration-200" data-testid={`card-value-${index}`}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg" data-testid={`text-value-title-${index}`}>
                        {value.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base" data-testid={`text-value-description-${index}`}>
                      {value.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-primary text-primary-foreground max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-semibold mb-4" data-testid="text-ready-to-transform">
                Ready to See What We Can Build for You?
              </h3>
              <p className="text-primary-foreground/90 mb-6">
                Tell us what's slowing your team down. We'll show you exactly how we'd automate it —
                inside the systems you already use.
              </p>
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent border-primary-foreground text-primary-foreground"
                onClick={handleGetStarted}
                data-testid="button-about-get-started"
              >
                Start the Conversation
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
