import { useState, useEffect, useCallback } from 'react'
import { Link } from 'wouter'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { SEO, seoConfigs } from '@/components/SEO'
import { StructuredData, structuredDataConfigs } from '@/components/StructuredData'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight, Bot, Search, UserCheck, Headphones, FileText, BarChart3,
  Calendar, DollarSign, Users, Server, Sparkles, CheckCircle2,
  MessageSquare, ChevronLeft, ChevronRight, Globe, Zap, Bell, Target,
  TrendingUp, TrendingDown, Layers, UserPlus, Mail, Database, CheckCircle,
  MessageCircle, Brain, ArrowRightLeft, ThumbsUp, Shield, HelpCircle,
  LifeBuoy, Activity, PenTool, Share2, PieChart, Layout, Image as ImageIcon,
  Repeat, Box, AlertTriangle, Truck, Settings, RefreshCw,
  Clock, Link as LinkIcon, Receipt, CreditCard, RefreshCcw, Briefcase, GraduationCap,
  Cpu, Lock, Terminal, FileCheck, Map as MapIcon, Lightbulb
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAnalytics } from '@/components/Analytics'

// ─── Frame definitions per role ──────────────────────────────────────────────
interface WorkflowStep {
  icon: any;
  title: string;
  desc: string;
}

interface WorkflowRoleFrame {
  type: 'workflow';
  label: string;
  title: string;
  description: string;
  steps: WorkflowStep[];
}

interface MetricsRoleFrame {
  type: 'metrics';
  label: string;
  title: string;
  description: string;
  metrics: { label: string; value: string; icon?: any }[];
}

type RoleFrame = WorkflowRoleFrame | MetricsRoleFrame;

