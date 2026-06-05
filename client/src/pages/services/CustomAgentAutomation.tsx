import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Bot, Check, Zap, Sparkles, Clock, Search, Wrench, Plug, AlertCircle } from 'lucide-react'
import { Link } from 'wouter'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Contact from '@/components/Contact'
import { SEO, seoConfigs } from '@/components/SEO'
import { StructuredData, structuredDataConfigs } from '@/components/StructuredData'
import type { Service } from '@shared/schema'

function NetworkIllustration() {
  const nodes = [
    { icon: Clock,       label: 'Scheduler',  angle: 270, color: 'violet' },
    { icon: Plug,        label: 'CRM / ERP',  angle: 342, color: 'violet' },
    { icon: AlertCircle, label: 'Escalation', angle: 54,  color: 'violet' },
    { icon: Check,       label: 'Completed',  angle: 126, color: 'violet' },
    { icon: Zap,         label: 'Triggers',   angle: 198, color: 'violet' },
  ]
  const r = 90
  const cx = 140, cy = 130

  return (
    <div className="relative w-full h-64 flex items-center justify-center select-none">
      <svg viewBox="0 0 280 260" className="w-full h-full">
        {nodes.map((n, i) => {
          const rad = (n.angle * Math.PI) / 180
          const nx = cx + r * Math.cos(rad)
          const ny = cy + r * Math.sin(rad)
          return (
            <line key={i} x1={cx} y1={cy} x2={nx} y2={ny}
              stroke="rgba(139,92,246,0.3)" strokeWidth="1.5" strokeDasharray="4 3" />
          )
        })}
        {/* Center: AI Agent */}
        <circle cx={cx} cy={cy} r={36} fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.5)" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r={28} fill="rgba(139,92,246,0.2)" stroke="rgba(139,92,246,0.6)" strokeWidth="1" />
        <text x={cx} y={cy - 6} textAnchor="middle" fill="rgba(139,92,246,0.9)" fontSize="11" fontWeight="700">AI</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fill="rgba(139,92,246,0.9)" fontSize="11" fontWeight="700">Agent</text>
        {/* Outer nodes */}
        {nodes.map((n, i) => {
          const rad = (n.angle * Math.PI) / 180
          const nx = cx + r * Math.cos(rad)
          const ny = cy + r * Math.sin(rad)
          return (
            <g key={i}>
              <circle cx={nx} cy={ny} r={22} fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.35)" strokeWidth="1.2" />
              <text x={nx} y={ny + 4} textAnchor="middle" fill="rgba(139,92,246,0.75)" fontSize="9" fontWeight="600">{n.label}</text>
            </g>
          )
        })}
        {/* Pulse ring */}
        <circle cx={cx} cy={cy} r={36} fill="none" stroke="rgba(139,92,246,0.2)" strokeWidth="8">
          <animate attributeName="r" values="36;52;36" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0;0.4" dur="2.5s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  )
}

const featureIcons = [Zap, Plug, Bot, AlertCircle, Clock]
const featureSizes = ['lg:col-span-2', 'lg:col-span-1', 'lg:col-span-1', 'lg:col-span-1', 'lg:col-span-2']

