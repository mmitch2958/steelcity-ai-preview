import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Check, Database, Zap, Sparkles, Search, Wrench } from 'lucide-react'
import { Link } from 'wouter'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Contact from '@/components/Contact'
import { SEO, seoConfigs } from '@/components/SEO'
import { StructuredData, structuredDataConfigs } from '@/components/StructuredData'
import type { Service } from '@shared/schema'

function DocIllustration() {
  return (
    <div className="relative w-full h-72 flex items-center justify-center select-none">
      <div className="absolute w-52 h-64 bg-sky-100 dark:bg-sky-900/20 rounded-xl border border-sky-200 dark:border-sky-800 rotate-6 translate-x-8 translate-y-2" />
      <div className="absolute w-52 h-64 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800 rotate-2 translate-x-3" />
      <div className="absolute w-52 h-64 bg-white dark:bg-card rounded-xl border border-sky-200 dark:border-sky-700 shadow-lg flex flex-col gap-2.5 p-5">
        <div className="w-full h-0.5 bg-sky-400/60 rounded-full animate-pulse" />
        <div className="w-3/4 h-2 bg-muted rounded-full mt-1" />
        <div className="w-full h-2 bg-muted rounded-full" />
        <div className="w-5/6 h-2 bg-muted rounded-full" />
        <div className="w-3/4 h-2 bg-muted rounded-full" />
        <div className="w-full h-2 bg-muted rounded-full" />
        <div className="mt-3 space-y-1.5">
          {['Amount: $4,280', 'Vendor: Acme Supply', 'Date: 03/04/26'].map(t => (
            <div key={t} className="px-2 py-1 bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-[11px] rounded font-mono w-fit">{t}</div>
          ))}
        </div>
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
        <ArrowRight className="w-5 h-5 text-sky-400" />
        <div className="w-11 h-11 rounded-full bg-sky-100 dark:bg-sky-900/40 border border-sky-200 dark:border-sky-700 flex items-center justify-center shadow">
          <Database className="w-5 h-5 text-sky-600 dark:text-sky-400" />
        </div>
      </div>
    </div>
  )
}

export default function DocumentProcessing() {
  const { data: services, isLoading } = useQuery<Service[]>({ queryKey: ['/api/services'] })
  const service = services?.find(s => s.slug === 'document-processing')

  const howItWorks = [
    { step: '01', label: 'Discovery', time: 'Week 1', desc: 'We inventory your document types — invoices, forms, contracts — and map exactly what data needs to go where.', icon: Search },
    { step: '02', label: 'Build', time: 'Weeks 2–3', desc: 'Your agent is built and connected to your existing tools. You see it processing real documents before it goes live.', icon: Wrench },
    { step: '03', label: 'Deploy', time: 'Week 4', desc: 'The agent goes live, handling volume immediately. We tune edge cases and hand off a fully autonomous system.', icon: Zap },
  ]

  if (isLoading) return <div className="min-h-screen bg-background"><Header /><div className="h-96 flex items-center justify-center"><div className="animate-spin h-10 w-10 border-b-2 border-primary rounded-full" /></div><Footer /></div>
  if (!service) return <div className="min-h-screen bg-background"><Header /><div className="h-96 flex items-center justify-center text-muted-foreground">Service not found.</div><Footer /></div>

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO {...seoConfigs.documentProcessing} />
      <StructuredData
        type="Service"
        data={structuredDataConfigs.service({
          name: "Document Processing Automation",
          description: "AI-powered document processing and data extraction services",
          provider: "Steel City AI",
          areaServed: "United States"
        })}
      />
      <Header />

      {/* ── Hero — sky accent, 2-col, doc illustration ── */}
      <section className="py-20 bg-sky-50/60 dark:bg-sky-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 hover:bg-sky-100 border-sky-200 dark:border-sky-800">
                {service.category}
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-5 leading-tight">
                {service.title}
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {service.longDescription || service.description}
              </p>
              <div className="flex flex-wrap gap-6 mb-10">
                {[{ s: '90%', l: 'less manual entry' }, { s: '4 wks', l: 'to go live' }, { s: '99%+', l: 'accuracy' }].map(({ s, l }) => (
                  <div key={s}><p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{s}</p><p className="text-sm text-muted-foreground">{l}</p></div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild><a href="#contact">Talk to Us <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
                <Button size="lg" variant="outline" asChild><Link href="/automation-discovery">Discover Your Use Case</Link></Button>
              </div>
            </div>
            <div className="hidden lg:block"><DocIllustration /></div>
          </div>
        </div>
      </section>

      {/* ── Features — numbered horizontal rows ── */}
      {service.features?.length > 0 && (
        <section className="py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-2">What the agent does</h2>
            <p className="text-muted-foreground mb-12">Built around the documents you already receive.</p>
            <div className="flex flex-col gap-4">
              {service.features.map((f, i) => (
                <div key={i} className="flex items-start gap-5 p-5 rounded-xl border bg-card hover-elevate transition-all">
                  <span className="text-3xl font-black text-sky-200 dark:text-sky-800 leading-none flex-shrink-0 w-10 text-right">{String(i + 1).padStart(2, '0')}</span>
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0 mt-0.5" />
                    <p className="text-foreground font-medium">{f}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── How it works — horizontal steps ── */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14"><h2 className="text-3xl font-bold mb-3">How it works</h2><p className="text-muted-foreground">Live in about four weeks.</p></div>
          <div className="grid md:grid-cols-3 gap-6">
            {howItWorks.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={s.step} className={`p-6 rounded-xl border ${i === 0 ? 'bg-sky-600 text-white border-sky-600' : 'bg-card'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className={`w-6 h-6 ${i === 0 ? 'text-white' : 'text-sky-600 dark:text-sky-400'}`} />
                    <Badge variant={i === 0 ? 'secondary' : 'outline'} className="text-xs">{s.time}</Badge>
                  </div>
                  <h3 className={`font-bold text-lg mb-2 ${i === 0 ? 'text-white' : ''}`}>{s.label}</h3>
                  <p className={`text-sm leading-relaxed ${i === 0 ? 'text-white/80' : 'text-muted-foreground'}`}>{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      {service.benefits?.length > 0 && (
        <section className="py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">What changes</h2>
                <p className="text-muted-foreground text-lg leading-relaxed">Your team stops being the bridge between your inbox and your database. The agent does it, automatically, every time.</p>
              </div>
              <div className="space-y-3">
                {service.benefits.map((b, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-sky-50/60 dark:bg-sky-950/10 border border-sky-100 dark:border-sky-900/30">
                    <Check className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">{b}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="py-20 bg-sky-600 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Zap className="w-10 h-10 mx-auto mb-4 opacity-70" />
          <h2 className="text-3xl font-bold mb-4">Ready to stop keying data manually?</h2>
          <p className="opacity-80 mb-8 text-lg">Tell us about your documents and we'll show you exactly what the agent would do.</p>
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