const roleFrames: Record<string, RoleFrame[]> = {
  research: [
    {
      type: 'workflow',
      label: 'Market Monitoring',
      title: 'Global Intelligence Feed',
      description: 'Continuous scanning of global markets and competitor activity.',
      steps: [
        { icon: Globe, title: 'Data Sourcing', desc: 'Monitoring 500+ news and competitor channels' },
        { icon: Search, title: 'Contextual Filter', desc: 'AI identifies high-impact market signals' },
        { icon: Zap, title: 'Insight Extraction', desc: 'Summarizes key takeaways and business impact' },
        { icon: Bell, title: 'Instant Alerting', desc: 'Push notifications for critical market shifts' }
      ]
    },
    {
      type: 'metrics',
      label: 'Research Performance',
      title: 'Always-On Analysis',
      description: 'The efficiency of your automated research department.',
      metrics: [
        { label: 'Sources Tracked', value: '1,240', icon: Database },
        { label: 'Insights Weekly', value: '42', icon: Target },
        { label: 'Hours Saved', value: '25/wk', icon: Clock },
        { label: 'Accuracy Rate', value: '98.4%', icon: CheckCircle }
      ]
    },
    {
      type: 'workflow',
      label: 'Competitor Tracking',
      title: 'Strategic Shadowing',
      description: 'Monitoring every move your competitors make online.',
      steps: [
        { icon: Layout, title: 'Site Change Detection', desc: 'Detects pricing and landing page updates' },
        { icon: FileText, title: 'Asset Harvesting', desc: 'Collects new whitepapers and case studies' },
        { icon: TrendingUp, title: 'Impact Analysis', desc: 'Calculates threat level of new features' },
        { icon: BarChart3, title: 'Executive Summary', desc: 'Sends weekly PDF briefing to leadership' }
      ]
    },
    {
      type: 'workflow',
      label: 'Trend Forecasting',
      title: 'Market Signal Analysis',
      description: 'Identifying trends before they become mainstream.',
      steps: [
        { icon: Layers, title: 'Topic Clustering', desc: 'Groups disparate data into emerging trends' },
        { icon: Target, title: 'Sentiment Analysis', desc: 'Measures market reception of new concepts' },
        { icon: Zap, title: 'Opportunity ID', desc: 'Flags gaps in competitor offerings' },
        { icon: ArrowRight, title: 'Strategic Roadmap', desc: 'Provides data-backed growth suggestions' }
      ]
    }
  ],
  sdr: [
    {
      type: 'workflow',
      label: 'Lead Qualification',
      title: 'Intelligent Lead Scoring',
      description: 'Filtering noise to find your next best customer.',
      steps: [
        { icon: UserPlus, title: 'Inbound Capture', desc: 'Instant intake from web, email, and social' },
        { icon: Search, title: 'Lead Enrichment', desc: 'Pulls social and firmographic data' },
        { icon: Target, title: 'Score & Rank', desc: 'Assigns priority based on ideal customer profile' },
        { icon: Database, title: 'CRM Sync', desc: 'Automatic entry into your sales pipeline' }
      ]
    },
    {
      type: 'workflow',
      label: 'Outreach Sequence',
      title: 'Hyper-Personalized Outreach',
      description: 'Sending emails that actually get opened and answered.',
      steps: [
        { icon: Mail, title: 'Drafting Content', desc: 'AI writes unique, personalized messages' },
        { icon: Zap, title: 'Timed Dispatch', desc: 'Sends at the optimal time for the recipient' },
        { icon: Repeat, title: 'Automated Follow-up', desc: 'Smart persistence until intent is detected' },
        { icon: MessageSquare, title: 'Intent Detection', desc: 'Detects "interested" vs "not now" replies' }
      ]
    },
    {
      type: 'metrics',
      label: 'SDR Efficiency',
      title: 'Sales Pipeline Velocity',
      description: 'Performance metrics for your AI sales team.',
      metrics: [
        { label: 'Emails Sent', value: '2,500+', icon: Mail },
        { label: 'Open Rate', value: '64%', icon: Mail },
        { label: 'Meetings Set', value: '18/mo', icon: Calendar },
        { label: 'Reply Rate', value: '12.5%', icon: MessageSquare }
      ]
    },
    {
      type: 'workflow',
      label: 'Meeting Scheduling',
      title: 'Seamless Handover',
      description: 'Converting interest into a calendar event.',
      steps: [
        { icon: MessageCircle, title: 'Intent Confirmation', desc: 'Confirms meeting interest via chat/email' },
        { icon: LinkIcon, title: 'Availability Match', desc: 'Offers slots that work for both parties' },
        { icon: Calendar, title: 'Calendar Invite', desc: 'Sends invite with brief and bio' },
        { icon: UserCheck, title: 'Human Handover', desc: 'Notifies sales rep with full lead context' }
      ]
    }
  ],
  support: [
    {
      type: 'workflow',
      label: 'Ticket Triage',
      title: 'Automated Ticket Routing',
      description: 'Getting every customer to the right solution instantly.',
      steps: [
        { icon: MessageSquare, title: 'Initial Intake', desc: 'Captures issues via chat, email, or web' },
        { icon: Brain, title: 'Sentiment Analysis', desc: 'Detects urgency and customer frustration' },
        { icon: Layers, title: 'Categorization', desc: 'Labels issue (billing, tech, general)' },
        { icon: ArrowRightLeft, title: 'Smart Routing', desc: 'Sends to AI resolution or human expert' }
      ]
    },
    {
      type: 'workflow',
      label: 'AI Resolution',
      title: 'Instant Support Engine',
      description: 'Resolving 70%+ of tickets without human intervention.',
      steps: [
        { icon: Search, title: 'KB Lookup', desc: 'Searches internal docs and past resolutions' },
        { icon: Zap, title: 'Drafting Response', desc: 'Creates human-like, accurate solution' },
        { icon: Shield, title: 'Policy Check', desc: 'Ensures response follows company guidelines' },
        { icon: CheckCircle, title: 'Resolution', desc: 'Closes ticket and updates knowledge base' }
      ]
    },
    {
      type: 'metrics',
      label: 'Support Health',
      title: 'Customer Satisfaction',
      description: 'Real-time metrics for your support operations.',
      metrics: [
        { label: 'Avg Resp Time', value: '< 2m', icon: Clock },
        { label: 'AI Resolution', value: '72%', icon: Zap },
        { label: 'CSAT Score', value: '4.8/5', icon: ThumbsUp },
        { label: 'Tickets/Mo', value: '1.4k', icon: LifeBuoy }
      ]
    },
    {
      type: 'workflow',
      label: 'Escalation Management',
      title: 'Smooth Human Handoff',
      description: 'Ensuring complex issues get the expert care they need.',
      steps: [
        { icon: AlertTriangle, title: 'Complexity Flag', desc: 'Detects when human empathy is needed' },
        { icon: FileText, title: 'Context Gathering', desc: 'Summarizes interaction history for rep' },
        { icon: Bell, title: 'Expert Alert', desc: 'Notifies the relevant human department' },
        { icon: Activity, title: 'Resolution Tracking', desc: 'Monitors outcome for future AI learning' }
      ]
    }
  ],
  content: [
    {
      type: 'workflow',
      label: 'Social Engine',
      title: 'Automated Social Presence',
      description: 'Keeping your brand active across all social channels.',
      steps: [
        { icon: Lightbulb, title: 'Ideation', desc: 'Generates post topics based on trends' },
        { icon: PenTool, title: 'Multi-Format Draft', desc: 'Creates text, threads, and image prompts' },
        { icon: Share2, title: 'Publishing', desc: 'Auto-posts to LinkedIn, X, and Instagram' },
        { icon: TrendingUp, title: 'Engagement Monitor', desc: 'Tracks likes, shares, and comments' }
      ]
    },
    {
      type: 'workflow',
      label: 'Content Pipeline',
      title: 'Editorial Workflow',
      description: 'Managing high-quality content from idea to published.',
      steps: [
        { icon: Layout, title: 'Outlining', desc: 'Creates SEO-optimized blog structures' },
        { icon: FileText, title: 'First Draft', desc: 'AI generates high-quality technical content' },
        { icon: Search, title: 'SEO Review', desc: 'Optimizes keywords and readability' },
        { icon: Repeat, title: 'Repurposing', desc: 'Turns blog into 10 social posts' }
      ]
    },
    {
      type: 'metrics',
      label: 'Content Reach',
      title: 'Digital Footprint Growth',
      description: 'Measuring the impact of your AI content team.',
      metrics: [
        { label: 'Monthly Posts', value: '120', icon: Share2 },
        { label: 'Impressions', value: '450k', icon: Activity },
        { label: 'Engagement', value: '+32%', icon: TrendingUp },
        { label: 'Leads from Content', value: '84', icon: Target }
      ]
    },
    {
      type: 'workflow',
      label: 'Newsletter Engine',
      title: 'Email Nurture Flow',
      description: 'Driving consistent value to your email subscribers.',
      steps: [
        { icon: Mail, title: 'Curation', desc: 'Aggregates top news and internal updates' },
        { icon: ImageIcon, title: 'Design', desc: 'Builds beautiful, responsive email layouts' },
        { icon: Users, title: 'Segmentation', desc: 'Tailors content to specific user groups' },
        { icon: BarChart3, title: 'Analytics', desc: 'Tracks clicks and conversion metrics' }
      ]
    }
  ],
  operations: [
    {
      type: 'workflow',
      label: 'Inventory Watch',
      title: 'Stock Optimization',
      description: 'Never run out of your best-selling items again.',
      steps: [
        { icon: Box, title: 'Real-time Tracking', desc: 'Monitors inventory across all warehouses' },
        { icon: TrendingUp, title: 'Demand Prediction', desc: 'Forecasts stock needs based on trends' },
        { icon: AlertTriangle, title: 'Low Stock Alert', desc: 'Flags items hitting reorder points' },
        { icon: Truck, title: 'Auto-Reorder', desc: 'Generates purchase orders for suppliers' }
      ]
    },
    {
      type: 'workflow',
      label: 'Process Monitor',
      title: 'Anomaly Detection',
      description: 'Catching operational glitches before they hit the bottom line.',
      steps: [
        { icon: Database, title: 'Data Ingestion', desc: 'Connects to ERP, CRM, and Logistics data' },
        { icon: Activity, title: 'Pattern Match', desc: 'Learns your normal business rhythm' },
        { icon: Zap, title: 'Anomaly Alert', desc: 'Detects unusual delays or cost spikes' },
        { icon: Settings, title: 'Root Cause ID', desc: 'Isolates where the process is failing' }
      ]
    },
    {
      type: 'metrics',
      label: 'Ops Performance',
      title: 'Operational Efficiency',
      description: 'Health of your business infrastructure.',
      metrics: [
        { label: 'Supply Chain', value: 'Optimal', icon: Truck },
        { label: 'Inventory Cost', value: '-15%', icon: DollarSign },
        { label: 'Process Speed', value: '+22%', icon: Zap },
        { label: 'Error Rate', value: '0.02%', icon: CheckCircle }
      ]
    },
    {
      type: 'workflow',
      label: 'Automated Reporting',
      title: 'Executive Intelligence',
      description: 'Giving leadership a clear view of the business daily.',
      steps: [
        { icon: Layers, title: 'Data Aggregation', desc: 'Pulls metrics from 10+ departments' },
        { icon: PieChart, title: 'Visualization', desc: 'Creates easy-to-read charts and graphs' },
        { icon: PenTool, title: 'Insights Writing', desc: 'AI explains the "why" behind the numbers' },
        { icon: Mail, title: 'Distribution', desc: 'Sends daily summary to stakeholders' }
      ]
    }
  ],
  scheduling: [
    {
      type: 'workflow',
      label: 'Self-Service Booking',
      title: 'Smart Availability',
      description: 'Eliminating the "when are you free?" dance.',
      steps: [
        { icon: LinkIcon, title: 'Booking Link', desc: 'Unique links for different meeting types' },
        { icon: Calendar, title: 'Conflict Filter', desc: 'Cross-checks all personal & work cals' },
        { icon: Clock, title: 'Buffer Management', desc: 'Ensures no back-to-back fatigue' },
        { icon: CheckCircle, title: 'Instant Booking', desc: 'Lead self-schedules in seconds' }
      ]
    },
    {
      type: 'workflow',
      label: 'Reminder Sequence',
      title: 'No-Show Prevention',
      description: 'Ensuring everyone shows up prepared and on time.',
      steps: [
        { icon: Mail, title: 'Confirm Email', desc: 'Sent immediately with agenda and link' },
        { icon: MessageSquare, title: '24h SMS', desc: 'Text reminder for high-priority meetings' },
        { icon: Bell, title: '1h Alert', desc: 'Final nudge with meeting instructions' },
        { icon: Repeat, title: 'Post-Meeting', desc: 'Automatic follow-up and resource send' }
      ]
    },
    {
      type: 'metrics',
      label: 'Calendar Health',
      title: 'Time Optimization',
      description: 'How we reclaimed your team\'s time.',
      metrics: [
        { label: 'Meetings Booked', value: '340', icon: Calendar },
        { label: 'No-Show Rate', value: '2.4%', icon: AlertTriangle },
        { label: 'Time Reclaimed', value: '12h/wk', icon: Clock },
        { label: 'Reschedule Rate', value: '5%', icon: RefreshCw }
      ]
    },
    {
      type: 'workflow',
      label: 'Team Coordination',
      title: 'Load Balancing',
      description: 'Fairly distributing meetings across your entire team.',
      steps: [
        { icon: Users, title: 'Round Robin', desc: 'Assigns leads to reps sequentially' },
        { icon: Target, title: 'Priority Routing', desc: 'Sends VIP leads to senior reps' },
        { icon: Activity, title: 'Capacity Check', desc: 'Prevents over-scheduling any one rep' },
        { icon: BarChart3, title: 'Performance', desc: 'Tracks conversion per team member' }
      ]
    }
  ],
  finance: [
    {
      type: 'workflow',
      label: 'Invoicing Cycle',
      title: 'Automated Billing',
      description: 'Getting paid faster with zero manual effort.',
      steps: [
        { icon: Receipt, title: 'Invoice Gen', desc: 'Created automatically when project ends' },
        { icon: Mail, title: 'Dispatch', desc: 'Sent directly to client billing contact' },
        { icon: Clock, title: 'Payment Watch', desc: 'Monitors bank feeds for incoming funds' },
        { icon: CheckCircle, title: 'Auto-Reconcile', desc: 'Updates ledger and closes project' }
      ]
    },
    {
      type: 'workflow',
      label: 'Collections Engine',
      title: 'Smart AR Follow-up',
      description: 'Professional, persistent follow-up on late payments.',
      steps: [
        { icon: AlertTriangle, title: 'Past Due Alert', desc: 'Flags invoices at 1, 7, and 14 days late' },
        { icon: MessageSquare, title: 'Gentle Nudge', desc: 'Polite reminder email/SMS sent' },
        { icon: CreditCard, title: 'Payment Portal', desc: 'One-click pay options provided' },
        { icon: Shield, title: 'Escalation', desc: 'Notifies human team for critical delays' }
      ]
    },
    {
      type: 'metrics',
      label: 'Finance Health',
      title: 'Cash Flow Clarity',
      description: 'Real-time visibility into your company\'s money.',
      metrics: [
        { label: 'Avg Days to Pay', value: '14.2', icon: Calendar },
        { label: 'Invoiced / Mo', value: '$120k', icon: DollarSign },
        { label: 'Expense Savings', value: '12%', icon: TrendingDown },
        { label: 'Audit Ready', value: '100%', icon: Shield }
      ]
    },
    {
      type: 'workflow',
      label: 'Expense Audit',
      title: 'Autonomous Bookkeeping',
      description: 'Categorizing every dollar without opening a spreadsheet.',
      steps: [
        { icon: ImageIcon, title: 'OCR Capture', desc: 'Extracts data from receipts and invoices' },
        { icon: Layers, title: 'Classification', desc: 'AI assigns to tax-ready categories' },
        { icon: RefreshCcw, title: 'Sync to ERP', desc: 'Pushes data to QuickBooks or Xero' },
        { icon: FileText, title: 'VAT/Tax Check', desc: 'Ensures compliance with local rules' }
      ]
    }
  ],
  hr: [
    {
      type: 'workflow',
      label: 'Onboarding Path',
      title: 'The Perfect Day One',
      description: 'Automating the paperwork so you can focus on the person.',
      steps: [
        { icon: UserPlus, title: 'Pre-boarding', desc: 'Sends offer and welcome materials' },
        { icon: Cpu, title: 'IT Provisioning', desc: 'Creates accounts and orders hardware' },
        { icon: GraduationCap, title: 'Training Plan', desc: 'Assigns custom learning modules' },
        { icon: Briefcase, title: 'Orientation', desc: 'Schedules intros with key team members' }
      ]
    },
    {
      type: 'workflow',
      label: 'Document Bot',
      title: 'Compliance & Paperwork',
      description: 'Handling the administrative heavy lifting of HR.',
      steps: [
        { icon: FileText, title: 'Form Request', desc: 'Asks for IDs, tax forms, and NDAs' },
        { icon: FileCheck, title: 'Verification', desc: 'AI checks for signatures and completeness' },
        { icon: Lock, title: 'Secure Vault', desc: 'Encrypted storage of sensitive employee info' },
        { icon: Bell, title: 'Expiry Alert', desc: 'Notifies team when certifications lapse' }
      ]
    },
    {
      type: 'metrics',
      label: 'HR Pulse',
      title: 'Employee Experience',
      description: 'Measuring the health of your digital workforce.',
      metrics: [
        { label: 'Time to Onboard', value: '-65%', icon: Clock },
        { label: 'Doc Accuracy', value: '99.9%', icon: FileCheck },
        { label: 'Engagement', value: 'High', icon: Activity },
        { label: 'Open Roles', value: '4', icon: Briefcase }
      ]
    },
    {
      type: 'workflow',
      label: 'Team Directory',
      title: 'Organizational Intelligence',
      description: 'Keeping your company structure clean and accessible.',
      steps: [
        { icon: MapIcon, title: 'Org Chart Gen', desc: 'Visualizes reporting lines automatically' },
        { icon: Users, title: 'Role Mapping', desc: 'Defines skills and responsibilities' },
        { icon: Settings, title: 'Access Control', desc: 'Syncs permissions with current role' },
        { icon: Search, title: 'Talent Search', desc: 'Find internal experts via skill tags' }
      ]
    }
  ],
  infrastructure: [
    {
      type: 'workflow',
      label: 'System Monitoring',
      title: 'Proactive Health Checks',
      description: 'Finding network issues before your team does.',
      steps: [
        { icon: Activity, title: 'Network Probe', desc: 'Continuous pings to routers & switches' },
        { icon: Cpu, title: 'Resource Audit', desc: 'Monitors CPU, RAM, and disk health' },
        { icon: BarChart3, title: 'Latency Watch', desc: 'Detects slowdowns in critical systems' },
        { icon: Shield, title: 'Security Scan', desc: 'Checks for unauthorized access attempts' }
      ]
    },
    {
      type: 'workflow',
      label: 'Self-Healing',
      title: 'Automated Recovery',
      description: 'Fixing common IT problems without a ticket.',
      steps: [
        { icon: AlertTriangle, title: 'Issue Detection', desc: 'Flags device as unresponsive' },
        { icon: Terminal, title: 'Diagnostics', desc: 'Runs automated tests to find root cause' },
        { icon: RefreshCw, title: 'Auto-Reboot', desc: 'Safe restart via smart PDU or API' },
        { icon: CheckCircle, title: 'Verification', desc: 'Confirms system is back to full health' }
      ]
    },
    {
      type: 'metrics',
      label: 'Infra Health',
      title: 'Network Reliability',
      description: 'Uptime and performance for your physical network.',
      metrics: [
        { label: 'Uptime', value: '99.99%', icon: Activity },
        { label: 'Self-Healed', value: '14/mo', icon: Zap },
        { label: 'Last Backup', value: '2h ago', icon: Database },
        { label: 'Threats Blocked', value: '1.2k', icon: Lock }
      ]
    },
    {
      type: 'workflow',
      label: 'Backup Vault',
      title: 'Data Insurance',
      description: 'Ensuring your configurations are always safe.',
      steps: [
        { icon: Settings, title: 'Config Poll', desc: 'Grabs current settings from all devices' },
        { icon: Repeat, title: 'Diff Check', desc: 'Detects unauthorized manual changes' },
        { icon: Database, title: 'Offsite Sync', desc: 'Encrypted upload to cloud storage' },
        { icon: Lock, title: 'Version Control', desc: 'Allows instant rollback to any point' }
      ]
    }
  ]
}

