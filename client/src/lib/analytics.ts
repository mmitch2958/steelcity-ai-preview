// Google Analytics 4 integration for Steel City AI

export interface GAEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

export interface GAPageView {
  page_title: string;
  page_location: string;
  page_path: string;
}

export interface GAUserProperty {
  [key: string]: string | number | boolean;
}

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'set' | 'get' | 'js',
      targetId: string | GAEvent['action'] | Date,
      config?: any
    ) => void;
    dataLayer: any[];
  }
}

class GoogleAnalytics {
  private measurementId: string | null = null;
  private isInitialized = false;
  private debug = false;

  constructor() {
    // Check for GA4 measurement ID in environment variables
    this.measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || null;
    this.debug = import.meta.env.DEV || false;
    
    if (this.debug) {
      console.log('[Analytics] Debug mode enabled');
      console.log('[Analytics] Measurement ID:', this.measurementId ? '***' + this.measurementId.slice(-4) : 'Not set');
    }
  }

  // Initialize Google Analytics 4
  async initialize(): Promise<void> {
    if (!this.measurementId) {
      if (this.debug) {
        console.warn('[Analytics] GA4 Measurement ID not provided. Set VITE_GA_MEASUREMENT_ID environment variable.');
      }
      // Still mark as initialized for debug mode
      this.isInitialized = true;
      return;
    }

    if (this.isInitialized) {
      if (this.debug) {
        console.log('[Analytics] Already initialized');
      }
      return;
    }

    try {
      // Initialize dataLayer
      window.dataLayer = window.dataLayer || [];
      
      // Define gtag function
      window.gtag = function() {
        window.dataLayer.push(arguments);
      };

      // Set timestamp
      window.gtag('js', new Date());

      // Load Google Analytics script
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
      document.head.appendChild(script);

      // Configure GA4
      window.gtag('config', this.measurementId, {
        // Enhanced measurement for automatic tracking
        enhanced_measurements: {
          scrolls: true,
          outbound_clicks: true,
          site_search: true,
          video_engagement: true,
          file_downloads: true
        },
        // Custom dimensions for business tracking
        custom_map: {
          custom_dimension_1: 'service_interest',
          custom_dimension_2: 'contact_method',
          custom_dimension_3: 'business_size',
          custom_dimension_4: 'industry_type'
        },
        // Cookie settings
        cookie_flags: 'SameSite=None;Secure',
        anonymize_ip: true,
        allow_google_signals: true,
        allow_ad_personalization_signals: false
      });

      this.isInitialized = true;
      
      if (this.debug) {
        console.log('[Analytics] Successfully initialized GA4');
      }

      // Set user properties for business context
      this.setUserProperty('site_type', 'ai_automation_services');
      this.setUserProperty('business_focus', 'workflow_automation');

    } catch (error) {
      console.error('[Analytics] Failed to initialize GA4:', error);
    }
  }

  // Track page views
  trackPageView(pageData: Partial<GAPageView> = {}): void {
    const pageInfo: GAPageView = {
      page_title: pageData.page_title || document.title,
      page_location: pageData.page_location || window.location.href,
      page_path: pageData.page_path || window.location.pathname
    };

    if (!this.isInitialized || !window.gtag) {
      if (this.debug) {
        console.log('[Analytics] DEBUG - Page view (not sent to GA4):', pageInfo);
      }
      return;
    }

    window.gtag('event', 'page_view', pageInfo);

    if (this.debug) {
      console.log('[Analytics] Page view tracked:', pageInfo);
    }
  }

  // Track custom events
  trackEvent(event: GAEvent): void {
    const eventData: any = {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
      ...event.custom_parameters
    };

    // Remove undefined values
    Object.keys(eventData).forEach(key => {
      if (eventData[key] === undefined) {
        delete eventData[key];
      }
    });

    if (!this.isInitialized || !window.gtag) {
      if (this.debug) {
        console.log('[Analytics] DEBUG - Event (not sent to GA4):', event.action, eventData);
      }
      return;
    }

    window.gtag('event', event.action, eventData);

    if (this.debug) {
      console.log('[Analytics] Event tracked:', event.action, eventData);
    }
  }

