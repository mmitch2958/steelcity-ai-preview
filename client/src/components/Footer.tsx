import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Mail, Linkedin, Twitter } from 'lucide-react'
import { Link, useLocation } from 'wouter'
import logoImage from '@assets/SquareSteelCityLogo.svg'

const footerSections = [
  {
    title: 'Services',
    links: [
      { label: 'Document Processing', href: '/services/document-processing' },
      { label: 'Custom Agent Automation', href: '/services/custom-agent-automation' },
      { label: 'Marketing Automation', href: '/services/marketing-automation' },
      { label: 'Data Analysis', href: '/services/data-analysis' },
      { label: 'Custom Solutions', href: '/services/custom-solutions' }
    ]
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/#about', isSection: true },
      { label: 'Case Studies', href: '/#case-studies', isSection: true },
      { label: 'Careers', href: '/careers' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/#contact', isSection: true }
    ]
  },
  {
    title: 'Resources',
    links: [
      { label: 'Support', href: '/support' },
      { label: 'FAQ', href: '/#about', isSection: true }
    ]
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookies', href: '/cookies' }
    ]
  }
]

const socialLinks = [
  { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
  { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
  { icon: Mail, href: 'mailto:contact@steelcity-ai.com', label: 'Email' }
]

export default function Footer() {
  const [location, setLocation] = useLocation()

  const handleSectionClick = (href: string) => {
    const sectionId = href.replace('/#', '')
    if (location === '/') {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      sessionStorage.setItem('scrollToSection', sectionId)
      setLocation('/')
    }
  }

  const handleSocialClick = (link: { href: string; label: string }) => {
    if (link.href.startsWith('mailto:')) {
      window.location.href = link.href
    } else {
      window.open(link.href, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <footer className="bg-muted/30 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16">
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-1">
              <div className="mb-6">
                <Link href="/">
                  <img 
                    src={logoImage} 
                    alt="Steel City AI" 
                    className="h-[100px] w-auto object-contain cursor-pointer"
                    data-testid="img-footer-logo"
                  />
                </Link>
              </div>
              <p className="text-muted-foreground text-sm mb-6" data-testid="text-footer-description">
                Custom AI agents built around the systems you already use.
                No new software. No disruption. Just results.
              </p>
              
              <div className="flex gap-2">
                {socialLinks.map((social) => {
                  const Icon = social.icon
                  return (
                    <Button
                      key={social.label}
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSocialClick(social)}
                      data-testid={`button-social-${social.label.toLowerCase()}`}
                    >
                      <Icon className="h-5 w-5" />
                    </Button>
                  )
                })}
              </div>
            </div>

            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="font-semibold text-foreground mb-4" data-testid={`text-footer-section-${section.title.toLowerCase()}`}>
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      {link.isSection ? (
                        <button
                          onClick={() => handleSectionClick(link.href)}
                          className="text-muted-foreground hover:text-foreground text-sm transition-colors hover-elevate"
                          data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {link.label}
                        </button>
                      ) : (
                        <Link href={link.href}>
                          <span
                            className="text-muted-foreground hover:text-foreground text-sm transition-colors hover-elevate cursor-pointer"
                            data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {link.label}
                          </span>
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm" data-testid="text-footer-copyright">
              © {new Date().getFullYear()} Steel City AI. All rights reserved.
            </p>
            
            <div className="flex items-center gap-6">
              <Link href="/privacy">
                <span
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors cursor-pointer"
                  data-testid="link-footer-privacy"
                >
                  Privacy
                </span>
              </Link>
              <Link href="/terms">
                <span
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors cursor-pointer"
                  data-testid="link-footer-terms"
                >
                  Terms
                </span>
              </Link>
              <Link href="/cookies">
                <span
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors cursor-pointer"
                  data-testid="link-footer-cookies"
                >
                  Cookies
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}