// ─── Carousel Component ───────────────────────────────────────────────────────
interface AgentCarouselProps {
  roleId: string
  roleName: string
}

function WorkflowSlide({ frame }: { frame: RoleFrame }) {
  return (
    <div className="w-full h-full p-6 flex flex-col bg-card overflow-hidden relative">
      <div className="mb-6 relative z-10">
        <Badge variant="outline" className="mb-2 text-[10px] uppercase tracking-wider opacity-70">
          {frame.label}
        </Badge>
        <h4 className="text-xl font-bold text-foreground leading-tight">{frame.title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{frame.description}</p>
      </div>

      <div className="flex-1 relative flex flex-col justify-center z-10">
        {frame.type === 'workflow' && (
          <div className="space-y-4">
            {frame.steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 relative group"
              >
                <div className="relative z-10">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <step.icon className="w-4 h-4" />
                  </div>
                  {i < frame.steps.length - 1 && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-4 bg-border/50" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">{step.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{step.desc}</div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {frame.type === 'metrics' && (
           <div className="grid grid-cols-2 gap-4">
             {frame.metrics.map((metric, i) => (
               <motion.div
                 key={i}
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: i * 0.1 }}
                 className="p-4 rounded-xl border bg-muted/30 flex flex-col items-center text-center group hover:border-primary/50 transition-colors"
               >
                 {metric.icon && <metric.icon className="w-5 h-5 text-primary mb-2 opacity-70 group-hover:opacity-100" />}
                 <div className="text-2xl font-bold text-foreground">{metric.value}</div>
                 <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{metric.label}</div>
               </motion.div>
             ))}
           </div>
        )}
      </div>

      {/* Decorative background element */}
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none z-0">
        <Bot className="w-32 h-32" />
      </div>
    </div>
  )
}

function AgentCarousel({ roleId, roleName }: AgentCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const frames = roleFrames[roleId] || []

  const prev = useCallback(() => {
    setCurrentIndex((i) => (i === 0 ? frames.length - 1 : i - 1))
  }, [frames.length])

  const next = useCallback(() => {
    setCurrentIndex((i) => (i === frames.length - 1 ? 0 : i + 1))
  }, [frames.length])

  // Reset to first frame when roleId changes (e.g., scroll to different role)
  useEffect(() => {
    setCurrentIndex(0)
  }, [roleId])

  if (frames.length === 0) return null

  return (
    <div className="relative">
      {/* Glow border */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/5 rounded-lg blur-sm" />

      {/* Carousel container */}
      <div className="relative rounded-lg overflow-hidden border border-border bg-card shadow-2xl">
        {/* Slide area */}
        <div className="relative overflow-hidden" style={{ height: '380px' }}>
          <div
            className="flex h-full transition-transform duration-500 ease-out"
            style={{ width: `${frames.length * 100}%`, transform: `translateX(-${currentIndex * (100 / frames.length)}%)` }}
          >
            {frames.map((frame, i) => (
              <div
                key={i}
                className="flex-shrink-0"
                style={{ width: `${100 / frames.length}%` }}
              >
                <WorkflowSlide frame={frame} />
              </div>
            ))}
          </div>

          {/* Prev / Next arrows */}
          {frames.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/5 hover:bg-black/10 text-foreground transition-colors z-20"
                aria-label="Previous frame"
              >
                <ChevronLeft className="w-5 h-5 opacity-50" />
              </button>
              <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/5 hover:bg-black/10 text-foreground transition-colors z-20"
                aria-label="Next frame"
              >
                <ChevronRight className="w-5 h-5 opacity-50" />
              </button>
            </>
          )}
        </div>

        {/* Dot indicators */}
        {frames.length > 1 && (
          <div className="flex items-center justify-center gap-2 py-3 bg-card">
            {frames.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`rounded-full transition-all ${
                  i === currentIndex
                    ? 'w-3 h-3 bg-primary'
                    : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Go to frame ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Role data ────────────────────────────────────────────────────────────────
const roles = [
  {
    id: 'research',
    icon: Search,
    name: 'Research Agent',
    tagline: 'Your always-on competitive intelligence team.',
    description: 'Stop paying for expensive market research reports that are outdated the moment you get them. The Research Agent monitors your competitors, tracks pricing shifts, and surfaces industry news—delivering fresh insights straight to your inbox every week.',
    whatItDoes: [
      'Tracks competitor pricing, product launches, and messaging in real-time',
      'Monitors industry news and surfaces relevant stories automatically',
      'Pulls data from multiple sources into a single, searchable dashboard',
      'Delivers weekly PDF intelligence reports formatted for your team',
      'Alerts you to market shifts before your competitors act'
    ],
    replaces: 'Expensive market research firms, manual competitor tracking spreadsheets',
    deliverables: 'Weekly PDF reports, competitor dashboards, pricing alerts, industry digests',
  },
  {
    id: 'sdr',
    icon: UserCheck,
    name: 'SDR (Sales Development Rep)',
    tagline: 'Turns cold leads into warm conversations—without the cold calling.',
    description: 'Your SDR works around the clock scoring leads, sending personalized outreach, and booking meetings. No more lost leads sitting in your CRM for weeks. The AI SDR knows when to follow up, what to say, and how to qualify prospects before they ever reach your calendar.',
    whatItDoes: [
      'Scores and prioritizes leads based on engagement signals',
      'Sends personalized cold emails and follow-ups at scale',
      'Schedules discovery calls directly into your calendar',
      'Qualifies prospects using your custom criteria before human handoff',
      'Keeps your CRM data clean and up-to-date automatically'
    ],
    replaces: 'Hired SDR, list purchasing, manual lead follow-up',
    deliverables: 'Qualified meeting bookings, cleaned CRM records, outreach email sequences',
  },
  {
    id: 'support',
    icon: Headphones,
    name: 'Support Agent',
    tagline: 'Instant answers, 24/7—without the hold music.',
    description: 'Customers hate waiting. Your AI Support Agent handles the questions that eat up your team\'s time—order status, return policies, common troubleshooting—while seamlessly escalating complex issues to humans. It learns from every interaction to get smarter over time.',
    whatItDoes: [
      'Answers order status, return, and refund questions instantly',
      'Triages support tickets by urgency and routes them correctly',
      'Handles chatbot, live chat, and email support across channels',
      'Escalates complex issues to human agents with full context',
      'Works 24/7/365—no sick days, no overtime, no complaints'
    ],
    replaces: 'Tier-1 support staff, outsourced call centers, basic FAQ pages',
    deliverables: 'Ticket resolution summaries, escalation reports, FAQ knowledge base',
  },
  {
    id: 'content',
    icon: FileText,
    name: 'Content Coordinator',
    tagline: 'Your editorial calendar, never empty.',
    description: 'Consistent content is the foundation of inbound marketing—but creating it is a full-time job. The Content Coordinator manages your content pipeline: drafting social posts, outlining blog articles, writing email sequences, and keeping your editorial calendar full and on schedule.',
    whatItDoes: [
      'Drafts social media posts for LinkedIn, Twitter, Instagram, Facebook',
      'Writes email nurture sequences and newsletter content',
      'Creates blog outlines and first drafts based on your topics',
      'Builds and maintains content calendars across all channels',
      'Generates ad copy variations for A/B testing'
    ],
    replaces: 'Freelance content writers, in-house content coordinator, social media manager',
    deliverables: 'Social post drafts, email sequences, blog outlines, content calendars',
  },
  {
    id: 'operations',
    icon: BarChart3,
    name: 'Operations Analyst',
    tagline: 'Know what\'s happening before it becomes a problem.',
    description: 'Most businesses react to problems. The Operations Analyst watches your KPIs, inventory levels, and performance metrics in real-time—catching anomalies before they become crises. Weekly reports land in your inbox automatically, so you\'re always informed without chasing data.',
    whatItDoes: [
      'Monitors KPI dashboards and flags underperforming metrics',
      'Tracks inventory levels and triggers reorders automatically',
      'Detects anomalies and sends alerts before issues escalate',
      'Generates weekly performance reports formatted for leadership',
      'Connects to your existing tools—no rip-and-replace required'
    ],
    replaces: 'Operations manager check-ins, manual reporting, BI analyst for basic dashboards',
    deliverables: 'Weekly performance reports, KPI dashboards, anomaly alerts, inventory reports',
  },
  {
    id: 'scheduling',
    icon: Calendar,
    name: 'Scheduling Coordinator',
    tagline: 'Calendar chaos, solved.',
    description: 'Back-and-forth scheduling emails waste hours every week—for both you and your clients. The Scheduling Coordinator owns your calendar completely: sending booking links, handling reschedules, sending reminders, and confirming appointments. Your clients love it. You\'ll wonder how you lived without it.',
    whatItDoes: [
      'Syncs with Google Calendar, Outlook, or Apple Calendar',
      'Sends personalized booking links clients can self-schedule from',
      'Handles reschedules and cancellations automatically',
      'Sends reminder emails and SMS texts before appointments',
      'Confirms appointments and adds them to your calendar instantly'
    ],
    replaces: 'Executive assistant for scheduling, scheduling software subscriptions',
    deliverables: 'Booking confirmations, calendar sync, reminder sequences, reschedule workflows',
  },
  {
    id: 'finance',
    icon: DollarSign,
    name: 'Finance Assistant',
    tagline: 'Cash flow clarity, without the spreadsheet marathon.',
    description: 'Chasing invoices and categorizing expenses is nobody\'s idea of a good time—but it\'s critical to keeping the lights on. The Finance Assistant handles the operational finance work: sending invoices, following up on late payments, categorizing expenses, and reconciling bank transactions.',
    whatItDoes: [
      'Generates and sends invoices based on your templates',
      'Follows up on overdue invoices with polite, firm reminders',
      'Categorizes expenses automatically from receipts and transactions',
      'Reconciles bank transactions weekly to catch discrepancies',
      'Sends payment reminders and tracks payment status in real-time'
    ],
    replaces: 'Bookkeeper\'s operational tasks, accounting software automation, AP/AR follow-up',
    deliverables: 'Invoice tracking reports, expense categorizations, payment reminder sequences',
  },
  {
    id: 'hr',
    icon: Users,
    name: 'HR Onboarding Agent',
    tagline: 'New hires feel welcome from minute one.',
    description: 'Getting a new employee set up is a surprising amount of work—and it\'s easy to miss something. The HR Onboarding Agent handles the administrative side: creating accounts, sending welcome emails, distributing paperwork, and scheduling orientation. New hires get a polished experience. Your HR team gets their time back.',
    whatItDoes: [
      'Creates accounts in all the tools your new hire needs access to',
      'Sends personalized welcome emails with next steps and resources',
      'Distributes and tracks required HR documents and forms',
      'Schedules orientation meetings and training sessions automatically',
      'Follows up to ensure new hires complete all onboarding steps'
    ],
    replaces: 'HR coordinator for administrative onboarding tasks, new hire checklist management',
    deliverables: 'Welcome email sequences, orientation schedules, onboarding checklists',
  },
  {
    id: 'infrastructure',
    icon: Server,
    name: 'Infrastructure Agent',
    tagline: 'Your network never sleeps—but you can.',
    description: 'Network outages don\'t wait for business hours. The Infrastructure Agent monitors your cameras, access control systems, routers, and switches—automatically rebooting devices when they misbehave, backing up configurations, and alerting you to issues before they take down your network.',
    whatItDoes: [
      'Monitors cameras, access control, routers, and switches continuously',
      'Performs automated reboots when devices become unresponsive',
      'Backs up device configurations on a schedule you define',
      'Queries devices via SNMP/API to pull status and health data',
      'Sends alerts when issues are detected—and attempts self-healing first'
    ],
    replaces: 'After-hours IT on-call, manual network monitoring rounds, basic NMS tools',
    deliverables: 'Device health reports, config backups, outage logs, SNMP monitoring data',
  },
]

export default function AIEmployees() {
  const { trackEvent, trackBusinessGoal } = useAnalytics()

  useEffect(() => {
    trackEvent({
      action: 'ai_employees_page_view',
      category: 'engagement',
      label: 'ai_employees'
    })
  }, [])

  const handleGetStarted = () => {
    trackEvent({
      action: 'ai_employees_cta_click',
      category: 'conversion',
      label: 'ai_employees_page'
    })
    trackBusinessGoal('consultation_request', {
      source: 'ai_employees_page'
    })
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleRoleLearnMore = (roleName: string) => {
    trackEvent({
      action: 'role_learn_more_click',
      category: 'ai_employees',
      label: roleName.toLowerCase().replace(/\s+/g, '_')
    })
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO {...seoConfigs.aiEmployees} />
      <StructuredData
        type="Service"
        data={structuredDataConfigs.service({
          name: "Ready-to-Deploy AI Employees",
          description: "Specialized AI roles ready to work 24/7 as part of your digital workforce",
          provider: "Steel City AI",
          areaServed: "United States"
        })}
      />
      <Header />

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6">
              <Bot className="w-3 h-3 mr-1" />
              Ready-to-Deploy AI Employees
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Hire an AI Employee.<br />
              <span className="text-primary">No resumes. No onboarding.</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Nine specialized AI roles, ready to work 24/7. From researching competitors to scheduling meetings to monitoring your network—each one built to handle the tasks that eat up your team's time.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" onClick={handleGetStarted}>
                Talk to Our Team
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#roles">
                  See All Roles
                </a>
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Roles Available', value: '9+' },
              { label: 'Works 24/7', value: 'Always' },
              { label: 'Setup Time', value: 'Days' },
              { label: 'No Salaries', value: 'True' }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-16 bg-muted/30" id="roles">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Meet Your AI Workforce
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Each role is a specialized AI agent trained for its function—built to integrate with your existing tools and start delivering value within days.
            </p>
          </div>

          <div className="space-y-16">
            {roles.map((role, index) => (
              <div key={role.id} id={`role-${role.id}`}>
                <div className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                  {/* Content Side */}
                  <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <role.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-foreground">{role.name}</h3>
                        <p className="text-sm text-primary font-medium">{role.tagline}</p>
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-6 text-lg">
                      {role.description}
                    </p>

                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
                        What It Does
                      </h4>
                      <ul className="space-y-2">
                        {role.whatItDoes.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline" className="text-xs">
                        Replaces: {role.replaces}
                      </Badge>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-2">
                        Deliverables
                      </h4>
                      <p className="text-sm text-muted-foreground">{role.deliverables}</p>
                    </div>

                    <Button onClick={() => handleRoleLearnMore(role.name)}>
                      Get Started with {role.name}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>

                  {/* Carousel Side */}
                  <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                    <AgentCarousel roleId={role.id} roleName={role.name} />
                  </div>
                </div>
                {index < roles.length - 1 && (
                  <div className="border-t border-border/50 mt-16" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Roles Section */}
      <section className="py-24 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-6">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
              Don't See Your Role?
            </h2>
            <p className="text-xl text-muted-foreground mb-4">
              We build custom AI employees for any workflow you can describe.
            </p>
            <p className="text-lg text-muted-foreground mb-8">
              Got a unique process that doesn't fit a standard template? Tell us what you need. We'll design an AI employee around your specific workflow, connect it to your tools, and get it running in days—not months.
            </p>
            <Button size="lg" onClick={handleGetStarted}>
              <MessageSquare className="mr-2 h-5 w-5" />
              Describe Your Workflow
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-background" id="contact">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card rounded-lg border border-border p-8 md:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Ready to Automate?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Let's talk about which AI employees would make the biggest impact for your business. No sales pressure—just a straightforward conversation about your workflows and how we can automate them.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" onClick={handleGetStarted}>
                Schedule a Consultation
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/">
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
