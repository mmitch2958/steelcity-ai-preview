import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SEO, seoConfigs } from '@/components/SEO'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO {...seoConfigs.privacy} />
      <Header />
      
      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="text-privacy-title">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground" data-testid="text-privacy-updated">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Introduction</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground">
                  Steel City AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Information We Collect</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Personal Information</h4>
                  <p className="text-muted-foreground">
                    We may collect personal information that you voluntarily provide when using our services, including but not limited to:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                    <li>Name and contact information</li>
                    <li>Email address</li>
                    <li>Phone number</li>
                    <li>Company name and job title</li>
                    <li>Project and business requirements</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Automatically Collected Information</h4>
                  <p className="text-muted-foreground">
                    When you visit our website, we may automatically collect certain information about your device and usage patterns, including IP address, browser type, operating system, and pages visited.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How We Use Your Information</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground mb-4">We use the information we collect to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Provide and maintain our services</li>
                  <li>Respond to your inquiries and requests</li>
                  <li>Send you relevant updates and marketing communications</li>
                  <li>Improve our website and services</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Security</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground">
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Rights</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground mb-4">You have the right to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Lodge a complaint with a supervisory authority</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground">
                  If you have any questions about this Privacy Policy, please contact us at{' '}
                  <a href="mailto:privacy@steelcity-ai.com" className="text-primary hover:underline">
                    privacy@steelcity-ai.com
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}