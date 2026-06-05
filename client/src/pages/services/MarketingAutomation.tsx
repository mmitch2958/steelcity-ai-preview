import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Check, Zap, Sparkles, Users, Mail, Target, TrendingUp, Search, Wrench } from 'lucide-react'
import { Link } from 'wouter'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Contact from '@/components/Contact'
import { SEO, seoConfigs } from '@/components/SEO'
import { StructuredData, structuredDataConfigs } from '@/components/StructuredData'
import type { Service } from '@shared/schema'

function FunnelIllustration() {
  const tiers = [
    { label: 'Leads captured', count: '1,200', w: 'w-full', icon: Users },
    { label: 'Scored & sequenced', count: '480', w: 'w-3/4', icon: Target },
    { label: 'Converted', count: '96', w: 'w-1/2', icon: TrendingUp },
  ]
  return (
    <div className="flex flex-col items-center gap-0 w-full max-w-xs mx-auto select-none py-4">
      {tiers.map(({ label, count, w, icon: Icon }, i) => (
        <div key={i} className="w-full flex flex-col items-center">
          <div className={`${w} transition-all`}>
            <div className={`flex items-center justify-between px-5 py-4 ${i === 0 ? 'bg-amber-500 text-white rounded-t-xl' : i === 1 ? 'bg-amber-400 text-white' : 'bg-amber-300 text-amber-900 rounded-b-xl'}`}>
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{label}</span>
              </div>
              <span className="font-bold text-sm">{count}</span>
            </div>
          </div>
          {i < tiers.length - 1 && <div className="w-0.5 h-3 bg-amber-300" />}
        </div>
      ))}
      <div className="mt-4 text-xs text-muted-foreground text-center">Handled automatically by your agent</div>
    </div>
  )
}

const beforeAfter = [
  { before: 'Manually writing follow-up emails one by one', after: 'Agent sends personalized sequences automatically' },
  { before: 'Guessing which leads to call first', after: 'Every lead scored by behavior and fit' },
  { before: 'Re-engaging cold leads takes hours each week', after: 'Re-engagement runs on autopilot based on triggers' },
  { before: 'Reports pulled manually every month', after: 'Plain-English performance summaries delivered to your inbox' },
]

export default function MarketingAutomation() {
  const { data: services, isLoading } = useQuery<Service[]>({ queryKey: ['/api/services'] })
  const service = services?.find(s => s.slug === 'marketing-automation')

  if (isLoading) return <div className="min-h-screen bg-background"><Header /><div className="h-96 flex items-center justify-center"><div className="animate-spin h-10 w-10 border-b-2 border-primary rounded-full" /></div><Footer /></div>
  if (!service) return <div className="min-h-screen bg-background"><Header /><div className="h-96 flex items-center justify-center text-muted-foreground">Service not found.</div><Footer /></div>

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO {...seoConfigs.marketingAutomation} />
      <StructuredData
        type="Service"
        data={structuredDataConfigs.service({
          name: "AI Marketing Automation",
          description: "AI-driven marketing optimization and campaign automation services",
          provider: "Steel City AI",
          areaServed: "United States"
        })}
      />
      <Header />

      {/* ── Hero — amber warm, reversed 2-col ── */}
      <section className="py-20 bg-amber-50/70 dark:bg-amber-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="hidden lg:flex flex-col items-center justify-center">
              <FunnelIllustration />
            </div>
            <div>
              <Badge className="mb-4 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100">
                {service.category}
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-5 leading-tight">
                {service.title}
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {service.longDescription || service.description}
              </p>
              <div className="flex flex-wrap gap-6 mb-10">
                {[{ s: 'Zero', l: 'missed follow-ups' }, { s: 'Auto', l: 'lead scoring' }, { s: '4 wks', l: 'to go live' }].map(({ s, l }) => (
                  <div key={s}><p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{s}</p><p className="text-sm text-muted-foreground">{l}</p></div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white border-amber-700" asChild><a href="#contact">Talk to Us <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
                <Button size="lg" variant="outline" asChild><Link href="/automation-discovery">Discover Your Use Case</Link></Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features — before / after comparison ── */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-2">Before vs. after your agent</h2>
          <p className="text-muted-foreground mb-12">The work doesn't go away — it just stops requiring a person.</p>
          <div className="rounded-xl overflow-hidden border bg-border flex flex-col gap-px">
            {/* Headers */}
            <div className="grid grid-cols-2 gap-px">
              <div className="bg-muted/60 px-6 py-3 font-semibold text-sm text-muted-foreground uppercase tracking-wide">Before</div>
              <div className="bg-amber-600 px-6 py-3 font-semibold text-sm text-white uppercase tracking-wide">After your agent</div>
            </div>
            {/* Rows */}
            {beforeAfter.map(({ before, after }, i) => (
              <div key={i} className="grid grid-cols-2 gap-px">
                <div className={`px-6 py-4 text-sm text-muted-foreground ${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>{before}</div>
                <div className={`px-6 py-4 text-sm text-foreground font-medium flex items-start gap-2 ${i % 2 === 0 ? 'bg-amber-50/60 dark:bg-amber-950/10' : 'bg-amber-50/30 dark:bg-amber-950/5'}`}>
                  <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  {after}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Capabilities ── */}
      {service.features?.length > 0 && (
        <section className="py-24 bg-muted/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-2 text-center">Full capabilities</h2>
            <p className="text-muted-foreground text-center mb-12">Plugs into the marketing stack you already have.</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {service.features.map((f, i) => {
                const icons = [Mail, Target, TrendingUp, TrendingUp, ArrowRight]
                const Icon = icons[i] ?? Mail
                return (
                  <div key={i} className="flex items-start gap-3 p-5 rounded-xl bg-card border hover-elevate">
                    <div className="w-8 h-8 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
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
          <div className="text-center mb-14"><h2 className="text-3xl font-bold mb-3">From call to live agent</h2><p className="text-muted-foreground">Four weeks. Then it runs itself.</p></div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { w: 'Week 1', t: 'Discovery', d: 'We map your current outreach process — what tools you use, how leads flow, where the gaps are.', icon: Search },
              { w: 'Weeks 2–3', t: 'Build', d: 'Your agent is set up and integrated. We test it against your real leads and campaigns before go-live.', icon: Wrench },
              { w: 'Week 4', t: 'Deploy', d: 'Live. First sequences running. We monitor early results together and dial in the configuration.', icon: Zap },
            ].map((s, i) => {
              const Icon = s.icon
              return (
                <div key={i} className={`p-6 rounded-xl border text-center ${i === 1 ? 'bg-amber-600 text-white border-amber-600' : 'bg-card'}`}>
                  <Icon className={`w-6 h-6 mx-auto mb-3 ${i === 1 ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`} />
                  <Badge variant={i === 1 ? 'secondary' : 'outline'} className="mb-3 text-xs">{s.w}</Badge>
                  <h3 className={`font-bold text-lg mb-2 ${i === 1 ? 'text-white' : ''}`}>{s.t}</h3>
                  <p className={`text-sm ${i === 1 ? 'text-white/80' : 'text-muted-foreground'}`}>{s.d}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-amber-600 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <TrendingUp className="w-10 h-10 mx-auto mb-4 opacity-70" />
          <h2 className="text-3xl font-bold mb-4">Ready to stop losing leads to slow follow-up?</h2>
          <p className="opacity-80 mb-8 text-lg">Tell us about your pipeline and we'll show you exactly what the agent would automate.</p>
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