  // Set user properties
  setUserProperty(property: string, value: string | number | boolean): void {
    if (!this.isInitialized || !window.gtag) {
      return;
    }

    window.gtag('set', 'user_properties', {
      [property]: value
    });

    if (this.debug) {
      console.log('[Analytics] User property set:', property, value);
    }
  }

  // Business-specific tracking methods
  trackServiceInterest(serviceName: string, action: 'view' | 'click' | 'inquiry'): void {
    this.trackEvent({
      action: 'service_interaction',
      category: 'services',
      label: serviceName,
      custom_parameters: {
        service_name: serviceName,
        interaction_type: action,
        timestamp: new Date().toISOString()
      }
    });
  }

  trackContactFormSubmission(formData: {
    service?: string;
    company?: string;
    source?: string;
  }): void {
    this.trackEvent({
      action: 'contact_form_submit',
      category: 'lead_generation',
      label: formData.service || 'general_inquiry',
      value: 1,
      custom_parameters: {
        form_type: 'contact',
        service_interest: formData.service,
        has_company: !!formData.company,
        source: formData.source || 'website',
        timestamp: new Date().toISOString()
      }
    });
  }

  trackCaseStudyEngagement(caseStudyTitle: string, action: 'view' | 'click'): void {
    this.trackEvent({
      action: 'case_study_engagement',
      category: 'content',
      label: caseStudyTitle,
      custom_parameters: {
        content_type: 'case_study',
        engagement_type: action,
        timestamp: new Date().toISOString()
      }
    });
  }

  trackDownload(fileName: string, fileType: string): void {
    this.trackEvent({
      action: 'file_download',
      category: 'downloads',
      label: fileName,
      custom_parameters: {
        file_name: fileName,
        file_type: fileType,
        timestamp: new Date().toISOString()
      }
    });
  }

  trackAdminAction(action: string, resource: string): void {
    this.trackEvent({
      action: 'admin_action',
      category: 'administration',
      label: `${action}_${resource}`,
      custom_parameters: {
        admin_action: action,
        resource_type: resource,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Conversion tracking for business goals
  trackConversion(conversionName: string, value?: number): void {
    this.trackEvent({
      action: 'conversion',
      category: 'conversions',
      label: conversionName,
      value: value,
      custom_parameters: {
        conversion_type: conversionName,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Track business goals
  trackBusinessGoal(goal: 'lead_generated' | 'service_inquiry' | 'consultation_request' | 'demo_request', details?: Record<string, any>): void {
    this.trackEvent({
      action: goal,
      category: 'business_goals',
      label: goal,
      value: 1,
      custom_parameters: {
        goal_type: goal,
        ...details,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Get analytics instance info
  getInfo(): { initialized: boolean; measurementId: string | null; debug: boolean } {
    return {
      initialized: this.isInitialized,
      measurementId: this.measurementId,
      debug: this.debug
    };
  }
}

// Create and export singleton instance
export const analytics = new GoogleAnalytics();

// Convenience functions for common tracking
export const trackPageView = (pageData?: Partial<GAPageView>) => analytics.trackPageView(pageData);
export const trackEvent = (event: GAEvent) => analytics.trackEvent(event);
export const trackServiceInterest = (serviceName: string, action: 'view' | 'click' | 'inquiry') => 
  analytics.trackServiceInterest(serviceName, action);
export const trackContactFormSubmission = (formData: Parameters<typeof analytics.trackContactFormSubmission>[0]) => 
  analytics.trackContactFormSubmission(formData);
export const trackCaseStudyEngagement = (title: string, action: 'view' | 'click') => 
  analytics.trackCaseStudyEngagement(title, action);
export const trackConversion = (name: string, value?: number) => analytics.trackConversion(name, value);
export const trackBusinessGoal = (goal: Parameters<typeof analytics.trackBusinessGoal>[0], details?: Parameters<typeof analytics.trackBusinessGoal>[1]) => 
  analytics.trackBusinessGoal(goal, details);

// Initialize analytics when module loads
if (typeof window !== 'undefined') {
  analytics.initialize();
}