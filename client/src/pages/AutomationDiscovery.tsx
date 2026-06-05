import { useState } from "react";
import { SEO } from "@/components/SEO";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, ArrowRight, Bot, CheckCircle2, Clock, Loader2, Sparkles, Target, Zap, FileText, Users, Mail, HelpCircle, Lightbulb, Home, TrendingUp, Shield, BarChart3, Rocket, Calendar, ArrowUpRight, Search } from "lucide-react";
import { useBotProtection } from "@/hooks/use-bot-protection";
import { HoneypotField } from "@/components/HoneypotField";
import { TurnstileWidget } from "@/components/TurnstileWidget";

const formSchema = z.object({
  contactName: z.string().min(2, "Name must be at least 2 characters"),
  contactEmail: z.string().email("Please enter a valid email address"),
  companyName: z.string().min(2, "Company name is required"),
  processName: z.string().min(3, "Process name is required"),
  processDescription: z.string().min(20, "Please provide more detail about the process (at least 20 characters)"),
  painPoints: z.string().min(10, "Please describe your pain points (at least 10 characters)"),
  desiredOutcome: z.string().min(10, "Please describe your desired outcome (at least 10 characters)"),
});

type FormData = z.infer<typeof formSchema>;

const steps = [
  { id: 1, title: "Contact Info", description: "Your name and company" },
  { id: 2, title: "Automation Details", description: "What you want to automate and why" },
];

const tooltipContent: Record<string, string> = {
  processDescription: "The more detail you provide about your current workflow, the better our AI can identify opportunities to save you time.",
  processFrequency: "Processes that run more often typically offer greater time savings when automated.",
  timeSpentPerWeek: "This helps us estimate how much time you could save each week with automation.",
  painPoints: "Understanding what frustrates you helps our AI prioritize which problems to solve first.",
  desiredOutcome: "Describing your ideal scenario helps us create a solution tailored to your goals.",
  dataSourcesUsed: "Knowing where your data lives helps us plan how the automation will read and update information.",
  integrationNeeds: "Tell us which software tools need to work together so we can plan the connections.",
  complianceRequirements: "Security and compliance requirements help us design an automation that meets your industry standards.",
  preferredApproach: "AI agents can make decisions and learn from examples, while software automation follows exact rules. Hybrid combines both.",
};

