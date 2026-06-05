import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SEO } from '@/components/SEO'

export default function SocialMediaPrivacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO 
        title="Social Media Platform Privacy Policy | Steel City AI"
        description="Privacy policy for Steel City AI's social media management platform. Learn how we handle your data, social media content, and AI-generated materials."
      />
      <Header />
      
      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Social Media Platform Privacy Policy
            </h1>
            <p className="text-muted-foreground">
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
                  This Privacy Policy describes how Steel City AI ("we," "our," or "us") collects, uses, stores, and protects information when you use our AI-powered Social Media Management Platform (the "Platform"). This policy applies specifically to all features of the Platform, including AI content generation, post scheduling, campaign management, brand voice profiles, and analytics. By using the Platform, you agree to the practices described in this policy.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Information We Collect</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Account Information</h4>
                  <p className="text-muted-foreground">
                    When you register for and use the Platform, we collect:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                    <li>Your name, email address, and login credentials</li>
                    <li>Company or organization name</li>
                    <li>Billing and payment information (processed securely via Stripe)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Social Media Account Data</h4>
                  <p className="text-muted-foreground">
                    When you connect social media accounts to the Platform, we may collect:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                    <li>Social media account names, handles, and profile information</li>
                    <li>Access tokens and authentication credentials for connected platforms (Facebook, Instagram, X/Twitter, LinkedIn)</li>
                    <li>Post performance metrics and engagement data from connected accounts</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Content You Create</h4>
                  <p className="text-muted-foreground">
                    We store content you create or generate through the Platform, including:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                    <li>Social media posts, captions, and hashtags</li>
                    <li>Campaign details, goals, and scheduling preferences</li>
                    <li>Brand voice profiles, tone preferences, vocabulary, and example posts</li>
                    <li>Feedback and training data you provide to our AI agents</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Automatically Collected Information</h4>
                  <p className="text-muted-foreground">
                    We automatically collect certain technical information, including your IP address, browser type, device information, and usage patterns within the Platform.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How We Use Your Information</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                <p className="text-muted-foreground mb-2">We use the information we collect to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Provide, operate, and maintain the Platform and its features</li>
                  <li>Generate AI-powered content suggestions, post drafts, and design recommendations through our specialized AI agents</li>
                  <li>Analyze trends and research topics relevant to your social media strategy</li>
                  <li>Apply brand voice preferences and "vibe edits" to tailor content to your desired tone</li>
                  <li>Train and improve our AI models based on your feedback and usage patterns</li>
                  <li>Schedule and publish posts to your connected social media accounts</li>
                  <li>Provide analytics, performance reports, and campaign insights</li>
                  <li>Process payments and manage your subscription</li>
                  <li>Send platform notifications and important service updates</li>
                  <li>Improve and optimize the Platform's features and performance</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Processing and Content Generation</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                <p className="text-muted-foreground">
                  Our Platform uses AI technology (powered by OpenAI) through five specialized agents to assist with content creation and social media management. Here is how your data is used in this process:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Your brand voice profiles, content preferences, and feedback are sent to AI models to generate personalized content</li>
                  <li>Content you submit for "vibe edits" is processed by our AI to adjust tone and style according to your instructions</li>
                  <li>Training feedback you provide is used to refine future AI-generated suggestions for your account</li>
                  <li>AI-generated content is stored in our database and is associated with your account</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  We do not use your content to train general-purpose AI models shared with other customers. Your data is used solely to improve the AI experience within your account.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Sharing and Third Parties</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                <p className="text-muted-foreground mb-2">We may share your information with the following categories of third parties:</p>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Service Providers</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li><strong>OpenAI:</strong> For AI content generation. Your prompts and content inputs are sent to OpenAI's API for processing. OpenAI's data usage policy applies to data processed through their services.</li>
                    <li><strong>Stripe:</strong> For secure payment processing. We do not store complete credit card information on our servers.</li>
                    <li><strong>Social media platforms</strong> (Facebook, Instagram, X/Twitter, LinkedIn): To publish and manage content on your behalf when you connect your accounts.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Legal Requirements</h4>
                  <p className="text-muted-foreground">
                    We may disclose your information if required by law, regulation, legal process, or government request, or to protect the rights, property, or safety of Steel City AI, our users, or the public.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Retention</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground">
                  We retain your account data, content, and AI training feedback for as long as your account is active or as needed to provide services. When you delete your account, we will remove your personal information and content within 30 days, except where retention is required by law or for legitimate business purposes such as resolving disputes or enforcing our agreements.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Security</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground">
                  We implement industry-standard security measures to protect your information, including encryption in transit and at rest, secure authentication, and access controls. Social media access tokens are stored securely and are only used for authorized Platform operations. However, no method of electronic transmission or storage is completely secure, and we cannot guarantee absolute security.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Rights</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                <p className="text-muted-foreground mb-2">Depending on your jurisdiction, you may have the right to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Access, correct, or delete your personal information</li>
                  <li>Export your content and data in a portable format</li>
                  <li>Disconnect social media accounts and revoke Platform access at any time</li>
                  <li>Opt out of AI-based content personalization</li>
                  <li>Request deletion of AI training data and feedback associated with your account</li>
                  <li>Object to or restrict certain types of data processing</li>
                  <li>Lodge a complaint with your local data protection authority</li>
                </ul>
                <p className="text-muted-foreground">
                  To exercise any of these rights, please contact us using the information provided below.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Children's Privacy</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground">
                  The Platform is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will take steps to delete such information.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Changes to This Policy</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time to reflect changes to our practices, technology, or legal requirements. We will notify you of any material changes by posting the updated policy on this page and updating the "Last updated" date. Your continued use of the Platform after changes are posted constitutes your acceptance of the revised policy.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground">
                  If you have any questions about this Privacy Policy or our data practices, please contact us at{' '}
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