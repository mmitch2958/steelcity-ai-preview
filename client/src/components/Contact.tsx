import { useState, lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mail, Phone, MapPin, Clock, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useMutation } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import type { InsertContactInquiry } from '@shared/schema'
import { useAnalytics } from '@/components/Analytics'

// Lazy-load heavy components for better initial page load performance
const ProgressiveDiscoveryForm = lazy(() => import('./ProgressiveDiscoveryForm'))

// Graceful fallback UI while components load
const LazyFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="w-6 h-6 animate-spin text-primary" />
    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
  </div>
)

const contactInfo = [
  { icon: Mail, label: 'Email', value: 'Mike@steelcity-ai.com', href: 'mailto:Mike@steelcity-ai.com' },
  { icon: Phone, label: 'Phone', value: '+1 (412) 219-2984', href: 'tel:+14122192984' },
  { icon: MapPin, label: 'Address', value: 'Pittsburgh, PA', href: null },
  { icon: Clock, label: 'Hours', value: 'Mon-Fri 9AM-6PM PST', href: null }
]

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    service: '',
    message: ''
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [consultationOpen, setConsultationOpen] = useState(false)
  const { toast } = useToast()
  const { trackContactFormSubmission, trackBusinessGoal, trackEvent } = useAnalytics()

  const contactMutation = useMutation({
    mutationFn: async (data: InsertContactInquiry) => {
      const res = await apiRequest('POST', '/api/contact', data)
      return await res.json()
    },
    onSuccess: (data) => {
      setIsSubmitted(true)
      
      // Track successful contact form submission
      trackContactFormSubmission({
        service: formData.service,
        company: formData.company,
        source: 'website_contact_form'
      })
      
      // Track business goal achievement
      trackBusinessGoal('lead_generated', {
        lead_source: 'contact_form',
        service_interest: formData.service,
        has_company: !!formData.company
      })
      
      setFormData({ name: '', email: '', company: '', service: '', message: '' })
      toast({
        title: "Message sent successfully!",
        description: "Your message has been sent successfully!",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error sending message",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    },
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      // Track form validation error
      trackEvent({
        action: 'form_validation_error',
        category: 'contact_form',
        label: 'missing_required_fields'
      })
      
      toast({
        title: "Missing required fields",
        description: "Please fill in your name, email, and message.",
        variant: "destructive",
      })
      return
    }
    
    // Track form submission attempt
    trackEvent({
      action: 'form_submit_attempt',
      category: 'contact_form',
      label: formData.service || 'general_inquiry'
    })
    
    contactMutation.mutate(formData)
  }

  return (
    <section className="py-24 bg-background" id="contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4" data-testid="text-contact-title">
            Get Started Today
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-contact-subtitle">
            Ready to transform your business with AI automation? Let's discuss your specific needs and create a custom solution.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card data-testid="card-contact-form">
            <CardHeader>
              <CardTitle>Send Us a Message</CardTitle>
              <CardDescription>
                Tell us about your automation needs and we'll get back to you within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSubmitted ? (
                <div className="text-center py-8" data-testid="contact-success">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Message Sent Successfully!</h3>
                  <p className="text-muted-foreground mb-4">
                    Thank you for your inquiry. We'll get back to you within 24 hours.
                  </p>
                  <Button 
                    onClick={() => setIsSubmitted(false)} 
                    variant="outline"
                    data-testid="button-send-another"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="John Doe"
                        required
                        disabled={contactMutation.isPending}
                        data-testid="input-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="john@company.com"
                        required
                        disabled={contactMutation.isPending}
                        data-testid="input-email"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company Name</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        placeholder="Your Company"
                        disabled={contactMutation.isPending}
                        data-testid="input-company"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="service">Service Interest</Label>
                      <Select 
                        value={formData.service} 
                        onValueChange={(value) => handleInputChange('service', value)}
                        disabled={contactMutation.isPending}
                      >
                        <SelectTrigger data-testid="select-service">
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="document-processing">Document Processing</SelectItem>
                          <SelectItem value="custom-agent-automation">Custom Agent Automation</SelectItem>
                          <SelectItem value="marketing-automation">Marketing Automation</SelectItem>
                          <SelectItem value="data-analysis">Data Analysis</SelectItem>
                          <SelectItem value="custom-solutions">Custom Solutions</SelectItem>
                          <SelectItem value="consultation">General Consultation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Project Description *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Tell us about your current workflow challenges and automation goals..."
                      rows={5}
                      required
                      disabled={contactMutation.isPending}
                      data-testid="textarea-message"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full" 
                    disabled={contactMutation.isPending}
                    data-testid="button-submit-contact"
                  >
                    {contactMutation.isPending ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            <Card data-testid="card-contact-info">
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
                <CardDescription>
                  Multiple ways to reach our AI automation experts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {contactInfo.map((info, index) => {
                  const Icon = info.icon
                  const content = (
                    <div 
                      key={index} 
                      className="flex items-center gap-4 p-3 rounded-md hover-elevate transition-colors"
                      data-testid={`contact-info-${info.label.toLowerCase()}`}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-muted-foreground">{info.label}</p>
                        <p className="text-foreground">{info.value}</p>
                      </div>
                    </div>
                  )

                  return info.href ? (
                    <a key={index} href={info.href} className="block">
                      {content}
                    </a>
                  ) : content
                })}
              </CardContent>
            </Card>

            {/* Consultation CTA */}
            <Card className="bg-primary text-primary-foreground" data-testid="card-consultation-cta">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Free Consultation</h3>
                <p className="text-primary-foreground/90 mb-4 text-sm">
                  Get a personalized assessment of your automation opportunities. 
                  No cost, no obligation.
                </p>
                <Button
                  variant="outline"
                  className="w-full bg-transparent border-primary-foreground text-primary-foreground"
                  onClick={() => setConsultationOpen(true)}
                  data-testid="button-schedule-consultation"
                >
                  Schedule Free Consultation
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Suspense fallback={<LazyFallback />}>
        <ProgressiveDiscoveryForm open={consultationOpen} onOpenChange={setConsultationOpen} />
      </Suspense>
    </section>
  )
}