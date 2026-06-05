import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight, Check, FileText, Mail, Database, Plug, AlertCircle,
  GraduationCap, BarChart2, Clock, Target, PenLine, TrendingUp,
  Search, Settings, Sparkles, Bot, Wrench, Zap, ChevronRight,
  ScanLine, LayoutGrid, BellRing, FolderCheck, MessageSquare, Megaphone
} from 'lucide-react'
import { Link } from 'wouter'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Contact from '@/components/Contact'
import { SEO } from '@/components/SEO'
import type { Service } from '@shared/schema'

interface ServiceTemplateProps {
  serviceSlug: string
  title: string
  description: string
  keywords: string
}

type DiagramNode = { icon: React.ElementType; label: string }

const SERVICE_DIAGRAMS: Record<string, { inputs: DiagramNode[]; outputs: DiagramNode[] }> = {
  'document-processing': {
    inputs: [
      { icon: Mail,     label: 'Incoming emails' },
      { icon: FileText, label: 'PDFs & invoices' },
      { icon: ScanLine, label: 'Scanned forms' },
      { icon: Plug,     label: 'Cloud storage' },
    ],
    outputs: [
      { icon: Database,     label: 'CRM / ERP updated' },
      { icon: Check,        label: 'Data extracted' },
      { icon: AlertCircle,  label: 'Exceptions flagged' },
      { icon: Clock,        label: 'Runs 24/7' },
    ],
  },
  'custom-agent-automation': {
    inputs: [
      { icon: Clock,    label: 'Scheduled triggers' },
      { icon: Mail,     label: 'Email requests' },
      { icon: Database, label: 'CRM / ERP events' },
      { icon: Zap,      label: 'API webhooks' },
    ],
    outputs: [
      { icon: Check,       label: 'Tasks completed' },
      { icon: Plug,        label: 'Systems updated' },
      { icon: AlertCircle, label: 'Human escalations' },
      { icon: BellRing,    label: 'Team notified' },
    ],
  },
  'marketing-automation': {
    inputs: [
      { icon: Mail,        label: 'Email lists' },
      { icon: Target,      label: 'Lead events' },
      { icon: Database,    label: 'CRM contacts' },
      { icon: TrendingUp,  label: 'Behavior signals' },
    ],
    outputs: [
      { icon: PenLine,   label: 'Content drafted' },
      { icon: Target,    label: 'Leads scored' },
      { icon: Megaphone, label: 'Campaigns sent' },
      { icon: BarChart2, label: 'Performance tracked' },
    ],
  },
  'data-analysis': {
    inputs: [
      { icon: Database,   label: 'Your databases' },
      { icon: LayoutGrid, label: 'Spreadsheets' },
      { icon: Clock,      label: 'Scheduled jobs' },
      { icon: FileText,   label: 'Existing reports' },
    ],
    outputs: [
      { icon: BarChart2,   label: 'Reports generated' },
      { icon: Sparkles,    label: 'Insights delivered' },
      { icon: AlertCircle, label: 'Anomalies flagged' },
      { icon: BellRing,    label: 'Alerts sent' },
    ],
  },
  'custom-solutions': {
    inputs: [
      { icon: Search,   label: 'Your workflow' },
      { icon: Wrench,   label: 'Custom logic' },
      { icon: Plug,     label: 'Any API or tool' },
      { icon: FileText, label: 'Legacy systems' },
    ],
    outputs: [
      { icon: Bot,        label: 'Agent deployed' },
      { icon: Check,      label: 'Tasks automated' },
      { icon: FolderCheck,label: 'Outcomes tracked' },
      { icon: Settings,   label: 'Monitored & refined' },
    ],
  },
}

const DEFAULT_DIAGRAM: { inputs: DiagramNode[]; outputs: DiagramNode[] } = {
  inputs: [
    { icon: Mail,     label: 'Emails' },
    { icon: FileText, label: 'Documents' },
    { icon: Database, label: 'Your systems' },
    { icon: Plug,     label: 'APIs' },
  ],
  outputs: [
    { icon: Check,       label: 'Tasks done' },
    { icon: BarChart2,   label: 'Reports sent' },
    { icon: AlertCircle, label: 'Exceptions handled' },
    { icon: Clock,       label: 'Runs 24/7' },
  ],
}

