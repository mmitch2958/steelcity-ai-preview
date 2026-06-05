import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { useMutation } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { Calendar, Clock, CheckCircle, X } from 'lucide-react'
import { useAnalytics } from '@/components/Analytics'
import { useBotProtection } from '@/hooks/use-bot-protection'
import { HoneypotField } from '@/components/HoneypotField'
import { TurnstileWidget } from '@/components/TurnstileWidget'

interface ConsultationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ConsultationData {
  // Client Information
  name: string
  email: string
  phone: string
  company: string
  jobTitle: string
  
  // Project Information
  projectType: string
  projectDescription: string
  currentChallenges: string
  goals: string
  timeline: string
  budget: string
  
  // Services Interest
  servicesInterested: string[]
  
  // Additional Information
  hasExistingAI: boolean
  teamSize: string
  urgency: string
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

export default function ConsultationForm({ open, onOpenChange }: ConsultationFormProps) {
  const [formData, setFormData] = useState<ConsultationData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    projectType: '',
    projectDescription: '',
    currentChallenges: '',
    goals: '',
    timeline: '',
    budget: '',
    servicesInterested: [],
    hasExistingAI: false,
    teamSize: '',
    urgency: '',
    preferredContactMethod: 'email',
    additionalNotes: ''
  })
  
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const { toast } = useToast()
  const { trackEvent, trackBusinessGoal } = useAnalytics()
  const { honeypotValue, setHoneypotValue, isHuman, resetProtection } = useBotProtection()

  const consultationMutation = useMutation({
    mutationFn: async (data: ConsultationData & { turnstileToken?: string }) => {
      return await apiRequest('POST', '/api/contact', {
        name: data.name,
        email: data.email,
        company: data.company,
        service: 'consultation',
        message: `Consultation Request from ${data.name} at ${data.company}`,
        turnstileToken: data.turnstileToken,
        consultationData: {
          phone: data.phone,
          jobTitle: data.jobTitle,
          projectType: data.projectType,
          projectDescription: data.projectDescription,
          currentChallenges: data.currentChallenges,
          goals: data.goals,
          timeline: data.timeline,
          budget: data.budget,
          servicesInterested: data.servicesInterested,
          hasExistingAI: data.hasExistingAI,
          teamSize: data.teamSize,
          urgency: data.urgency,
          preferredContactMethod: data.preferredContactMethod,
          additionalNotes: data.additionalNotes
        }
      })
    },
    onSuccess: (data) => {
      setIsSubmitted(true)
      
      // Track successful consultation request
      trackEvent({
        action: 'consultation_form_submitted',
        category: 'lead_generation',
        label: 'consultation_request',
        custom_parameters: {
          company: formData.company,
          services_interested: formData.servicesInterested.join(','),
          project_type: formData.projectType,
          timeline: formData.timeline,
          budget_range: formData.budget
        }
      })
      
      // Track business goal achievement
      trackBusinessGoal('consultation_request', {
        lead_source: 'consultation_form',
        company: formData.company,
        services_count: formData.servicesInterested.length,
        has_timeline: !!formData.timeline,
        has_budget: !!formData.budget
      })
      
      toast({
        title: "Consultation request sent!",
        description: "We'll contact you within 24 hours to schedule your consultation.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error sending consultation request",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    },
  })

  const handleInputChange = (field: keyof ConsultationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleServiceToggle = (service: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      servicesInterested: checked 
        ? [...prev.servicesInterested, service]
        : prev.servicesInterested.filter(s => s !== service)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Bot protection check
    if (!isHuman()) {
      toast({
        title: "Verification failed",
        description: "Please wait a moment and try again.",
        variant: "destructive",
      })
      return
    }
    
    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.company.trim() || !formData.projectDescription.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields (marked with *).",
        variant: "destructive",
      })
      return
    }
    
    consultationMutation.mutate({ ...formData, turnstileToken: turnstileToken || undefined })
  }

  const handleClose = () => {
    onOpenChange(false)
    setIsSubmitted(false)
    resetProtection()
    setTurnstileToken(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      jobTitle: '',
      projectType: '',
      projectDescription: '',
      currentChallenges: '',
      goals: '',
      timeline: '',
      budget: '',
      servicesInterested: [],
      hasExistingAI: false,
      teamSize: '',
      urgency: '',
      preferredContactMethod: 'email',
      additionalNotes: ''
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-consultation-form">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Request Free Consultation
          </DialogTitle>
          <DialogDescription>
            Tell us about your project and we'll provide a customized AI automation strategy for your business.
          </DialogDescription>
        </DialogHeader>

        {isSubmitted ? (
          <div className="text-center py-8" data-testid="consultation-success">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Consultation Request Received!</h3>
            <p className="text-muted-foreground mb-4">
              Thank you for your interest. Our AI experts will review your requirements and contact you within 24 hours to schedule your free consultation.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Expected response time: Within 24 hours</span>
              </div>
            </div>
            <Button onClick={handleClose} data-testid="button-close-consultation">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <HoneypotField value={honeypotValue} onChange={setHoneypotValue} />
            {/* Client Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="John Doe"
                    required
                    disabled={consultationMutation.isPending}
                    data-testid="input-consultation-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Business Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john@company.com"
                    required
                    disabled={consultationMutation.isPending}
                    data-testid="input-consultation-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    disabled={consultationMutation.isPending}
                    data-testid="input-consultation-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    placeholder="CEO, CTO, Operations Manager..."
                    disabled={consultationMutation.isPending}
                    data-testid="input-consultation-job-title"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company Name *</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="Your Company Name"
                  required
                  disabled={consultationMutation.isPending}
                  data-testid="input-consultation-company"
                />
              </div>
            </div>

            {/* Project Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Project Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="projectType">Project Type</Label>
                <Select value={formData.projectType} onValueChange={(value) => handleInputChange('projectType', value)} disabled={consultationMutation.isPending}>
                  <SelectTrigger data-testid="select-consultation-project-type">
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new-implementation">New AI Implementation</SelectItem>
                    <SelectItem value="process-automation">Process Automation</SelectItem>
                    <SelectItem value="system-integration">System Integration</SelectItem>
                    <SelectItem value="optimization">Existing System Optimization</SelectItem>
                    <SelectItem value="consultation-only">Strategic Consultation Only</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Services of Interest</Label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {serviceOptions.map((service) => (
                    <div key={service} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service}`}
                        checked={formData.servicesInterested.includes(service)}
                        onCheckedChange={(checked) => handleServiceToggle(service, checked as boolean)}
                        disabled={consultationMutation.isPending}
                        data-testid={`checkbox-service-${service.toLowerCase().replace(/\s+/g, '-')}`}
                      />
                      <Label htmlFor={`service-${service}`} className="text-sm font-normal">
                        {service}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectDescription">Project Description *</Label>
                <Textarea
                  id="projectDescription"
                  value={formData.projectDescription}
                  onChange={(e) => handleInputChange('projectDescription', e.target.value)}
                  placeholder="Describe your project, what you're looking to automate, and your vision..."
                  rows={4}
                  required
                  disabled={consultationMutation.isPending}
                  data-testid="textarea-consultation-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentChallenges">Current Challenges</Label>
                <Textarea
                  id="currentChallenges"
                  value={formData.currentChallenges}
                  onChange={(e) => handleInputChange('currentChallenges', e.target.value)}
                  placeholder="What specific pain points or inefficiencies are you trying to solve?"
                  rows={3}
                  disabled={consultationMutation.isPending}
                  data-testid="textarea-consultation-challenges"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goals">Goals & Expected Outcomes</Label>
                <Textarea
                  id="goals"
                  value={formData.goals}
                  onChange={(e) => handleInputChange('goals', e.target.value)}
                  placeholder="What results are you hoping to achieve? (e.g., reduce processing time by 50%, improve accuracy, etc.)"
                  rows={3}
                  disabled={consultationMutation.isPending}
                  data-testid="textarea-consultation-goals"
                />
              </div>
            </div>

            {/* Project Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Project Details</h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeline">Desired Timeline</Label>
                  <Select value={formData.timeline} onValueChange={(value) => handleInputChange('timeline', value)} disabled={consultationMutation.isPending}>
                    <SelectTrigger data-testid="select-consultation-timeline">
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asap">ASAP (Within 1 month)</SelectItem>
                      <SelectItem value="1-3-months">1-3 months</SelectItem>
                      <SelectItem value="3-6-months">3-6 months</SelectItem>
                      <SelectItem value="6-12-months">6-12 months</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Budget Range</Label>
                  <Select value={formData.budget} onValueChange={(value) => handleInputChange('budget', value)} disabled={consultationMutation.isPending}>
                    <SelectTrigger data-testid="select-consultation-budget">
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under-10k">Under $10,000</SelectItem>
                      <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                      <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                      <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
                      <SelectItem value="100k-plus">$100,000+</SelectItem>
                      <SelectItem value="not-sure">Not sure yet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamSize">Team Size</Label>
                  <Select value={formData.teamSize} onValueChange={(value) => handleInputChange('teamSize', value)} disabled={consultationMutation.isPending}>
                    <SelectTrigger data-testid="select-consultation-team-size">
                      <SelectValue placeholder="Select team size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-1000">201-1,000 employees</SelectItem>
                      <SelectItem value="1000-plus">1,000+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgency">Priority Level</Label>
                  <Select value={formData.urgency} onValueChange={(value) => handleInputChange('urgency', value)} disabled={consultationMutation.isPending}>
                    <SelectTrigger data-testid="select-consultation-urgency">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High - Need immediate solution</SelectItem>
                      <SelectItem value="medium">Medium - Important but not urgent</SelectItem>
                      <SelectItem value="low">Low - Exploring options</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredContactMethod">Preferred Contact Method</Label>
                <Select value={formData.preferredContactMethod} onValueChange={(value) => handleInputChange('preferredContactMethod', value)} disabled={consultationMutation.isPending}>
                  <SelectTrigger data-testid="select-consultation-contact-method">
                    <SelectValue placeholder="Select contact method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="video">Video Call</SelectItem>
                    <SelectItem value="in-person">In-Person Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasExistingAI"
                  checked={formData.hasExistingAI}
                  onCheckedChange={(checked) => handleInputChange('hasExistingAI', checked)}
                  disabled={consultationMutation.isPending}
                  data-testid="checkbox-existing-ai"
                />
                <Label htmlFor="hasExistingAI" className="text-sm font-normal">
                  We already have some AI/automation systems in place
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalNotes">Additional Notes</Label>
                <Textarea
                  id="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                  placeholder="Any additional information, specific requirements, or questions you'd like to share..."
                  rows={3}
                  disabled={consultationMutation.isPending}
                  data-testid="textarea-consultation-notes"
                />
              </div>
            </div>

            <TurnstileWidget 
              onVerify={setTurnstileToken} 
              onExpire={() => setTurnstileToken(null)}
              theme="auto"
              className="flex justify-center"
            />

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={consultationMutation.isPending}
                data-testid="button-submit-consultation"
              >
                {consultationMutation.isPending ? 'Sending...' : 'Request Consultation'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={consultationMutation.isPending}
                data-testid="button-cancel-consultation"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}