function FieldTooltip({ fieldName }: { fieldName: string }) {
  const content = tooltipContent[fieldName];
  if (!content) return null;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="ml-1 text-muted-foreground hover:text-foreground inline-flex">
          <HelpCircle className="w-4 h-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}

const exampleUseCases = [
  {
    icon: FileText,
    title: "Invoice Processing",
    description: "Automatically extract data from invoices and enter it into your accounting system",
    processName: "Invoice Data Entry",
    processDescription: "Manually reviewing and entering invoice data from PDFs and emails into our accounting software. This includes extracting vendor info, line items, amounts, and payment terms.",
    painPoints: "Time-consuming manual data entry, prone to human error, difficult to track payment due dates",
    desiredOutcome: "Automated extraction of invoice data with validation, direct integration with accounting software, and automatic payment reminders",
  },
  {
    icon: Users,
    title: "Customer Support",
    description: "AI-powered responses to common questions and ticket routing",
    processName: "Customer Support Ticketing",
    processDescription: "Responding to customer inquiries via email and chat, categorizing tickets, and routing them to the appropriate team member based on issue type.",
    painPoints: "Long response times, inconsistent answers to common questions, manual ticket categorization takes too long",
    desiredOutcome: "Instant responses to common questions, automatic ticket categorization and routing, reduced response time",
  },
  {
    icon: Mail,
    title: "Email Management",
    description: "Smart email sorting, summarization, and automated responses",
    processName: "Email Inbox Management",
    processDescription: "Sorting through hundreds of emails daily, prioritizing important messages, summarizing long email threads, and drafting responses to routine inquiries.",
    painPoints: "Email overload, important messages get buried, spending too much time on routine responses",
    desiredOutcome: "Automatic email prioritization and categorization, AI-generated summaries of long threads, draft responses for routine emails",
  },
];

export default function AutomationDiscovery() {
  const [currentStep, setCurrentStep] = useState(0);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [consultationRequested, setConsultationRequested] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { honeypotValue, setHoneypotValue, isHuman } = useBotProtection();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contactName: "",
      contactEmail: "",
      companyName: "",
      processName: "",
      processDescription: "",
      painPoints: "",
      desiredOutcome: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/automation-discovery", {
        ...data,
        turnstileToken: turnstileToken || undefined,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setSubmittedId(data.requestId);
      toast({
        title: "Request Submitted!",
        description: "We're analyzing your automation needs. You'll receive a personalized outline shortly.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const { data: discoveryResult, isLoading: loadingResult } = useQuery({
    queryKey: ['/api/automation-discovery', submittedId],
    enabled: !!submittedId,
    refetchInterval: (data) => (data?.aiOutline ? false : 3000),
  });

  const [loadingStage, setLoadingStage] = useState(0);
  const loadingStages = [
    { label: "Analyzing your requirements...", icon: Search },
    { label: "Consulting our automation patterns...", icon: Lightbulb },
    { label: "Architecting your custom agent...", icon: Bot },
    { label: "Calculating estimated ROI and timeline...", icon: TrendingUp },
    { label: "Generating your final implementation plan...", icon: Sparkles },
    { label: "Wrapping up...", icon: CheckCircle2 }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (submittedId && !discoveryResult?.aiOutline) {
      interval = setInterval(() => {
        setLoadingStage(prev => (prev + 1) % loadingStages.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [submittedId, discoveryResult?.aiOutline]);

  const progress = currentStep === 0 ? 0 : (currentStep / steps.length) * 100;

  const applyExample = (example: typeof exampleUseCases[0]) => {
    form.setValue("processName", example.processName);
    form.setValue("processDescription", example.processDescription);
    form.setValue("painPoints", example.painPoints);
    form.setValue("desiredOutcome", example.desiredOutcome);
    setCurrentStep(1);
    toast({
      title: "Example Applied",
      description: `We've pre-filled the form with "${example.title}" details. Feel free to customize it for your needs.`,
    });
  };

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fieldsToValidate as any);
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const getFieldsForStep = (step: number): (keyof FormData)[] => {
    switch (step) {
      case 1:
        return ['contactName', 'contactEmail', 'companyName'];
      case 2:
        return ['processName', 'processDescription', 'painPoints', 'desiredOutcome'];
      default:
        return [];
    }
  };

  const onSubmit = (data: FormData) => {
    if (!isHuman()) {
      toast({
        title: "Verification failed",
        description: "Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }
    submitMutation.mutate(data);
  };

  if (submittedId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl py-12 px-4">
          <Card className="border-2">
            <CardHeader className="text-center space-y-4">
              {discoveryResult?.aiOutline ? (
                <>
                  <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <CardTitle className="text-2xl">Your Automation Outline is Ready!</CardTitle>
                  <CardDescription>
                    Our AI has analyzed your requirements and created a personalized automation plan.
                  </CardDescription>
                </>
              ) : (
                <>
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                  <CardTitle className="text-2xl">Analyzing Your Requirements...</CardTitle>
                  <CardDescription>
                    Our AI is reviewing your submission and generating a personalized automation outline. This usually takes about 30 seconds.
                  </CardDescription>
                </>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {discoveryResult?.aiOutline ? (
                <div className="space-y-6">
                  {/* Visual Header with Project Summary */}
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 border border-primary/20">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                          <BarChart3 className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg">Executive Summary</h3>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{discoveryResult.aiOutline.summary}</p>
                    </div>
                  </div>

                  {/* Recommended Approach Card */}
                  <div className="p-5 bg-muted/50 rounded-xl border border-border/50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Bot className="w-5 h-5 text-blue-500" />
                      </div>
                      <h3 className="font-semibold text-lg">Recommended Approach</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{discoveryResult.aiOutline.recommendedApproach}</p>
                  </div>

                  {/* Implementation Roadmap - Visual Steps */}
                  <div className="p-5 bg-muted/50 rounded-xl border border-border/50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Rocket className="w-5 h-5 text-purple-500" />
                      </div>
                      <h3 className="font-semibold text-lg">Implementation Roadmap</h3>
                    </div>
                    <div className="space-y-4">
                      {discoveryResult.aiOutline.proposedSolution?.map((step: string, i: number) => (
                        <div key={i} className="relative flex gap-4">
                          {/* Connecting Line */}
                          {i < (discoveryResult.aiOutline.proposedSolution?.length || 0) - 1 && (
                            <div className="absolute left-[18px] top-10 w-0.5 h-full bg-gradient-to-b from-primary/40 to-primary/10" />
                          )}
                          {/* Step Number */}
                          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm font-medium flex items-center justify-center shadow-lg shadow-primary/20">
                            {i + 1}
                          </div>
                          {/* Step Content */}
                          <div className="flex-1 pb-4">
                            <p className="text-muted-foreground pt-1.5">{step}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Timeline Visual Card */}
                  <div className="p-5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-amber-500/20 rounded-lg">
                        <Calendar className="w-5 h-5 text-amber-600" />
                      </div>
                      <h3 className="font-semibold text-lg">Estimated Timeline</h3>
                    </div>
                    <p className="text-muted-foreground text-lg font-medium">{discoveryResult.aiOutline.estimatedTimeline}</p>
                  </div>

                  {/* Key Benefits - Visual Grid */}
                  <div className="p-5 bg-muted/50 rounded-xl border border-border/50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      </div>
                      <h3 className="font-semibold text-lg">Key Benefits</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      {discoveryResult.aiOutline.keyBenefits?.map((benefit: string, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-green-500/5 rounded-lg border border-green-500/10">
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Next Steps - Action Items */}
                  <div className="p-5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl border border-blue-500/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <ArrowUpRight className="w-5 h-5 text-blue-500" />
                      </div>
                      <h3 className="font-semibold text-lg">Your Next Steps</h3>
                    </div>
                    <div className="space-y-3">
                      {discoveryResult.aiOutline.nextSteps?.map((step: string, i: number) => (
                        <div key={i} className="flex gap-3 items-start p-3 bg-background/50 rounded-lg">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 text-xs font-medium flex items-center justify-center">
                            {i + 1}
                          </div>
                          <span className="text-muted-foreground text-sm">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {discoveryResult.aiOutline.additionalRecommendations && (
                    <div className="p-5 bg-muted/50 rounded-xl border border-border/50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                          <Lightbulb className="w-5 h-5 text-indigo-500" />
                        </div>
                        <h3 className="font-semibold text-lg">Additional Recommendations</h3>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{discoveryResult.aiOutline.additionalRecommendations}</p>
                    </div>
                  )}

                  {consultationRequested ? (
                    <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
                      <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Consultation Request Received!</h3>
                      <p className="text-muted-foreground mb-4">
                        Your information has been sent to our team. Someone from Steel City AI will be in touch within 24 hours to discuss your automation needs.
                      </p>
                      <Button onClick={() => navigate("/")} variant="outline" data-testid="button-return-home-after-consultation">
                        Return to Homepage
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <Button onClick={() => navigate("/")} variant="outline" className="flex-1" data-testid="button-return-home">
                        Return Home
                      </Button>
                      <Button 
                        onClick={() => setConsultationRequested(true)} 
                        className="flex-1"
                        data-testid="button-schedule-consultation"
                      >
                        Schedule a Consultation
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8 py-8 text-center">
                  <div className="max-w-md mx-auto space-y-6">
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="absolute inset-0 bg-primary transition-all duration-1000 ease-in-out"
                        style={{ width: `${((loadingStage + 1) / loadingStages.length) * 100}%` }}
                      />
                    </div>

                    <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      {(() => {
                        const StageIcon = loadingStages[loadingStage].icon;
                        return (
                          <div className="p-4 bg-primary/10 rounded-full">
                            <StageIcon className="w-8 h-8 text-primary animate-pulse" />
                          </div>
                        );
                      })()}
                      <div>
                        <p className="text-xl font-medium text-foreground">
                          {loadingStages[loadingStage].label}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Our multi-model AI system is processing your request. This typically takes 30-45 seconds.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-8">
                      {loadingStages.map((stage, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center gap-2 text-xs transition-colors duration-500",
                            idx <= loadingStage ? "text-primary font-medium" : "text-muted-foreground opacity-50"
                          )}
                        >
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            idx < loadingStage ? "bg-primary" :
                            idx === loadingStage ? "bg-primary animate-ping" : "bg-muted"
                          )} />
                          {stage.label.split('...')[0]}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentStep === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl py-12 px-4">
          <Link href="/">
            <Button variant="ghost" className="mb-6" data-testid="button-back-home">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Free AI-Powered Assessment
            </div>
            <h1 className="text-4xl font-bold mb-4" data-testid="text-discovery-title">
              Discover Your AI Automation Opportunities
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Answer a few questions about your business process, and our AI will create a personalized 
              automation roadmap tailored to your specific needs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">2 Minutes</h3>
                <p className="text-sm text-muted-foreground">Quick 3-step questionnaire about your workflow</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">AI Analysis</h3>
                <p className="text-sm text-muted-foreground">Our AI analyzes your needs and identifies opportunities</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Custom Roadmap</h3>
                <p className="text-sm text-muted-foreground">Receive a detailed implementation plan via email</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                What Will AI Analyze?
              </CardTitle>
              <CardDescription>
                Here's what you can expect from your personalized automation outline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid md:grid-cols-2 gap-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Executive Summary</span>
                    <p className="text-sm text-muted-foreground">A clear overview of your automation opportunity</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Recommended Approach</span>
                    <p className="text-sm text-muted-foreground">AI agent, software automation, or hybrid solution</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Implementation Steps</span>
                    <p className="text-sm text-muted-foreground">Step-by-step roadmap for your automation project</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Timeline & Budget</span>
                    <p className="text-sm text-muted-foreground">Realistic estimates based on your requirements</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Key Benefits</span>
                    <p className="text-sm text-muted-foreground">Expected improvements and ROI potential</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Next Steps</span>
                    <p className="text-sm text-muted-foreground">Clear actions to move forward with automation</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Not Sure Where to Start?</CardTitle>
              <CardDescription>
                Click on an example below to pre-fill the form with a common automation use case. 
                You can customize the details to match your specific situation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {exampleUseCases.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => applyExample(example)}
                    className="p-4 border rounded-lg text-left transition-all hover-elevate"
                    data-testid={`button-example-${index}`}
                  >
                    <example.icon className="w-8 h-8 text-primary mb-3" />
                    <h4 className="font-semibold mb-1">{example.title}</h4>
                    <p className="text-sm text-muted-foreground">{example.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button size="lg" onClick={() => setCurrentStep(1)} className="px-8" data-testid="button-start-questionnaire">
              Start Your Discovery
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="mt-4 text-sm text-muted-foreground">
              No commitment required. Your outline will be emailed to you instantly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Automation Discovery — Get Your Free AI Implementation Plan | Steel City AI"
        description="Answer a few questions about your business and receive a personalized AI automation implementation outline. Free, instant, powered by Gemini AI."
        keywords="AI automation discovery, free AI consultation, automation implementation plan, business AI assessment, Steel City AI"
        url={typeof window !== 'undefined' ? window.location.href : 'https://steelcityai.com/automation-discovery'}
        canonical="https://steelcityai.com/automation-discovery"
      />
      <div className="container max-w-3xl py-12 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Automation Discovery</h1>
          <p className="text-muted-foreground">
            Tell us about your business process and we'll create a personalized automation outline powered by AI.
          </p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${step.id <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.id < currentStep
                      ? 'bg-primary text-primary-foreground'
                      : step.id === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {step.id < currentStep ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                </div>
                <span className="text-xs mt-1 hidden sm:block">{step.title}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <HoneypotField value={honeypotValue} onChange={setHoneypotValue} />
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Name *</FormLabel>
                          <FormControl>
                            <Input data-testid="input-contact-name" placeholder="John Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input data-testid="input-contact-email" type="email" placeholder="john@company.com" {...field} />
                          </FormControl>
                          <FormDescription>We'll send your personalized outline here</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name *</FormLabel>
                          <FormControl>
                            <Input data-testid="input-company-name" placeholder="Acme Corporation" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="processName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What process do you want to automate? *</FormLabel>
                          <FormControl>
                            <Input data-testid="input-process-name" placeholder="e.g., Invoice Processing, Customer Onboarding, Report Generation" {...field} />
                          </FormControl>
                          <FormDescription>Give your process a short, descriptive name</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="processDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            Describe this process in detail *
                            <FieldTooltip fieldName="processDescription" />
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              data-testid="textarea-process-description"
                              placeholder="Walk us through the steps involved. What happens from start to finish?"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="painPoints"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            What are your biggest pain points? *
                            <FieldTooltip fieldName="painPoints" />
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              data-testid="textarea-pain-points"
                              placeholder="What frustrates you? What takes too long? Where do errors occur?"
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="desiredOutcome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            What would the ideal outcome look like? *
                            <FieldTooltip fieldName="desiredOutcome" />
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              data-testid="textarea-desired-outcome"
                              placeholder="What would success look like if this was automated?"
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {currentStep === 2 && (
                  <TurnstileWidget 
                    onVerify={setTurnstileToken} 
                    onExpire={() => setTurnstileToken(null)}
                    theme="auto"
                    className="flex justify-center mt-4"
                  />
                )}

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    data-testid="button-prev-step"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  
                  {currentStep < steps.length ? (
                    <Button type="button" onClick={nextStep} data-testid="button-next-step">
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={submitMutation.isPending} data-testid="button-submit">
                      {submitMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate My Outline
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
