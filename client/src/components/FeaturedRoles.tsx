import { Link } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Search, UserCheck, Headphones, Server } from 'lucide-react'
import { useAnalytics } from '@/components/Analytics'

const featuredRoles = [
  {
    icon: Search,
    name: 'Research Agent',
    oneLiner: 'Competitive intel on autopilot.',
    href: '/ai-employees#role-research'
  },
  {
    icon: UserCheck,
    name: 'SDR Agent',
    oneLiner: 'Leads qualified, meetings booked.',
    href: '/ai-employees#role-sdr'
  },
  {
    icon: Headphones,
    name: 'Support Agent',
    oneLiner: '24/7 customer answers.',
    href: '/ai-employees#role-support'
  },
  {
    icon: Server,
    name: 'Infrastructure Agent',
    oneLiner: 'Network monitoring that self-heals.',
    href: '/ai-employees#role-infrastructure'
  }
]

export default function FeaturedRoles() {
  const { trackEvent } = useAnalytics()

  const handleLearnMore = () => {
    trackEvent({
      action: 'featured_roles_cta_click',
      category: 'homepage',
      label: 'ai_employees_featured'
    })
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            New: AI Employees
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Specialized AI Agents, Ready to Hire
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Nine AI roles that work 24/7—handling research, sales, support, content, operations, scheduling, finance, HR, and IT infrastructure.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {featuredRoles.map((role) => (
            <Card key={role.name} className="hover-elevate transition-all duration-200 h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <role.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{role.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4 flex-grow">
                  {role.oneLiner}
                </p>
                <Link href={role.href} onClick={handleLearnMore}>
                  <Button variant="ghost" size="sm" className="w-full">
                    Learn more
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link href="/ai-employees" onClick={handleLearnMore}>
            <Button variant="outline" size="lg">
              See All 9 AI Employees
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
