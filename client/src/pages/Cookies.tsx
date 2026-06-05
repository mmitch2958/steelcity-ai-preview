import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SEO } from '@/components/SEO'

export default function Cookies() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO 
        title="Cookie Policy | Steel City AI"
        description="Learn about how Steel City AI uses cookies and similar technologies to improve your browsing experience."
      />
      <Header />
      
      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="text-cookies-title">
              Cookie Policy
            </h1>
            <p className="text-muted-foreground" data-testid="text-cookies-updated">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>What Are Cookies</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground">
                  Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How We Use Cookies</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                <p className="text-muted-foreground">We use cookies for the following purposes:</p>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Essential Cookies</h4>
                  <p className="text-muted-foreground">
                    These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Analytics Cookies</h4>
                  <p className="text-muted-foreground">
                    We use analytics cookies to understand how visitors interact with our website. This helps us improve our website and services.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Preference Cookies</h4>
                  <p className="text-muted-foreground">
                    These cookies remember your preferences and settings, such as your preferred language or theme (light/dark mode).
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Third-Party Cookies</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground">
                  Some cookies are placed by third-party services that appear on our pages. We do not control the dissemination of these cookies. You should check the third-party websites for more information about these cookies.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Managing Cookies</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                <p className="text-muted-foreground">
                  Most web browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience.
                </p>
                <p className="text-muted-foreground">
                  To manage cookies in your browser:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Chrome: Settings → Privacy and Security → Cookies</li>
                  <li>Firefox: Options → Privacy & Security → Cookies</li>
                  <li>Safari: Preferences → Privacy → Cookies</li>
                  <li>Edge: Settings → Privacy, Search, and Services → Cookies</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Updates to This Policy</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground">
                  We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground">
                  If you have any questions about our use of cookies, please contact us at{' '}
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