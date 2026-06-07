import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Bot, Brain, MessageSquare, Zap, Calendar, Mail, Globe, Scale, Clock, CheckCircle2 } from 'lucide-react'
import { useAnalytics } from '@/components/Analytics'

import heroImg from '@assets/generated_images/ai-agent-assistant.svg'
import multiChannelImg from '@assets/generated_images/multi-channel.svg'
import memoryImg from '@assets/generated_images/persistent-memory.svg'
import scalabilityImg from '@assets/generated_images/scalability.svg'

const capabilities = [
  {
    icon: MessageSquare,
    title: 'Multi-Channel Communication',
    description: 'Connect with customers across WhatsApp, Slack, Discord, Teams, email, and more—all managed by one intelligent agent.',
    image: multiChannelImg
  },
  {
    icon: Brain,
    title: 'Persistent Memory',
    description: 'Your AI agent remembers past interactions and adapts to preferences, delivering personalized experiences every time.',
    image: memoryImg
  },
  {
    icon: Scale,
    title: 'Infinite Scalability',
    description: 'Handle 10 tasks or 10,000—AI agents scale instantly without hiring, training, or overhead costs.',
    image: scalabilityImg
  }
]

const adminTasks = [
  { icon: Mail, label: 'Email Management & Triage' },
  { icon: Calendar, label: 'Calendar & Scheduling' },
  { icon: Globe, label: 'Web Research & Data Entry' },
  { icon: Clock, label: '24/7 Customer Support' },
  { icon: CheckCircle2, label: 'Document Processing' },
  { icon: Zap, label: 'Workflow Automation' }
]

export default function AIAgentAssistants() {
  const { trackBusinessGoal, trackEvent } = useAnalytics()

  const handleGetStarted = () => {
    trackEvent({
      action: 'ai_agent_cta_click',
      category: 'featured_service',
      label: 'ai_agent_assistants'
    })
    trackBusinessGoal('consultation_request', {
      source: 'ai_agent_section',
      service: 'ai_agent_assistants'
    })
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleLearnMore = () => {
    trackEvent({
      action: 'learn_more_click',
      category: 'featured_service',
      label: 'ai_agent_assistants'
    })
  }

  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/30" id="ai-agents">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <Badge variant="secondary" className="mb-4">
            <Bot className="w-3 h-3 mr-1" />
            The Featured Service
          </Badge>
        </div>

        <div className="relative mb-16 rounded-md overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={heroImg} 
              alt="AI Agent Assistants visualization"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" />
          </div>
          
          <div className="relative z-10 py-16 px-8 md:px-16 max-w-2xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              AI Agent Assistants
            </h2>
            <p className="text-xl text-white/80 mb-6 leading-relaxed">
              Autonomous AI agents that handle administrative tasks with human-like intelligence. 
              From managing inboxes to scheduling meetings, our agents work 24/7—giving you back 
              the time to focus on what matters most.
            </p>
            <p className="text-lg text-white/80 mb-8">
              <span className="font-semibold text-white">Scale without limits.</span> One agent 
              can become a hundred in seconds, handling enterprise workloads without the overhead of 
              traditional staffing.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" onClick={handleGetStarted}>
                Get Your AI Agent
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" onClick={handleLearnMore} className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20" asChild>
                <a href="#capabilities">
                  See Capabilities
                </a>
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-20" id="capabilities">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              What Makes Our AI Agents Different
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powered by cutting-edge AI, our agents don't just follow scripts—they understand context, 
              learn preferences, and adapt to your business needs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {capabilities.map((capability, index) => (
              <Card key={index} className="overflow-hidden hover-elevate transition-all duration-200">
                <div className="h-48 overflow-hidden">
                  <img 
                    src={capability.image} 
                    alt={capability.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <capability.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h4 className="text-lg font-semibold text-foreground">{capability.title}</h4>
                  </div>
                  <p className="text-muted-foreground">{capability.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-md p-8 md:p-12 border">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Administrative Tasks, Handled
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                Our AI agents perform the same administrative tasks as human assistants—but faster, 
                more consistently, and at a fraction of the cost. They never take breaks, never call in sick, 
                and never miss a deadline.
              </p>
              <p className="text-muted-foreground mb-8">
                Whether you need one agent or an entire virtual workforce, scaling is instant. 
                No interviews, no onboarding, no training time. Just results.
              </p>
              <Button onClick={handleGetStarted}>
                Start Automating Today
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {adminTasks.map((task, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 hover-elevate transition-all duration-200"
                >
                  <task.icon className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">{task.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Zap className="w-4 h-4" />
            Every agent connects to the tools your team already uses — no migration required
          </div>
        </div>
      </div>
    </section>
  )
}
