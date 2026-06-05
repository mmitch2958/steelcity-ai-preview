import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SEO, seoConfigs } from '@/components/SEO'
import { MapPin, Briefcase, Clock } from 'lucide-react'

const openPositions = [
  {
    title: 'Senior AI Engineer',
    department: 'Engineering',
    location: 'Pittsburgh, PA / Remote',
    type: 'Full-time',
    description: 'Join our team to build cutting-edge AI solutions for enterprise clients.'
  },
  {
    title: 'Solutions Architect',
    department: 'Professional Services',
    location: 'Remote',
    type: 'Full-time',
    description: 'Design and implement AI automation solutions for diverse business needs.'
  },
  {
    title: 'Product Manager',
    department: 'Product',
    location: 'Pittsburgh, PA',
    type: 'Full-time',
    description: 'Lead product strategy and development for our AI automation platform.'
  }
]

export default function Careers() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO {...seoConfigs.careers} />
      <Header />
      
      <main>
        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="secondary" className="mb-4">We're Hiring</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6" data-testid="text-careers-title">
              Join Our Team
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-careers-subtitle">
              Help us build the future of AI-powered business automation. We're looking for passionate individuals who want to make a real impact.
            </p>
          </div>
        </section>

        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Open Positions</h2>
            
            <div className="space-y-6 max-w-4xl mx-auto">
              {openPositions.map((position, index) => (
                <Card key={index} className="hover-elevate" data-testid={`card-position-${index}`}>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl">{position.title}</CardTitle>
                        <CardDescription className="mt-1">{position.department}</CardDescription>
                      </div>
                      <Button data-testid={`button-apply-${index}`}>Apply Now</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{position.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {position.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {position.type}
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {position.department}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-16 text-center">
              <Card className="max-w-2xl mx-auto">
                <CardContent className="py-8">
                  <h3 className="text-xl font-semibold mb-4">Don't see the right role?</h3>
                  <p className="text-muted-foreground mb-6">
                    We're always looking for talented individuals. Send us your resume and tell us how you can contribute to our mission.
                  </p>
                  <Button variant="outline" data-testid="button-general-application">
                    Submit General Application
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}