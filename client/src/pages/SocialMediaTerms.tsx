import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SEO } from '@/components/SEO'

export default function SocialMediaTerms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO 
        title="Social Media Platform Terms of Service | Steel City AI"
        description="Terms of Service for Steel City AI's social media management platform. Understand your rights and responsibilities when using our AI-powered social media tools."
      />
      <Header />
      
      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Social Media Platform Terms of Service
            </h1>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Acceptance of Terms</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground">
                  By accessing or using Steel City AI's Social Media Management Platform (the "Platform"), you agree to be bound by these Terms of Service ("Terms"). If you are using the Platform on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms. If you do not agree to these Terms, you may not access or use the Platform.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Description of Services</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground mb-4">
                  The Platform provides AI-powered social media management tools, including but not limited to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>AI-assisted content creation and post drafting across Facebook, Instagram, X/Twitter, and LinkedIn</li>
                  <li>Five specialized AI agents: Management, Research, Design, Post, and Training</li>
                  <li>Campaign planning and management</li>
                  <li>Brand voice profile creation and content personalization</li>
                  <li>"Vibe edit" functionality for natural language tone adjustments</li>
                  <li>Trend research and content recommendations</li>
                  <li>Post scheduling and publishing to connected social media accounts</li>
                  <li>Analytics and performance tracking</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Registration and Security</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                <p className="text-muted-foreground">
                  To use the Platform, you must create an account and provide accurate, complete information. You are responsible for:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized use of your account</li>
                  <li>Ensuring that connected social media account credentials remain valid and up to date</li>
                </ul>
                <p className="text-muted-foreground">
                  We reserve the right to suspend or terminate accounts that violate these Terms or that we reasonably believe have been compromised.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Acceptable Use</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                <p className="text-muted-foreground mb-2">When using the Platform, you agree not to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Create, publish, or distribute content that is unlawful, defamatory, harassing, threatening, or otherwise objectionable</li>
                  <li>Violate any applicable laws, regulations, or the terms of service of connected social media platforms</li>
                  <li>Use the Platform to spam, send unsolicited messages, or engage in deceptive practices</li>
                  <li>Attempt to gain unauthorized access to other users' accounts or data</li>
                  <li>Interfere with or disrupt the Platform's infrastructure, security, or performance</li>
                  <li>Reverse engineer, decompile, or attempt to extract the source code of the Platform or its AI models</li>
                  <li>Use the Platform to generate content that infringes on the intellectual property rights of others</li>
                  <li>Misrepresent AI-generated content as human-created where disclosure is required by law or platform policy</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Ownership and Licensing</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Your Content</h4>
                  <p className="text-muted-foreground">
                    You retain ownership of the original content you provide to the Platform, including brand voice profiles, campaign descriptions, and custom prompts. By using the Platform, you grant us a limited, non-exclusive license to process, store, and transmit your content as necessary to provide our services.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">AI-Generated Content</h4>
                  <p className="text-muted-foreground">
                    Content generated by our AI agents (including post drafts, design suggestions, and trend analysis) is provided to you for your use. You are granted a non-exclusive, worldwide license to use, modify, and publish AI-generated content created through your account. You are solely responsible for reviewing, editing, and approving all AI-generated content before publishing it to any social media platform.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Platform Intellectual Property</h4>
                  <p className="text-muted-foreground">
                    The Platform, including its AI models, algorithms, user interface, documentation, and branding, is the property of Steel City AI and is protected by intellectual property laws. Nothing in these Terms grants you any right to use our trademarks, logos, or brand materials.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Services and Limitations</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                <p className="text-muted-foreground">
                  Our AI agents are designed to assist with social media management, but they have inherent limitations. You acknowledge and agree that:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>AI-generated content may contain errors, inaccuracies, or inappropriate material and must be reviewed before publishing</li>
                  <li>AI recommendations (including trend analysis, design suggestions, and post scoring) are advisory and do not guarantee specific results or engagement</li>
                  <li>The quality and relevance of AI output depends on the inputs, training feedback, and brand voice profiles you provide</li>
                  <li>AI capabilities may change as we update and improve our models</li>
                  <li>You are solely responsible for ensuring that all content published through the Platform complies with applicable laws and social media platform policies</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Third-Party Social Media Platforms</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground">
                  The Platform integrates with third-party social media platforms (Facebook, Instagram, X/Twitter, LinkedIn). Your use of these platforms through our service is also subject to their respective terms of service and policies. We are not responsible for changes to third-party platform APIs, policies, or availability. If a third-party platform restricts or terminates access, certain Platform features may become unavailable without liability on our part.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment and Billing</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                <p className="text-muted-foreground">
                  Access to the Platform may require a paid subscription. Payment terms are as follows:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Subscription fees are billed in advance on a recurring basis according to your selected plan</li>
                  <li>All payments are processed securely through Stripe</li>
                  <li>You are responsible for keeping your payment information current</li>
                  <li>We reserve the right to modify pricing with 30 days' advance notice</li>
                  <li>Refunds are handled on a case-by-case basis; please contact support for refund requests</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground">
                  To the maximum extent permitted by law, Steel City AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of revenue, data, or business opportunities, arising from your use of the Platform. Our total liability for any claim related to the Platform shall not exceed the amount you paid to us in the twelve months preceding the claim. The Platform is provided "as is" without warranties of any kind, whether express or implied.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Indemnification</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground">
                  You agree to indemnify and hold harmless Steel City AI, its officers, employees, and agents from any claims, damages, losses, or expenses (including reasonable attorney fees) arising from your use of the Platform, your violation of these Terms, or content you publish through the Platform to any social media platform.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Termination</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground">
                  Either party may terminate these Terms at any time. You may cancel your account through the Platform or by contacting us. We may suspend or terminate your access if you violate these Terms or for any reason with reasonable notice. Upon termination, your right to use the Platform ceases immediately. We will retain your data for 30 days following termination, after which it will be deleted unless retention is required by law.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Changes to These Terms</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground">
                  We may update these Terms from time to time. We will notify you of material changes by posting the updated Terms on this page and updating the "Last updated" date. Continued use of the Platform after changes are posted constitutes your acceptance of the revised Terms.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Governing Law</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground">
                  These Terms are governed by and construed in accordance with the laws of the Commonwealth of Pennsylvania, without regard to its conflict of law principles. Any disputes arising under these Terms shall be resolved in the courts located in Allegheny County, Pennsylvania.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground">
                  If you have questions about these Terms, please contact us at{' '}
                  <a href="mailto:legal@steelcity-ai.com" className="text-primary hover:underline">
                    legal@steelcity-ai.com
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