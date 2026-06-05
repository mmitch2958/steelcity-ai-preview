import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Check, Zap, Sparkles, BarChart2, TrendingUp, AlertCircle, Mail, Database, Search, Wrench } from 'lucide-react'
import { Link } from 'wouter'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Contact from '@/components/Contact'
import { SEO, seoConfigs } from '@/components/SEO'
import { StructuredData, structuredDataConfigs } from '@/components/StructuredData'
import type { Service } from '@shared/schema'

function ChartIllustration() {
  const bars = [
    { h: 40, label: 'Mon' },
    { h: 65, label: 'Tue' },
    { h: 50, label: 'Wed' },
    { h: 80, label: 'Thu' },
    { h: 55, label: 'Fri' },
    { h: 95, label: 'Sat' },
    { h: 70, label: 'Sun' },
  ]
  const maxH = 100
  const svgH = 120

  return (
    <div className="w-full max-w-sm mx-auto select-none">
      <div className="bg-card border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Weekly Revenue</p>
            <p className="text-2xl font-bold text-foreground">$84,320</p>
          </div>
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
            <TrendingUp className="w-4 h-4" />
            +12.4%
          </div>
        </div>
        <svg viewBox={`0 0 ${bars.length * 36} ${svgH + 20}`} className="w-full">
          {/* Trend line */}
          <polyline
            fill="none"
            stroke="rgb(16,185,129)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={bars.map((b, i) => `${i * 36 + 18},${svgH - (b.h / maxH) * svgH * 0.8}`).join(' ')}
          />
          {bars.map((b, i) => (
            <g key={i}>
              <rect
                x={i * 36 + 6}
                y={svgH - (b.h / maxH) * svgH * 0.8}
                width={24}
                height={(b.h / maxH) * svgH * 0.8}
                fill={i === 5 ? 'rgb(16,185,129)' : 'rgba(16,185,129,0.25)'}
                rx={3}
              />
              <text x={i * 36 + 18} y={svgH + 14} textAnchor="middle" fontSize="9" fill="currentColor" className="text-muted-foreground" opacity="0.5">{b.label}</text>
            </g>
          ))}
          {/* Anomaly marker */}
          <circle cx={5 * 36 + 18} cy={svgH - (95 / maxH) * svgH * 0.8} r={4} fill="none" stroke="rgb(16,185,129)" strokeWidth="2" />
        </svg>
        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-md">
          <Sparkles className="w-3 h-3" />
          Insight: Saturday spike linked to email campaign from Thu
        </div>
      </div>
    </div>
  )
}

const metricFeatures = [
  { stat: '90%', statLabel: 'less manual analysis', feature: 0 },
  { stat: 'Daily', statLabel: 'automated reports', feature: 1 },
  { stat: 'Real-time', statLabel: 'anomaly detection', feature: 2 },
  { stat: 'Plain English', statLabel: 'no SQL required', feature: 3 },
  { stat: 'Auto-delivered', statLabel: 'to your inbox or Slack', feature: 4 },
]

