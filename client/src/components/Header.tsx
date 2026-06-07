import { useState, lazy, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X, MessageCircle, Sparkles, Loader2 } from 'lucide-react'
import { useLocation, Link } from 'wouter'
import ThemeToggle from './ThemeToggle'
import logoImage from '@assets/SquareSteelCityLogo.svg'

// Lazy-load heavy components for better initial page load performance
const ProgressiveDiscoveryForm = lazy(() => import('./ProgressiveDiscoveryForm'))
const ChatWidget = lazy(() => import('./ChatWidget'))

// Graceful fallback UI while components load
const LazyFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="w-6 h-6 animate-spin text-primary" />
    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
  </div>
)

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [consultationOpen, setConsultationOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [location, setLocation] = useLocation()

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const handleNavClick = (section: string) => {
    setMobileMenuOpen(false)
    const elementId = section.toLowerCase().replace(' ', '-')
    if (location === '/') {
      document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      setLocation(`/#${elementId}`)
      setTimeout(() => {
        document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[80px]">
          {/* Logo */}
          <Link href="/">
            <div className="flex-shrink-0 cursor-pointer">
              <img
                src={logoImage}
                alt="Steel City AI"
                className="h-[64px] w-auto object-contain"
                width={64}
                height={64}
                loading="eager"
                decoding="async"
                data-testid="img-logo"
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <button
              onClick={() => handleNavClick('Services')}
              className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium transition-colors"
              data-testid="link-nav-services"
            >
              Services
            </button>
            <Link
              href="/services/onboarding-service"
              className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium transition-colors"
              data-testid="link-nav-onboarding"
            >
              Onboarding
            </Link>
            <Link
              href="/ai-employees"
              className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium transition-colors"
              data-testid="link-nav-ai-employees"
            >
              AI Employees
            </Link>
            {['Case Studies', 'About', 'Contact'].map((item) => (
              <button
                key={item}
                onClick={() => handleNavClick(item)}
                className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium transition-colors"
                data-testid={`link-nav-${item.toLowerCase().replace(' ', '-')}`}
              >
                {item}
              </button>
            ))}
          </nav>

          {/* Theme Toggle & CTA Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <Link href="/automation-discovery">
              <Button
                variant="outline"
                className="border-primary text-primary"
                data-testid="button-discover-ai"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Discover AI
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => setChatOpen(!chatOpen)}
              aria-label="Open chat"
              data-testid="button-chat"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </Button>
            <Button
              onClick={() => setConsultationOpen(true)}
              data-testid="button-get-consultation"
            >
              Consultation
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/60 bg-background">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button
                onClick={() => handleNavClick('Services')}
                className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground w-full text-left transition-colors"
                data-testid="link-mobile-nav-services"
              >
                Services
              </button>
              <Link
                href="/services/onboarding-service"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground w-full text-left transition-colors"
                data-testid="link-mobile-nav-onboarding"
              >
                Onboarding
              </Link>
              <Link
                href="/ai-employees"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground w-full text-left transition-colors"
                data-testid="link-mobile-nav-ai-employees"
              >
                AI Employees
              </Link>
              {['Case Studies', 'About', 'Contact'].map((item) => (
                <button
                  key={item}
                  onClick={() => handleNavClick(item)}
                  className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground w-full text-left transition-colors"
                  data-testid={`link-mobile-nav-${item.toLowerCase().replace(' ', '-')}`}
                >
                  {item}
                </button>
              ))}
              <div className="pt-4 space-y-2">
                <Link href="/automation-discovery" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full border-primary text-primary"
                    data-testid="button-mobile-discover-ai"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Discover AI Solutions
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setChatOpen(!chatOpen)
                  }}
                  data-testid="button-mobile-chat"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat
                </Button>
                <Button
                  className="w-full"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setConsultationOpen(true)
                  }}
                  data-testid="button-mobile-get-consultation"
                >
                  Consultation
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Suspense fallback={<LazyFallback />}>
        <ProgressiveDiscoveryForm
          open={consultationOpen}
          onOpenChange={setConsultationOpen}
        />
      </Suspense>

      <Suspense fallback={<LazyFallback />}>
        <ChatWidget
          isOpen={chatOpen}
          onToggle={() => setChatOpen(!chatOpen)}
          position="header"
        />
      </Suspense>
    </header>
  )
}