function WorkflowDiagram({ slug }: { slug: string }) {
  const diagram = SERVICE_DIAGRAMS[slug] ?? DEFAULT_DIAGRAM

  return (
    <div className="flex items-center gap-3 w-full select-none">
      {/* Input nodes */}
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {diagram.inputs.map(({ icon: Icon, label }, i) => (
          <div
            key={i}
            className="flex items-center gap-2 bg-background border rounded-md px-3 py-2 text-sm shadow-sm"
          >
            <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground truncate text-xs font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* Connector — left */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <div className="w-px h-16 bg-border" />
        <div className="relative w-8 h-px">
          <div className="absolute inset-0 bg-primary/40" />
          <div
            className="absolute top-0 h-px w-2 bg-primary rounded-full"
            style={{ animation: 'flow-right 1.8s linear infinite' }}
          />
        </div>
        <ChevronRight className="w-4 h-4 text-primary" />
        <div className="w-px h-16 bg-border" />
      </div>

      {/* AI Agent center */}
      <div className="flex-shrink-0 flex flex-col items-center">
        <div
          className="relative rounded-xl bg-primary text-primary-foreground p-5 shadow-lg flex flex-col items-center gap-2"
          style={{ boxShadow: '0 0 0 4px hsl(var(--primary) / 0.15), 0 0 0 8px hsl(var(--primary) / 0.07)' }}
        >
          <div
            className="absolute inset-0 rounded-xl opacity-0"
            style={{ animation: 'agent-pulse 2.4s ease-in-out infinite', background: 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)' }}
          />
          <Bot className="w-9 h-9 relative z-10" />
          <div className="text-center relative z-10">
            <p className="font-bold text-sm leading-tight">AI Agent</p>
            <p className="text-[10px] opacity-70 leading-tight">custom-built</p>
          </div>
        </div>
      </div>

      {/* Connector — right */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <div className="w-px h-16 bg-border" />
        <div className="relative w-8 h-px">
          <div className="absolute inset-0 bg-primary/40" />
          <div
            className="absolute top-0 h-px w-2 bg-primary rounded-full"
            style={{ animation: 'flow-right 1.8s linear infinite 0.9s' }}
          />
        </div>
        <ChevronRight className="w-4 h-4 text-primary" />
        <div className="w-px h-16 bg-border" />
      </div>

      {/* Output nodes */}
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {diagram.outputs.map(({ icon: Icon, label }, i) => (
          <div
            key={i}
            className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-md px-3 py-2 text-sm shadow-sm"
          >
            <Icon className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-foreground truncate text-xs font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function getFeatureIcon(text: string) {
  const t = text.toLowerCase()
  if (t.includes('pdf') || t.includes('document') || t.includes('form') || t.includes('invoice') || t.includes('attachment') || t.includes('scann')) return FileText
  if (t.includes('email') || t.includes('inbox') || t.includes('outreach') || t.includes('follow-up') || t.includes('campaign')) return Mail
  if (t.includes('database') || t.includes('spreadsheet') || t.includes('erp') || t.includes('crm') || t.includes('existing field')) return Database
  if (t.includes('connect') || t.includes('integrat') || t.includes('api') || t.includes('hubspot') || t.includes('salesforce') || t.includes('mailchimp')) return Plug
  if (t.includes('flag') || t.includes('review') || t.includes('human') || t.includes('approval') || t.includes('exception') || t.includes('escalat')) return AlertCircle
  if (t.includes('learn') || t.includes('train') || t.includes('convention') || t.includes('naming')) return GraduationCap
  if (t.includes('report') || t.includes('analysis') || t.includes('performance') || t.includes('insight') || t.includes('analytic')) return BarChart2
  if (t.includes('schedule') || t.includes('24/7') || t.includes('continu') || t.includes('automat') || t.includes('runs')) return Clock
  if (t.includes('personaliz') || t.includes('segment') || t.includes('behavior') || t.includes('lead scor') || t.includes('trigger')) return Target
  if (t.includes('draft') || t.includes('copy') || t.includes('content') || t.includes('write') || t.includes('social') || t.includes('creative')) return PenLine
  if (t.includes('trend') || t.includes('forecast') || t.includes('anomaly') || t.includes('detect') || t.includes('pattern')) return TrendingUp
  if (t.includes('discover') || t.includes('map') || t.includes('workflow') || t.includes('deep-dive')) return Search
  if (t.includes('support') || t.includes('monitor') || t.includes('refin') || t.includes('adjust')) return Settings
  if (t.includes('custom') || t.includes('architectur') || t.includes('logic') || t.includes('built')) return Wrench
  if (t.includes('plain') || t.includes('summar') || t.includes('delivered') || t.includes('slack') || t.includes('inbox')) return Sparkles
  if (t.includes('message') || t.includes('chat') || t.includes('communic')) return MessageSquare
  return Bot
}

const steps = [
  {
    number: '01',
    label: 'Discovery',
    timeframe: 'Week 1',
    detail: 'We map your actual workflow — the repetitive steps, the tools involved, the exceptions. You describe how things work today; we identify exactly where the agent fits.',
    icon: Search,
  },
  {
    number: '02',
    label: 'Build',
    timeframe: 'Weeks 2–3',
    detail: 'Your agent is built and connected to your existing tools. We demo working progress weekly — you see it handling real tasks before it ever goes live.',
    icon: Wrench,
  },
  {
    number: '03',
    label: 'Deploy',
    timeframe: 'Week 4',
    detail: 'The agent goes live. We monitor the first runs with you, tune edge cases, and hand off a system your team can trust to run on its own.',
    icon: Zap,
  },
]

export default function ServiceTemplate({ serviceSlug, title, description, keywords }: ServiceTemplateProps) {
  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  })

  const service = services?.find(s => s.slug === serviceSlug)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        </div>
        <Footer />
      </div>
    )
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Service Not Found</h1>
            <Link href="/"><Button>Back to Home</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title={title} description={description} keywords={keywords} />
      <Header />

      {/* ── Hero: 2-column ── */}
      <section className="py-20 bg-muted/30 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Text column */}
            <div>
              <Badge variant="secondary" className="mb-4">{service.category}</Badge>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-5 leading-tight" data-testid="text-service-title">
                {service.title}
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed" data-testid="text-service-description">
                {service.longDescription || service.description}
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap gap-8 mb-10">
                {[
                  { stat: '4 weeks', label: 'avg. deployment' },
                  { stat: 'Zero', label: 'new tools required' },
                  { stat: '24/7', label: 'always running' },
                ].map(({ stat, label }) => (
                  <div key={stat}>
                    <p className="text-2xl font-bold text-primary">{stat}</p>
                    <p className="text-sm text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild data-testid="button-get-started">
                  <a href="#contact">
                    Talk to Us
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/automation-discovery">Discover Your Use Case</Link>
                </Button>
              </div>
            </div>

            {/* Diagram column — hidden on mobile */}
            <div className="hidden lg:flex flex-col items-center gap-4">
              {/* Labels */}
              <div className="flex w-full justify-between px-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your inputs</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your results</span>
              </div>
              <WorkflowDiagram slug={serviceSlug} />
              <p className="text-xs text-center text-muted-foreground mt-1">
                Connected to the tools you already use — nothing new to install
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── What's Included ── */}
      {service.features && service.features.length > 0 && (
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-foreground mb-3">What's included</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Built around your existing systems — not a new platform to learn.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {service.features.map((feature, index) => {
                const Icon = getFeatureIcon(feature)
                return (
                  <Card key={index} className="hover-elevate transition-all duration-200" data-testid={`card-feature-${index}`}>
                    <CardHeader className="pb-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center mb-3">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <CardTitle className="text-base leading-snug">{feature}</CardTitle>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── How It Works — visual timeline ── */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-3">How it works</h2>
            <p className="text-lg text-muted-foreground">
              From first call to live agent — typically in four weeks.
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-10 left-[calc(16.66%+1.5rem)] right-[calc(16.66%+1.5rem)] h-px bg-border" />

            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, idx) => {
                const Icon = step.icon
                return (
                  <div key={step.number} className="flex flex-col items-center text-center relative">
                    {/* Circle node */}
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 relative z-10 border-2 ${idx === 0 ? 'bg-primary border-primary text-primary-foreground' : idx === 1 ? 'bg-background border-primary/60 text-primary' : 'bg-background border-border text-muted-foreground'}`}>
                      <Icon className="w-8 h-8" />
                    </div>

                    <div className="mb-1">
                      <Badge variant={idx === 0 ? 'default' : 'outline'} className="text-xs mb-2">
                        {step.timeframe}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-lg text-foreground mb-2">{step.label}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.detail}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── What Changes for Your Team ── */}
      {service.benefits && service.benefits.length > 0 && (
        <section className="py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-14 items-start">
              {/* Left: heading */}
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  What changes for<br />your team
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Less time on repetitive work. More time on the work that actually needs a person behind it.
                </p>

                {/* Mini diagram for mobile — show simplified version */}
                <div className="mt-8 lg:hidden p-6 bg-muted/50 rounded-xl border text-center">
                  <Bot className="w-10 h-10 text-primary mx-auto mb-2" />
                  <p className="text-sm font-semibold">Your AI Agent</p>
                  <p className="text-xs text-muted-foreground">handles the repetitive work</p>
                </div>
              </div>

              {/* Right: benefit list */}
              <div className="flex flex-col gap-4">
                {service.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-muted/40 border" data-testid={`benefit-${index}`}>
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <p className="text-foreground text-sm leading-relaxed">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Bottom CTA ── */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Zap className="w-10 h-10 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">Not sure if this fits your situation?</h2>
          <p className="text-lg opacity-80 mb-8">
            Answer a few questions about your workflow and we'll show you exactly what we'd build — and what it would take to get there.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/automation-discovery">
                <Sparkles className="mr-2 h-5 w-5" />
                Start the Discovery Process
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <a href="#contact">Talk to Us Directly</a>
            </Button>
          </div>
        </div>
      </section>

      <Contact />
      <Footer />
    </div>
  )
}
