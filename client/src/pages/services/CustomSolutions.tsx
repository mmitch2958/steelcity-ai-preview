import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Check, Zap, Sparkles, Wrench, Plug, Search, Settings, Bot, FolderCheck } from 'lucide-react'
import { Link } from 'wouter'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Contact from '@/components/Contact'
import { SEO, seoConfigs } from '@/components/SEO'
import { StructuredData, structuredDataConfigs } from '@/components/StructuredData'
import type { Service } from '@shared/schema'

const featureIcons = [Search, Wrench, Plug, Zap, Settings]

export default function CustomSolutions() {
  const { data: services, isLoading } = useQuery<Service[]>({ queryKey: ['/api/services'] })
  const service = services?.find(s => s.slug === 'custom-solutions')

  if (isLoading) return <div className="min-h-screen bg-background"><Header /><div className="h-96 flex items-center justify-center"><div className="animate-spin h-10 w-10 border-b-2 border-primary rounded-full" /></div><Footer /></div>
  if (!service) return <div className="min-h-screen bg-background"><Header /><div className="h-96 flex items-center justify-center text-muted-foreground">Service not found.</div><Footer /></div>

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO {...seoConfigs.customSolutions} />
      <StructuredData
        type="Service"
        data={structuredDataConfigs.service({
          name: "Custom AI Solutions for Business",
          description: "Tailor-made AI integration and custom business process automation",
          provider: "Steel City AI",
          areaServed: "United States"
        })}
      />
      <Header />

      {/* ── Hero — blueprint dot-grid bg, centered ── */}
      <section
        className="py-24 relative overflow-hidden"
        style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      >
        <div className="absolute inset-0 bg-background/80" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100">
            {service.category}
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 leading-tight">
            {service.title}
          </h1>
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
            {service.longDescription || service.description}
          </p>

          {/* Blueprint-style "spec card" */}
          <div className="max-w-lg mx-auto mb-12 bg-card border border-indigo-200 dark:border-indigo-800 rounded-xl p-5 text-left shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-indigo-100 dark:border-indigo-900/30">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Custom Build Spec</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Workflow', 'Your actual process'],
                ['Integrations', 'Any API or system'],
                ['Timeline', '3–5 weeks'],
                ['Ownership', 'You keep the code'],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{k}</span>
                  <span className="font-semibold text-foreground text-xs">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-8 mb-10">
            {[{ s: 'Bespoke', l: 'built for your workflow' }, { s: 'Zero', l: 'off-the-shelf limits' }, { s: 'Yours', l: 'you own the code' }].map(({ s, l }) => (
              <div key={s}><p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{s}</p><p className="text-sm text-muted-foreground">{l}</p></div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700" asChild><a href="#contact">Talk to Us <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
            <Button size="lg" variant="outline" asChild><Link href="/automation-discovery">Discover Your Use Case</Link></Button>
          </div>
        </div>
      </section>

      {/* ── Features — large numbered boxes ── */}
      {service.features?.length > 0 && (
        <section className="py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-2">How we approach a custom build</h2>
            <p className="text-muted-foreground mb-14">Every engagement is different. This is always how we start.</p>
            <div className="grid md:grid-cols-2 gap-5">
              {service.features.map((f, i) => {
                const Icon = featureIcons[i] ?? Wrench
                return (
                  <div key={i} className="group relative flex gap-5 p-6 rounded-xl border bg-card hover-elevate transition-all">
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <span className="text-5xl font-black text-indigo-100 dark:text-indigo-900 leading-none select-none">{String(i + 1).padStart(2, '0')}</span>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-md bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 pt-2">
                      <p className="text-foreground font-medium leading-relaxed text-sm">{f}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── How it works — editorial vertical ── */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14"><h2 className="text-3xl font-bold mb-3">How a custom build works</h2><p className="text-muted-foreground">We move fast without cutting corners on understanding your actual workflow.</p></div>
          <div className="space-y-0">
            {[
              { w: 'Week 1', t: 'We learn how you actually work', d: 'Deep discovery sessions to map the workflow, understand the edge cases, and define what done looks like.', icon: Search },
              { w: 'Weeks 2–3', t: 'You see it working early', d: 'Weekly demos of real progress. You\'re not waiting until the end to see the agent handle your data.', icon: Wrench },
              { w: 'Week 4+', t: 'Live — and improving', d: 'The agent goes live. We stay close for the first month to tune anything that needs adjusting.', icon: FolderCheck },
            ].map((s, i) => {
              const Icon = s.icon
              return (
                <div key={i} className="flex gap-6 pb-10">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 border-2 border-indigo-300 dark:border-indigo-700 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    {i < 2 && <div className="flex-1 w-px bg-indigo-200 dark:bg-indigo-800 mt-2" />}
                  </div>
                  <div className="pb-2">
                    <Badge variant="outline" className="mb-2 text-xs border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">{s.w}</Badge>
                    <h3 className="font-bold text-lg mb-2">{s.t}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{s.d}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Benefits — clean two-column ── */}
      {service.benefits?.length > 0 && (
        <section className="py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-2 text-center">Why go custom</h2>
            <p className="text-muted-foreground text-center mb-12">When the generic tools stop fitting, a custom build is usually faster than you think.</p>
            <div className="grid md:grid-cols-2 gap-4">
              {service.benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-3 p-5 rounded-xl border bg-card">
                  <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="text-sm text-foreground">{b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="py-20 bg-indigo-700 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Bot className="w-10 h-10 mx-auto mb-4 opacity-70" />
          <h2 className="text-3xl font-bold mb-4">Have something specific in mind?</h2>
          <p className="opacity-80 mb-8 text-lg">Describe your workflow and we'll tell you exactly what we'd build — and how long it would take.</p>
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
