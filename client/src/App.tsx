import { lazy, Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, ProtectedRoute } from "@/lib/auth";
import { AnalyticsProvider, AnalyticsDebug } from "@/components/Analytics";
import { Skeleton } from "@/components/ui/skeleton";

// Eagerly loaded: Home is the landing page, always needed on first load
import Home from "@/pages/Home";
// ChatWidget is statically imported by Header (used in Home), so lazy-loading
// would not create a separate chunk. Import eagerly to avoid the Vite warning.
import ChatWidget from "@/components/ChatWidget";

// Lazy-loaded route components — each becomes its own chunk
const OnboardingService = lazy(() => import("@/pages/services/OnboardingService"));
const Login = lazy(() => import("@/pages/Login"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const ClientsPage = lazy(() => import("@/pages/admin/ClientsPage"));
const ClientDetail = lazy(() => import("@/pages/admin/ClientDetail"));
const ProjectDashboard = lazy(() => import("@/pages/admin/ProjectDashboard"));
const ConsultationsPage = lazy(() => import("@/pages/admin/ConsultationsPage"));
const DocumentProcessing = lazy(() => import("@/pages/services/DocumentProcessing"));
const CustomAgentAutomation = lazy(() => import("@/pages/services/CustomAgentAutomation"));
const MarketingAutomation = lazy(() => import("@/pages/services/MarketingAutomation"));
const DataAnalysis = lazy(() => import("@/pages/services/DataAnalysis"));
const CustomSolutions = lazy(() => import("@/pages/services/CustomSolutions"));
const ChatManagementPage = lazy(() => import("@/pages/admin/ChatManagementPage"));
const SupportTicketsPage = lazy(() => import("@/pages/admin/SupportTicketsPage"));
const AutomationDiscoveryAdmin = lazy(() => import("@/pages/admin/AutomationDiscoveryAdmin"));
const ChatbotSettingsPage = lazy(() => import("@/pages/admin/ChatbotSettingsPage"));
const SocialMediaPage = lazy(() => import("@/pages/admin/SocialMediaPage"));
const AutomationDiscovery = lazy(() => import("@/pages/AutomationDiscovery"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const SocialMediaPrivacy = lazy(() => import("@/pages/SocialMediaPrivacy"));
const SocialMediaTerms = lazy(() => import("@/pages/SocialMediaTerms"));
const Terms = lazy(() => import("@/pages/Terms"));
const Cookies = lazy(() => import("@/pages/Cookies"));
const Careers = lazy(() => import("@/pages/Careers"));
const Blog = lazy(() => import("@/pages/Blog"));
const Support = lazy(() => import("@/pages/Support"));
const PitchDeck = lazy(() => import("@/pages/PitchDeck"));
const AIEmployees = lazy(() => import("@/pages/AIEmployees"));
const NotFound = lazy(() => import("@/pages/not-found"));
const PortalLogin = lazy(() => import("@/pages/portal/PortalLogin"));
const PortalDashboard = lazy(() => import("@/pages/portal/PortalDashboard"));
const PortalUsage = lazy(() => import("@/pages/portal/PortalUsage"));
const PortalBilling = lazy(() => import("@/pages/portal/PortalBilling"));
const PortalUpdates = lazy(() => import("@/pages/portal/PortalUpdates"));
const PortalSupport = lazy(() => import("@/pages/portal/PortalSupport"));
const PortalProjects = lazy(() => import("@/pages/portal/PortalProjects"));
const PortalSocialMedia = lazy(() => import("@/pages/portal/PortalSocialMedia"));

/** Minimal full-page loading skeleton for route transitions */
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-4 w-full max-w-md px-4">
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/ai-employees" component={AIEmployees} />
        <Route path="/services/document-processing" component={DocumentProcessing} />
        <Route path="/services/custom-agent-automation" component={CustomAgentAutomation} />
        <Route path="/services/marketing-automation" component={MarketingAutomation} />
        <Route path="/services/data-analysis" component={DataAnalysis} />
        <Route path="/services/custom-solutions" component={CustomSolutions} />
        <Route path="/services/onboarding-service" component={OnboardingService} />
        <Route path="/automation-discovery" component={AutomationDiscovery} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/social-media-privacy" component={SocialMediaPrivacy} />
        <Route path="/social-media-terms" component={SocialMediaTerms} />
        <Route path="/terms" component={Terms} />
        <Route path="/cookies" component={Cookies} />
        <Route path="/careers" component={Careers} />
        <Route path="/blog" component={Blog} />
        <Route path="/support" component={Support} />
        <Route path="/smpd" component={PitchDeck} />
        <Route path="/admin/login" component={Login} />
        <Route path="/admin/clients/:clientId/projects/:projectId/dashboard">
          <ProtectedRoute>
            <ProjectDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/clients/:id">
          <ProtectedRoute>
            <ClientDetail />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/consultations">
          <ProtectedRoute>
            <ConsultationsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/chat">
          <ProtectedRoute>
            <ChatManagementPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/support-tickets">
          <ProtectedRoute>
            <SupportTicketsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/chatbot-settings">
          <ProtectedRoute>
            <ChatbotSettingsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/automation-discovery">
          <ProtectedRoute>
            <AutomationDiscoveryAdmin />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/social-media">
          <ProtectedRoute>
            <SocialMediaPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/clients">
          <ProtectedRoute>
            <ClientsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/admin">
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        </Route>
        
        {/* Dynamic Client Portal Routes — matches any /:clientSlug not caught above */}
        <Route path="/:clientSlug/social-media" component={({ params }: any) => <PortalSocialMedia clientSlug={params.clientSlug} />} />
        <Route path="/:clientSlug/dashboard" component={({ params }: any) => <PortalDashboard clientSlug={params.clientSlug} />} />
        <Route path="/:clientSlug/usage" component={({ params }: any) => <PortalUsage clientSlug={params.clientSlug} />} />
        <Route path="/:clientSlug/billing" component={({ params }: any) => <PortalBilling clientSlug={params.clientSlug} />} />
        <Route path="/:clientSlug/updates" component={({ params }: any) => <PortalUpdates clientSlug={params.clientSlug} />} />
        <Route path="/:clientSlug/support" component={({ params }: any) => <PortalSupport clientSlug={params.clientSlug} />} />
        <Route path="/:clientSlug/projects" component={({ params }: any) => <PortalProjects clientSlug={params.clientSlug} />} />
        <Route path="/:clientSlug" component={({ params }: any) => <PortalLogin clientSlug={params.clientSlug} />} />

        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function FloatingChatWidget() {
  const [location] = useLocation();
  const isAdminPage = location.startsWith('/admin');
  // Detect portal pages: any path with 2+ segments that isn't /services/* /admin/* etc.
  const isPortalPage = /^\/[^/]+\/(dashboard|usage|billing|updates|support|projects|social-media)/.test(location)
    || /^\/[^/]+$/.test(location) && !['/', '/privacy', '/terms', '/cookies', '/careers', '/blog', '/support', '/smpd', '/automation-discovery', '/social-media-privacy', '/social-media-terms'].includes(location) && !location.startsWith('/services') && !location.startsWith('/admin');
  const isPitchDeck = location.startsWith('/smpd');
  
  if (isAdminPage || isPortalPage || isPitchDeck) {
    return null;
  }
  
  return <ChatWidget />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <AnalyticsProvider>
              <Toaster />
              <a className="skip-link" href="#main-content">
                Skip to main content
              </a>
              <main id="main-content" tabIndex={-1}>
                <Router />
              </main>
              <FloatingChatWidget />
              <AnalyticsDebug />
            </AnalyticsProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