export default function CustomAgentAutomation() {
  const { data: services, isLoading } = useQuery<Service[]>({ queryKey: ['/api/services'] })
  const service = services?.find(s => s.slug === 'custom-agent-automation')

  if (isLoading) return <div className="min-h-screen bg-background"><Header /><div className="h-96 flex items-center justify-center"><div className="animate-spin h-10 w-10 border-b-2 border-primary rounded-full" /></div><Footer /></div>
  if (!service) return <div className="min-h-screen bg-background"><Header /><div className="h-96 flex items-center justify-center text-muted-foreground">Service not found.</div><Footer /></div>

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO {...seoConfigs.customAgentAutomation} />
      <StructuredData
        type="Service"
        data={structuredDataConfigs.service({
          name: "Custom AI Agent Automation",
          description: "Autonomous AI agents that handle administrative tasks with human-like intelligence",
          provider: "Steel City AI",
          areaServed: "United States"
        })}
      />
      <Header />

      {/* ── Hero — dark/inverted, network illustration ── */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 hidden lg:block opacity-80">
              <NetworkIllustration />
            </div>
            <div className="order-1 lg:order-2">
              <Badge className="mb-4 bg-violet-400/20 text-violet-200 border-violet-400/30 hover:bg-violet-400/20">
                {service.category}
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-bold mb-5 leading-tight">
                {service.title}
              </h1>
              <p className="text-lg opacity-80 mb-8 leading-relaxed">
                {service.longDescription || service.description}
              </p>
              <div className="flex flex-wrap gap-8 mb-10">
                {[{ s: '24/7', l: 'runs without supervision' }, { s: 'Weeks', l: 'not months' }, { s: 'Zero', l: 'new tools required' }].map(({ s, l }) => (
                  <div key={s}><p className="text-2xl font-bold text-violet-300">{s}</p><p className="text-sm opacity-60">{l}</p></div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" variant="secondary" asChild><a href="#contact">Talk to Us <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
                <Button size="lg" className="border-white/30 text-white bg-transparent border hover:bg-white/10" asChild><Link href="/automation-discovery">Discover Your Use Case</Link></Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features — bento grid ── */}
      {service.features?.length > 0 && (
        <section className="py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-2">What your agent does</h2>
            <p className="text-muted-foreground mb-12">End-to-end. Across all your systems. Without supervision.</p>
            <div className="grid lg:grid-cols-3 gap-4">
              {service.features.map((f, i) => {
                const Icon = featureIcons[i] ?? Bot
                const isWide = featureSizes[i] === 'lg:col-span-2'
                return (
                  <div key={i} className={`${featureSizes[i]} p-6 rounded-xl border bg-card hover-elevate transition-all ${isWide ? 'flex items-start gap-5' : 'flex flex-col gap-4'}`}>
                    <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <p className="text-sm text-foreground font-medium leading-relaxed">{f}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── How it works — vertical timeline ── */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14"><h2 className="text-3xl font-bold mb-3">From call to live agent</h2><p className="text-muted-foreground">Typically four weeks, start to finish.</p></div>
          <div className="relative pl-8 border-l-2 border-violet-200 dark:border-violet-800 space-y-10">
            {[
              { w: 'Week 1',   t: 'Discovery',  d: 'We map your workflow — what triggers the process, what decisions it makes, where the data goes.' },
              { w: 'Weeks 2–3',t: 'Build',       d: 'Your agent is built and connected to your tools. You watch it handle real tasks before go-live.' },
              { w: 'Week 4',   t: 'Deploy',      d: 'Live. Running. We monitor the first cycles with you and tune any edge cases.' },
            ].map((s, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[2.35rem] w-5 h-5 rounded-full border-2 border-violet-400 bg-background flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                </div>
                <Badge variant="outline" className="mb-2 text-xs border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400">{s.w}</Badge>
                <h3 className="font-bold text-lg mb-1">{s.t}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits — 2-col horizontal strips ── */}
      {service.benefits?.length > 0 && (
        <section className="py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-2 text-center">Built to free your team</h2>
            <p className="text-muted-foreground text-center mb-12">Not just to automate a step — to remove the whole burden.</p>
            <div className="grid md:grid-cols-2 gap-4">
              {service.benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl border-l-4 border-l-violet-400 border bg-card">
                  <Check className="w-4 h-4 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">{b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="py-20 bg-violet-600 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Bot className="w-10 h-10 mx-auto mb-4 opacity-70" />
          <h2 className="text-3xl font-bold mb-4">What would your agent handle?</h2>
          <p className="opacity-80 mb-8 text-lg">Answer a few questions about your workflow and we'll design the agent for you.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild><Link href="/automation-discovery"><Sparkles className="mr-2 h-4 w-4" />Start Discovery</Link></Button>
            <Button size="lg" className="border-white/40 text-white bg-transparent border hover:bg-white/10" asChild><a href="#contact">Talk Directly</a></Button>
          </div>
        </div>
      </section>

      <Contact />
      <Footer />
    </div>
  )
}
