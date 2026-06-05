import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, Plug, BookOpen, Clock } from 'lucide-react'
import { Link } from 'wouter'
import heroImage from '@assets/generated_images/AI_automation_hero_banner_93825f80.png'

const trustPoints = [
  { icon: Plug, label: 'Connects to your existing systems' },
  { icon: BookOpen, label: 'No new software to learn' },
  { icon: Clock, label: 'First agent live in 4 weeks' },
]

export default function Hero() {
  const handleLearnMore = () => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Dark Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="AI automation technology workspace"
          className="w-full h-full object-cover"
          width={1408}
          height={768}
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/90 mb-8">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Custom AI agents — built for your business
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight" data-testid="text-hero-title">
            We build the AI that fits
            <span className="text-blue-400 block mt-1">how you already work</span>
          </h1>

          <p className="text-xl sm:text-2xl text-gray-200 mb-10 leading-relaxed max-w-3xl mx-auto" data-testid="text-hero-subtitle">
            No new platforms. No ripping out your systems. Just custom AI agents that plug into
            your existing tools and automate the work that slows your team down.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/automation-discovery">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground px-8"
                data-testid="button-discover-automation"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                See What We'd Build for You
              </Button>
            </Link>

            <Button
              variant="outline"
              size="lg"
              onClick={handleLearnMore}
              className="bg-white/10 backdrop-blur-sm text-white border-white/30 px-8"
              data-testid="button-learn-more"
            >
              See Our Services
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Trust bar */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
            {trustPoints.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-white/90 text-sm">
                <Icon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
