import { useState, useEffect, useRef, lazy, Suspense, type ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Zap,
  FileText,
  Bot,
  Megaphone,
  UserCircle,
  MessageSquare,
  CalendarDays,
  BarChart3,
  ClipboardCheck,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PortalLayout from './PortalLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Lazy load tabs for route-level code splitting
const DashboardTab = lazy(() => import('./social/DashboardTab').then((m) => ({ default: m.DashboardTab })));
const PostsTab = lazy(() => import('./social/PostsTab'));
const CreatePostTab = lazy(() => import('./social/CreatePostTab'));
const CampaignsTab = lazy(() => import('./social/CampaignsTab'));
const AccountsTab = lazy(() => import('./social/AccountsTab'));
const BrandVoiceTab = lazy(() => import('./social/BrandVoiceTab'));
const ContentCalendarTab = lazy(() => import('./social/ContentCalendarTab'));
const AnalyticsTab = lazy(() => import('./social/AnalyticsTab'));
const ApprovalQueueTab = lazy(() => import('./social/ApprovalQueueTab'));

interface PortalSocialMediaProps {
  clientSlug: string;
}

const VALID_TABS = ['dashboard', 'posts', 'create', 'campaigns', 'accounts', 'brand-voice', 'calendar', 'analytics', 'approvals'];
const TAB_ALIASES: Record<string, string> = { 'ai-compose': 'create' };

const TabSkeleton = () => (
  <div className="space-y-4" role="status" aria-live="polite" aria-busy="true">
    <span className="sr-only">Loading tab content...</span>
    <Skeleton className="h-8 w-64" />
    <Skeleton className="h-40 w-full" />
    <Skeleton className="h-40 w-full" />
  </div>
);

/** Wraps a lazy-loaded tab with error boundary + suspense */
function SafeTab({ name, children }: { name: string; children: ReactNode }) {
  return (
    <ErrorBoundary level="tab" name={name}>
      <Suspense fallback={<TabSkeleton />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

export default function PortalSocialMedia({ clientSlug }: PortalSocialMediaProps) {
  const urlParams = new URLSearchParams(window.location.search);
  const rawTab = urlParams.get('tab') || 'dashboard';
  const mappedTab = TAB_ALIASES[rawTab] ?? rawTab;
  const initialTab = VALID_TABS.includes(mappedTab) ? mappedTab : 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { toast } = useToast();
  const handledOAuth = useRef(false);

  useEffect(() => {
    if (handledOAuth.current) return;
    const connected = urlParams.get('connected');
    const oauthError = urlParams.get('error');
    if (connected) {
      handledOAuth.current = true;
      toast({ title: 'Account connected', description: `${connected} account has been linked successfully.` });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (oauthError) {
      handledOAuth.current = true;
      const errorMessages: Record<string, string> = {
        no_pages: 'No Facebook Pages found. Make sure your Facebook account is an admin of at least one Facebook Page. Personal profiles cannot be connected — only Pages.',
        pages_declined: 'You declined the required Facebook Pages permissions. Please try again and click "Edit previous settings" to grant access to your Pages.',
        pages_not_granted: 'The "pages_show_list" permission was not granted. Please try again, click "Edit previous settings" on the Facebook dialog, and make sure all permissions are checked.',
        no_code: 'OAuth authorization was not completed.',
      };
      toast({
        title: 'Connection failed',
        description: errorMessages[oauthError] || 'An error occurred while connecting the account.',
        variant: 'destructive',
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [toast]);

  return (
    <PortalLayout clientSlug={clientSlug}>
      <ErrorBoundary level="root" name="PortalSocialMedia">
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} aria-label="Social media management sections">
          <TabsList className="flex-wrap">
            <TabsTrigger value="dashboard" className="gap-1">
              <Zap className="h-4 w-4" aria-hidden="true" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="posts" className="gap-1">
              <FileText className="h-4 w-4" aria-hidden="true" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="create" className="gap-1">
              <Bot className="h-4 w-4" aria-hidden="true" />
              AI Compose
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-1">
              <Megaphone className="h-4 w-4" aria-hidden="true" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="accounts" className="gap-1">
              <UserCircle className="h-4 w-4" aria-hidden="true" />
              Accounts
            </TabsTrigger>
            <TabsTrigger value="brand-voice" className="gap-1">
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              Brand Voice
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1">
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="approvals" className="gap-1">
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              Approvals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" aria-label="Dashboard tab content">
            <SafeTab name="DashboardTab">
              <DashboardTab />
            </SafeTab>
          </TabsContent>
          <TabsContent value="posts" aria-label="Posts tab content">
            <SafeTab name="PostsTab">
              <PostsTab />
            </SafeTab>
          </TabsContent>
          <TabsContent value="create" aria-label="AI Compose tab content">
            <SafeTab name="CreatePostTab">
              <CreatePostTab />
            </SafeTab>
          </TabsContent>
          <TabsContent value="campaigns" aria-label="Campaigns tab content">
            <SafeTab name="CampaignsTab">
              <CampaignsTab />
            </SafeTab>
          </TabsContent>
          <TabsContent value="accounts" aria-label="Accounts tab content">
            <SafeTab name="AccountsTab">
              <AccountsTab />
            </SafeTab>
          </TabsContent>
          <TabsContent value="brand-voice" aria-label="Brand Voice tab content">
            <SafeTab name="BrandVoiceTab">
              <BrandVoiceTab />
            </SafeTab>
          </TabsContent>
          <TabsContent value="calendar" aria-label="Content Calendar tab content">
            <SafeTab name="ContentCalendarTab">
              <ContentCalendarTab />
            </SafeTab>
          </TabsContent>
          <TabsContent value="analytics" aria-label="Analytics tab content">
            <SafeTab name="AnalyticsTab">
              <AnalyticsTab />
            </SafeTab>
          </TabsContent>
          <TabsContent value="approvals" aria-label="Approval Queue tab content">
            <SafeTab name="ApprovalQueueTab">
              <ApprovalQueueTab />
            </SafeTab>
          </TabsContent>
        </Tabs>
      </div>
      </ErrorBoundary>
    </PortalLayout>
  );
}
