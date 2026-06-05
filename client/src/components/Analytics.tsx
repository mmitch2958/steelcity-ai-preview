import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { analytics, trackPageView } from '@/lib/analytics';

// Analytics Provider Component
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize analytics on mount
  useEffect(() => {
    analytics.initialize().then(() => {
      setIsInitialized(true);
    });
  }, []);

  // Track page views on route changes (only after initialization)
  useEffect(() => {
    if (isInitialized) {
      trackPageView({
        page_path: location,
        page_location: window.location.href,
        page_title: document.title
      });
    }
  }, [location, isInitialized]);

  return <>{children}</>;
}

// Analytics Debug Component (for development)
export function AnalyticsDebug() {
  const info = analytics.getInfo();
  
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div className="text-green-400 font-semibold mb-1">Analytics Debug</div>
      <div>Status: {info.initialized ? '✅ Active' : '❌ Disabled'}</div>
      <div>GA4 ID: {info.measurementId ? `***${info.measurementId.slice(-4)}` : 'Not set'}</div>
      <div>Debug: {info.debug ? 'ON' : 'OFF'}</div>
    </div>
  );
}

// Hook for analytics in components
export function useAnalytics() {
  return {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackServiceInterest: analytics.trackServiceInterest.bind(analytics),
    trackContactFormSubmission: analytics.trackContactFormSubmission.bind(analytics),
    trackCaseStudyEngagement: analytics.trackCaseStudyEngagement.bind(analytics),
    trackConversion: analytics.trackConversion.bind(analytics),
    trackBusinessGoal: analytics.trackBusinessGoal.bind(analytics),
    setUserProperty: analytics.setUserProperty.bind(analytics),
    getInfo: analytics.getInfo.bind(analytics)
  };
}

// Higher-order component for automatic event tracking
export function withAnalytics<T extends object>(
  Component: React.ComponentType<T>,
  eventConfig: {
    category: string;
    action: string;
    label?: string;
    trackOnMount?: boolean;
    trackOnClick?: boolean;
  }
) {
  return function AnalyticsWrappedComponent(props: T) {
    const { trackEvent } = useAnalytics();

    useEffect(() => {
      if (eventConfig.trackOnMount) {
        trackEvent({
          action: eventConfig.action,
          category: eventConfig.category,
          label: eventConfig.label
        });
      }
    }, [trackEvent]);

    const handleClick = eventConfig.trackOnClick ? () => {
      trackEvent({
        action: eventConfig.action,
        category: eventConfig.category,
        label: eventConfig.label
      });
    } : undefined;

    return <Component {...props} onClick={handleClick} />;
  };
}