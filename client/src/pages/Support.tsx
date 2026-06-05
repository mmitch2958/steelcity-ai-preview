import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SEO, seoConfigs } from '@/components/SEO'
import { MessageCircle, Mail, Phone, FileText, HelpCircle, BookOpen } from 'lucide-react'
import { Link } from 'wouter'

const supportOptions = [
  {
    icon: MessageCircle,
    title: 'Live Chat',
    description: 'Get instant help from our AI assistant or connect with a support specialist.',
    action: 'Start Chat',
    primary: true
  },
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Send us a detailed message and we\'ll respond within 24 hours.',
    action: 'support@steelcity-ai.com',
    href: 'mailto:support@steelcity-ai.com'
  },
  {
    icon: Phone,
    title: 'Phone Support',
    description: 'Speak directly with our support team during business hours.',
    action: 'Schedule a Call',
    href: '/#contact'
  }
]

const resources = [
  {
    icon: FileText,
    title: 'Documentation',
    description: 'Comprehensive guides for using our AI automation solutions.',
    href: '/#about'
  },
  {
    icon: HelpCircle,
    title: 'FAQ',
    description: 'Find answers to commonly asked questions about our services.',
    href: '/#about'
  },
  {
    icon: BookOpen,
    title: 'Case Studies',
    description: 'See how other businesses have succeeded with our solutions.',
    href: '/#case-studies'
  }
]

export default function Support() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO {...seoConfigs.support} />
      <Header />
      
      <main>
        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="secondary" className="mb-4">Help Center</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6" data-testid="text-support-title">
              How Can We Help?
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-support-subtitle">
              Our team is here to help you get the most out of your AI automation solutions.
            </p>
          </div>
        </section>

        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Contact Support</h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              {supportOptions.map((option, index) => {
                const Icon = option.icon
                return (
                  <Card key={index} className="text-center hover-elevate" data-testid={`card-support-${index}`}>
                    <CardHeader>
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>{option.title}</CardTitle>
                      <CardDescription>{option.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {option.href ? (
                        <Link href={option.href}>
                          <Button variant={option.primary ? 'default' : 'outline'} data-testid={`button-support-${index}`}>
                            {option.action}
                          </Button>
                        </Link>
                      ) : (
                        <Button variant={option.primary ? 'default' : 'outline'} data-testid={`button-support-${index}`}>
                          {option.action}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Resources</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {resources.map((resource, index) => {
                const Icon = resource.icon
                return (
                  <Link key={index} href={resource.href}>
                    <Card className="hover-elevate cursor-pointer h-full" data-testid={`card-resource-${index}`}>
                      <CardHeader>
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center mb-3">
                          <Icon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <CardTitle className="text-lg">{resource.title}</CardTitle>
                        <CardDescription>{resource.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}