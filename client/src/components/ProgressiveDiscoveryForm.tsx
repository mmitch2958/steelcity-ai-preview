import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { apiRequest } from '@/lib/queryClient'
import { CheckCircle, ArrowRight, Sparkles, ArrowLeft } from 'lucide-react'
import { useAnalytics } from '@/components/Analytics'
import { useBotProtection } from '@/hooks/use-bot-protection'
import { HoneypotField } from '@/components/HoneypotField'

interface ProgressiveDiscoveryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface MicroCommitmentData {
  name: string
  email: string
  bottleneck: string
}

interface FullConsultationData {
  company: string
  projectType: string
  projectDescription: string
  currentChallenges: string
  goals: string
  timeline: string
  budget: string
  servicesInterested: string[]
  preferredContactMethod: string
  additionalNotes: string
}

const serviceOptions = [
  'Document Processing',
  'Customer Service Automation',
  'Marketing Automation',
  'Data Analysis & Insights',
  'Custom AI Solutions',
  'Workflow Automation',
  'Other'
]

export default function ProgressiveDiscoveryForm({ open, onOpenChange }: ProgressiveDiscoveryFormProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [inquiryId, setInquiryId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  const [microData, setMicroData] = useState<MicroCommitmentData>({
    name: '',
    email: '',
    bottleneck: ''
  })
  
  const [fullData, setFullData] = useState<FullConsultationData>({
    company: '',
    projectType: '',
    projectDescription: '',
    currentChallenges: '',
    goals: '',
    timeline: '',
    budget: '',
    servicesInterested: [],
    preferredContactMethod: 'email',
    additionalNotes: ''
  })
  
  const { toast } = useToast()
  const { trackEvent, trackBusinessGoal } = useAnalytics()
  const { honeypotValue, setHoneypotValue, isHuman, resetProtection } = useBotProtection()

  const handleMicroSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isHuman()) {
      toast({ title: "Verification failed", description: "Please wait a moment and try again.", variant: "destructive" })
      return
    }
    
    if (!microData.name.trim() || !microData.email.trim() || !microData.bottleneck.trim()) {
      toast({ title: "Missing required fields", description: "Please fill in all fields to continue.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    
    try {
      // Track micro-commitment start
      trackEvent({
        action: 'micro_commitment_started',
        category: 'lead_generation',
        label: 'progressive_discovery'
      })

      // Submit partial record to backend
      const res = await apiRequest('POST', '/api/contact', {
        name: microData.name,
        email: microData.email,
        company: 'Pending', // Placeholder for partial record
        service: 'consultation',
        message: `Initial bottleneck: ${microData.bottleneck}`,
        consultationData: {
          currentChallenges: microData.bottleneck
        }
      })
      
      const data = await res.json()
      setInquiryId(data.id)
      setStep(2)
      
      trackEvent({
        action: 'micro_commitment_completed',
        category: 'lead_generation',
        label: 'progressive_discovery'
      })
      
      toast({
        title: "Great start!",
        description: "Now let's get a bit more detail to tailor your strategy.",
      })
    } catch (error: any) {
      toast({
        title: "Error saving information",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFullSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inquiryId) {
      toast({ title: "Session error", description: "Please start over.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    
    try {
      // Update the partial record with full data
      const res = await apiRequest('PATCH', `/api/contact/${inquiryId}`, {
        service: 'consultation',
        consultationData: {
          ...fullData,
          currentChallenges: `${microData.bottleneck}\n\nAdditional details: ${fullData.currentChallenges}`
        }
      })
      
      const data = await res.json()
      
      if (data.success) {
        setIsSubmitted(true)
        
        trackEvent({
          action: 'consultation_form_submitted',
          category: 'lead_generation',
          label: 'progressive_discovery_full',
          custom_parameters: {
            company: fullData.company,
            services_interested: fullData.servicesInterested.join(','),
            project_type: fullData.projectType,
            timeline: fullData.timeline,
            budget_range: fullData.budget
          }
        })
        
        trackBusinessGoal('consultation_request', {
          lead_source: 'progressive_discovery',
          company: fullData.company,
          services_count: fullData.servicesInterested.length,
          has_timeline: !!fullData.timeline,
          has_budget: !!fullData.budget
        })
        
        toast({
          title: "Consultation request sent!",
          description: "We'll contact you within 24 hours to schedule your consultation.",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error sending consultation request",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleServiceToggle = (service: string, checked: boolean) => {
    setFullData(prev => ({
      ...prev,
      servicesInterested: checked 
        ? [...prev.servicesInterested, service]
        : prev.servicesInterested.filter(s => s !== service)
    }))
  }

  const handleClose = () => {
    onOpenChange(false)
    setStep(1)
    setIsSubmitted(false)
    setInquiryId(null)
    resetProtection()
    setMicroData({ name: '', email: '', bottleneck: '' })
    setFullData({
      company: '',
      projectType: '',
      projectDescription: '',
      currentChallenges: '',
      goals: '',
      timeline: '',
      budget: '',
      servicesInterested: [],
      preferredContactMethod: 'email',
      additionalNotes: ''
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-progressive-discovery">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Discover Your AI Automation Strategy
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? "Tell us your biggest challenge, and we'll build a custom roadmap for you."
              : "Almost done! Help us tailor your strategy with a few more details."}
          </DialogDescription>
        </DialogHeader>

        {isSubmitted ? (
          <div className="text-center py-8" data-testid="discovery-success">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Strategy Request Received!</h3>
            <p className="text-muted-foreground mb-4">
              Thank you for sharing your challenges. Our AI experts will review your requirements and contact you within 24 hours with a personalized automation roadmap.
            </p>
            <Button onClick={handleClose} data-testid="button-close-discovery">
              Close
            </Button>
          </div>
        ) : step === 1 ? (
          <form onSubmit={handleMicroSubmit} className="space-y-6">
            <HoneypotField value={honeypotValue} onChange={setHoneypotValue} />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="micro-name">Full Name *</Label>
                <Input
                  id="micro-name"
                  value={microData.name}
                  onChange={(e) => setMicroData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                  required
                  disabled={isSubmitting}
                  data-testid="input-micro-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="micro-email">Business Email *</Label>
                <Input
                  id="micro-email"
                  type="email"
                  value={microData.email}
                  onChange={(e) => setMicroData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@company.com"
                  required
                  disabled={isSubmitting}
                  data-testid="input-micro-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="micro-bottleneck">What is your biggest operational bottleneck? *</Label>
                <Textarea
                  id="micro-bottleneck"
                  value={microData.bottleneck}
                  onChange={(e) => setMicroData(prev => ({ ...prev, bottleneck: e.target.value }))}
                  placeholder="e.g., We spend 15 hours/week manually entering data from emails into our CRM..."
                  rows={4}
                  required
                  disabled={isSubmitting}
                  data-testid="textarea-micro-bottleneck"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
              data-testid="button-micro-submit"
            >
              {isSubmitting ? 'Saving...' : 'Continue to Full Assessment'}
              {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              No commitment required. Takes 2 minutes.
            </p>
          </form>
        ) : (
          <form onSubmit={handleFullSubmit} className="space-y-6">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep(1)}
              className="mb-2"
              disabled={isSubmitting}
              data-testid="button-back-to-micro"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full-company">Company Name *</Label>
                <Input
                  id="full-company"
                  value={fullData.company}
                  onChange={(e) => setFullData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Your Company Name"
                  required
                  disabled={isSubmitting}
                  data-testid="input-full-company"
                />
              </div>

              <div className="space-y-2">
                <Label>Services of Interest</Label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {serviceOptions.map((service) => (
                    <label key={service} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fullData.servicesInterested.includes(service)}
                        onChange={(e) => handleServiceToggle(service, e.target.checked)}
                        disabled={isSubmitting}
                        className="rounded border-gray-300"
                        data-testid={`checkbox-service-${service.toLowerCase().replace(/\s+/g, '-')}`}
                      />
                      <span className="text-sm">{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full-project-type">Project Type</Label>
                <select
                  id="full-project-type"
                  value={fullData.projectType}
                  onChange={(e) => setFullData(prev => ({ ...prev, projectType: e.target.value }))}
                  disabled={isSubmitting}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  data-testid="select-full-project-type"
                >
                  <option value="">Select project type</option>
                  <option value="new-implementation">New AI Implementation</option>
                  <option value="process-automation">Process Automation</option>
                  <option value="system-integration">System Integration</option>
                  <option value="optimization">Existing System Optimization</option>
                  <option value="consultation-only">Strategic Consultation Only</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full-goals">Goals & Expected Outcomes</Label>
                <Textarea
                  id="full-goals"
                  value={fullData.goals}
                  onChange={(e) => setFullData(prev => ({ ...prev, goals: e.target.value }))}
                  placeholder="What results are you hoping to achieve?"
                  rows={3}
                  disabled={isSubmitting}
                  data-testid="textarea-full-goals"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full-timeline">Desired Timeline</Label>
                  <select
                    id="full-timeline"
                    value={fullData.timeline}
                    onChange={(e) => setFullData(prev => ({ ...prev, timeline: e.target.value }))}
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    data-testid="select-full-timeline"
                  >
                    <option value="">Select timeline</option>
                    <option value="asap">ASAP (Within 1 month)</option>
                    <option value="1-3-months">1-3 months</option>
                    <option value="3-6-months">3-6 months</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full-budget">Budget Range</Label>
                  <select
                    id="full-budget"
                    value={fullData.budget}
                    onChange={(e) => setFullData(prev => ({ ...prev, budget: e.target.value }))}
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    data-testid="select-full-budget"
                  >
                    <option value="">Select budget range</option>
                    <option value="under-10k">Under $10,000</option>
                    <option value="10k-25k">$10,000 - $25,000</option>
                    <option value="25k-50k">$25,000 - $50,000</option>
                    <option value="50k-plus">$50,000+</option>
                    <option value="not-sure">Not sure yet</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full-additional-notes">Additional Notes</Label>
                <Textarea
                  id="full-additional-notes"
                  value={fullData.additionalNotes}
                  onChange={(e) => setFullData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                  placeholder="Any additional information or specific requirements..."
                  rows={3}
                  disabled={isSubmitting}
                  data-testid="textarea-full-notes"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
              data-testid="button-full-submit"
            >
              {isSubmitting ? 'Sending...' : 'Get My Custom Strategy'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