export default function DataAnalysis() {
  const { data: services, isLoading } = useQuery<Service[]>({ queryKey: ['/api/services'] })
  const service = services?.find(s => s.slug === 'data-analysis')

  if (isLoading) return <div className="min-h-screen bg-background"><Header /><div className="h-96 flex items-center justify-center"><div className="animate-spin h-10 w-10 border-b-2 border-primary rounded-full" /></div><Footer /></div>
  if (!service) return <div className="min-h-screen bg-background"><Header /><div className="h-96 flex items-center justify-center text-muted-foreground">Service not found.</div><Footer /></div>

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO {...seoConfigs.dataAnalysis} />
      <StructuredData
        type="Service"
        data={structuredDataConfigs.service({
          name: "AI Data Analysis & Business Intelligence",
          description: "Advanced analytics and business intelligence solutions powered by AI agents",
          provider: "Steel City AI",
          areaServed: "United States"
        })}
      />
      <Header />

      {/* ── Hero — centered, chart illustration above text ── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100">
            {service.category}
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-5 leading-tight">
            {service.title}
          </h1>
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
            {service.longDescription || service.description}
          </p>
          <div className="mb-12 max-w-sm mx-auto">
            <ChartIllustration />
          </div>
          <div className="flex flex-wrap justify-center gap-8 mb-10">
            {[{ s: 'Zero', l: 'new dashboards to learn' }, { s: 'Auto', l: 'scheduled delivery' }, { s: '4 wks', l: 'to first report' }].map(({ s, l }) => (
              <div key={s}><p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{s}</p><p className="text-sm text-muted-foreground">{l}</p></div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild><a href="#contact">Talk to Us <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
            <Button size="lg" variant="outline" asChild><Link href="/automation-discovery">Discover Your Use Case</Link></Button>
          </div>
        </div>
      </section>

      {/* ── Features — metric-first cards ── */}
      {service.features?.length > 0 && (
        <section className="py-24 bg-muted/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-2 text-center">What your agent delivers</h2>
            <p className="text-muted-foreground text-center mb-12">Insights come to you. No dashboard to remember to check.</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {service.features.map((f, i) => {
                const m = metricFeatures[i]
                const icons = [Database, BarChart2, AlertCircle, Mail, Sparkles]
                const Icon = icons[i] ?? BarChart2
                return (
                  <div key={i} className="p-6 rounded-xl border bg-card hover-elevate transition-all flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-9 h-9 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      {m && (
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{m.stat}</p>
                          <p className="text-[10px] text-muted-foreground leading-tight">{m.statLabel}</p>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-foreground font-medium leading-relaxed">{f}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── How it works ── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14"><h2 className="text-3xl font-bold mb-3">How we get there</h2><p className="text-muted-foreground">Four weeks from first call to your first automated report.</p></div>
          <div className="relative">
            <div className="hidden md:block absolute top-10 left-[calc(16.66%+1.5rem)] right-[calc(16.66%+1.5rem)] h-px bg-emerald-200 dark:bg-emerald-800" />
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { w: 'Week 1', t: 'Connect', d: 'We identify your data sources and what questions you most need answered.', icon: Search },
                { w: 'Weeks 2–3', t: 'Build', d: 'Reports are built, scheduled, and formatted for your team\'s workflow.', icon: Wrench },
                { w: 'Week 4', t: 'Deliver', d: 'First automatic reports land in your inbox. Tune the cadence and format as needed.', icon: Zap },
              ].map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={i} className="flex flex-col items-center text-center">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 relative z-10 border-2 ${i === 1 ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-background border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400'}`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <Badge variant={i === 1 ? 'default' : 'outline'} className={`mb-2 text-xs ${i === 1 ? 'bg-emerald-600' : 'border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400'}`}>{s.w}</Badge>
                    <h3 className="font-bold text-lg mb-2">{s.t}</h3>
                    <p className="text-sm text-muted-foreground">{s.d}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Benefits — 2-col checklist in tinted boxes ── */}
      {service.benefits?.length > 0 && (
        <section className="py-24 bg-emerald-50/50 dark:bg-emerald-950/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-2 text-center">What changes</h2>
            <p className="text-muted-foreground text-center mb-12">Your team stops hunting for answers. The answers come to them.</p>
            <div className="grid md:grid-cols-2 gap-4">
              {service.benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-3 p-5 rounded-xl bg-white dark:bg-card border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-sm text-foreground">{b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="py-20 bg-emerald-700 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <BarChart2 className="w-10 h-10 mx-auto mb-4 opacity-70" />
          <h2 className="text-3xl font-bold mb-4">What would you know if the data surfaced itself?</h2>
          <p className="opacity-80 mb-8 text-lg">Tell us where your data lives and we'll show you what your agent could report on.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild><Link href="/automation-discovery"><Sparkles className="mr-2 h-4 w-4" />Start Discovery</Link></Button>
            <Button size="lg" className="border-white/40 text-white bg-transparent border hover:bg-white/10" asChild><a href="#contact">Talk to Us</a></Button>
          </div>
        </div>
      </section>

      <Contact />
      <Footer />
    </div>
  )
}
