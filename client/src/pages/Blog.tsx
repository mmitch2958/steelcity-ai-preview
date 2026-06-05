import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SEO, seoConfigs } from '@/components/SEO'
import { StructuredData, structuredDataConfigs } from '@/components/StructuredData'
import { Calendar, Clock } from 'lucide-react'
import { Link } from 'wouter'

const blogPosts = [
  {
    title: 'How AI is Transforming Document Processing in 2024',
    excerpt: 'Discover the latest advancements in AI-powered document processing and how businesses are achieving unprecedented efficiency.',
    category: 'AI Technology',
    date: 'Dec 10, 2024',
    readTime: '5 min read',
    slug: 'ai-document-processing-2024'
  },
  {
    title: 'The ROI of AI Automation: A Complete Guide',
    excerpt: 'Learn how to calculate and maximize the return on investment from your AI automation initiatives.',
    category: 'Business Strategy',
    date: 'Dec 5, 2024',
    readTime: '8 min read',
    slug: 'roi-ai-automation-guide'
  },
  {
    title: 'Building Customer Service Chatbots That Actually Work',
    excerpt: 'Best practices for designing AI chatbots that improve customer satisfaction and reduce support costs.',
    category: 'Customer Service',
    date: 'Nov 28, 2024',
    readTime: '6 min read',
    slug: 'customer-service-chatbots'
  },
  {
    title: 'Data Analysis Automation: From Manual to Magical',
    excerpt: 'How automated data analysis is helping businesses make faster, more informed decisions.',
    category: 'Data Analysis',
    date: 'Nov 20, 2024',
    readTime: '7 min read',
    slug: 'data-analysis-automation'
  }
]

export default function Blog() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO {...seoConfigs.blog} />
      <StructuredData
        type="BreadcrumbList"
        data={structuredDataConfigs.breadcrumbs([
          { name: "Home", url: "/" },
          { name: "Blog", url: "/blog" }
        ])}
      />
      <Header />
      
      <main>
        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="secondary" className="mb-4">Insights & Updates</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6" data-testid="text-blog-title">
              Steel City AI Blog
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-blog-subtitle">
              Expert insights on AI automation, digital transformation, and the future of business technology.
            </p>
          </div>
        </section>

        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8">
              {blogPosts.map((post, index) => (
                <Card key={index} className="hover-elevate" data-testid={`card-blog-${index}`}>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{post.category}</Badge>
                    </div>
                    <CardTitle className="text-xl hover:text-primary transition-colors cursor-pointer">
                      {post.title}
                    </CardTitle>
                    <CardDescription>{post.excerpt}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {post.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {post.readTime}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-16 text-center">
              <p className="text-muted-foreground mb-4">
                More articles coming soon. Subscribe to stay updated.
              </p>
              <Link href="/#contact">
                <Button variant="outline" data-testid="button-subscribe">
                  Subscribe to Newsletter
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}