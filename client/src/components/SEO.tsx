import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'service' | 'organization';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

export function SEO({
  title = "AI Integration Solutions - Automate Your Workflow | Steel City AI",
  description = "Transform your business with AI-powered workflow automation. Specializing in document processing, customer service automation, marketing optimization, and custom AI solutions.",
  keywords = "AI automation, workflow automation, document processing, customer service AI, marketing automation, data analysis, business automation, Steel City AI",
  image = "/images/steel-city-ai-social.svg",
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  publishedTime,
  modifiedTime,
  author = "Steel City AI",
  canonical,
  noindex = false,
  nofollow = false
}: SEOProps) {
  
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Helper function to update or create meta tags
    const updateMetaTag = (selector: string, content: string, attribute: string = 'content') => {
      let element = document.querySelector(selector) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        if (selector.includes('property=')) {
          element.setAttribute('property', selector.match(/property="([^"]+)"/)?.[1] || '');
        } else if (selector.includes('name=')) {
          element.setAttribute('name', selector.match(/name="([^"]+)"/)?.[1] || '');
        }
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, content);
    };

    // Basic meta tags
    updateMetaTag('meta[name="description"]', description);
    updateMetaTag('meta[name="keywords"]', keywords);
    updateMetaTag('meta[name="author"]', author);
    
    // Robots meta tags
    const robotsContent = `${noindex ? 'noindex' : 'index'}, ${nofollow ? 'nofollow' : 'follow'}`;
    updateMetaTag('meta[name="robots"]', robotsContent);
    
    // Open Graph tags
    updateMetaTag('meta[property="og:title"]', title);
    updateMetaTag('meta[property="og:description"]', description);
    updateMetaTag('meta[property="og:type"]', type);
    updateMetaTag('meta[property="og:url"]', url);
    updateMetaTag('meta[property="og:site_name"]', "Steel City AI");
    updateMetaTag('meta[property="og:locale"]', "en_US");
    if (image) {
      updateMetaTag('meta[property="og:image"]', image);
      updateMetaTag('meta[property="og:image:alt"]', title);
      updateMetaTag('meta[property="og:image:width"]', "1200");
      updateMetaTag('meta[property="og:image:height"]', "630");
    }
    
    // Article-specific Open Graph tags
    if (type === 'article' && publishedTime) {
      updateMetaTag('meta[property="article:published_time"]', publishedTime);
    }
    if (type === 'article' && modifiedTime) {
      updateMetaTag('meta[property="article:modified_time"]', modifiedTime);
    }
    if (type === 'article' && author) {
      updateMetaTag('meta[property="article:author"]', author);
    }
    
    // Twitter Card tags
    updateMetaTag('meta[name="twitter:card"]', "summary_large_image");
    updateMetaTag('meta[name="twitter:title"]', title);
    updateMetaTag('meta[name="twitter:description"]', description);
    if (image) {
      updateMetaTag('meta[name="twitter:image"]', image);
      updateMetaTag('meta[name="twitter:image:alt"]', title);
    }
    updateMetaTag('meta[name="twitter:site"]', "@SteelCityAI");
    updateMetaTag('meta[name="twitter:creator"]', "@SteelCityAI");
    
    // Canonical URL
    const canonicalUrl = canonical || url;
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;
    
    // Additional meta tags for SEO
    updateMetaTag('meta[name="theme-color"]', "#0F172A");
    updateMetaTag('meta[name="apple-mobile-web-app-title"]', "Steel City AI");
    updateMetaTag('meta[name="application-name"]', "Steel City AI");
    updateMetaTag('meta[name="msapplication-TileColor"]', "#0F172A");
    
  }, [title, description, keywords, image, url, type, publishedTime, modifiedTime, author, canonical, noindex, nofollow]);

  return null; // This component only manages head tags
}

// Predefined SEO configurations for common pages
export const seoConfigs = {
  home: {
    title: "AI Integration Solutions - Automate Your Workflow | Steel City AI",
    description: "Transform your business with AI-powered workflow automation. Specializing in document processing, customer service automation, marketing optimization, and custom AI solutions.",
    keywords: "AI automation, workflow automation, document processing, customer service AI, marketing automation, data analysis, business automation, Steel City AI",
    type: 'website' as const
  },
  
  services: {
    title: "AI Services - Document Processing, Automation & Analytics | Steel City AI",
    description: "Comprehensive AI services including document processing automation, customer service AI, marketing optimization, data analysis, and custom AI solutions for businesses.",
    keywords: "AI services, document processing, customer service automation, marketing AI, data analysis, business intelligence, workflow automation",
    type: 'website' as const
  },

  documentProcessing: {
    title: "Document Processing Automation | Steel City AI",
    description: "Stop keying data manually. We build AI agents that read your documents and post data directly into your systems. Invoices, forms, contracts - handled in 3-4 weeks.",
    keywords: "document processing automation, invoice AI, PDF extraction, optical character recognition, data entry automation, Pittsburgh AI",
    type: 'service' as const
  },

  customAgentAutomation: {
    title: "Custom AI Agent Automation | Steel City AI",
    description: "Autonomous AI agents that handle administrative tasks with human-like intelligence. Scale your workforce instantly without hiring or overhead costs.",
    keywords: "AI agents, virtual assistants, task automation, business automation agents, autonomous AI, workplace automation",
    type: 'service' as const
  },

  marketingAutomation: {
    title: "AI Marketing Automation Solutions | Steel City AI",
    description: "Optimize your marketing ROI with AI-driven content generation, lead scoring, and campaign automation. Personalized marketing at scale.",
    keywords: "marketing automation, AI marketing, content generation AI, lead scoring, marketing optimization, Pittsburgh marketing AI",
    type: 'service' as const
  },

  dataAnalysis: {
    title: "AI Data Analysis & Business Intelligence | Steel City AI",
    description: "Transform raw data into actionable insights. Our AI agents monitor KPIs, detect anomalies, and generate weekly reports automatically.",
    keywords: "AI data analysis, business intelligence, anomaly detection, automated reporting, KPI monitoring, data science AI",
    type: 'service' as const
  },

  customSolutions: {
    title: "Custom AI Solutions for Business | Steel City AI",
    description: "Tailor-made AI integration for your unique business processes. No disruption, just results. We build the AI that fits how you already work.",
    keywords: "custom AI solutions, AI integration, business process automation, tailored AI, enterprise AI solutions",
    type: 'service' as const
  },

  aiEmployees: {
    title: "Hire AI Employees - Ready-to-Deploy AI Roles | Steel City AI",
    description: "Nine specialized AI roles ready to work 24/7. From Research Agents to SDRs, find the AI employee that fits your business needs.",
    keywords: "AI employees, digital workforce, AI SDR, AI research agent, AI support agent, hire AI",
    type: 'website' as const
  },
  
  contact: {
    title: "Contact Us - AI Integration Consultation | Steel City AI",
    description: "Get in touch for a free consultation on AI workflow automation. Our experts help businesses integrate AI solutions for document processing, customer service, and more.",
    keywords: "contact AI experts, AI consultation, workflow automation consultation, business AI integration, Steel City AI contact",
    type: 'website' as const
  },
  
  caseStudies: {
    title: "Case Studies - Real AI Implementation Success Stories | Steel City AI",
    description: "Discover how businesses transformed their operations with our AI solutions. Real case studies showcasing ROI, efficiency gains, and successful AI implementations.",
    keywords: "AI case studies, automation success stories, AI implementation examples, business transformation, workflow automation results",
    type: 'website' as const
  },
  
  about: {
    title: "About Steel City AI - Leading AI Automation Experts",
    description: "Learn about Steel City AI's mission to help businesses automate workflows with AI. Our team of experts specializes in practical AI solutions that deliver real results.",
    keywords: "about Steel City AI, AI automation experts, workflow automation team, business AI specialists",
    type: 'organization' as const
  },

  blog: {
    title: "Blog - AI Automation Insights & Best Practices | Steel City AI",
    description: "Expert insights on AI automation, digital transformation, and the future of business technology. Tips, case studies, and industry trends from the Steel City AI team.",
    keywords: "AI automation blog, workflow automation tips, AI industry insights, business automation trends, machine learning news",
    canonical: "https://steelcityai.com/blog",
    type: 'website' as const
  },

  careers: {
    title: "Careers - Join the AI Automation Team | Steel City AI",
    description: "Join Steel City AI and help businesses transform with AI automation. Explore open positions in AI engineering, product, and client success.",
    keywords: "AI careers, automation jobs, machine learning engineer jobs, AI startup careers, Pittsburgh AI jobs",
    canonical: "https://steelcityai.com/careers",
    type: 'website' as const
  },

  support: {
    title: "Support - Get Help with AI Automation | Steel City AI",
    description: "Get help with your Steel City AI solutions. Browse documentation, submit support tickets, and connect with our expert team.",
    keywords: "AI support, automation help, Steel City AI support, workflow automation troubleshooting",
    canonical: "https://steelcityai.com/support",
    type: 'website' as const
  },

  automationDiscovery: {
    title: "Automation Discovery — Get Your Free AI Implementation Plan | Steel City AI",
    description: "Answer a few questions about your business and receive a personalized AI automation implementation outline. Free, instant, powered by Gemini AI.",
    keywords: "AI automation discovery, free AI consultation, automation implementation plan, business AI assessment, Steel City AI",
    canonical: "https://steelcityai.com/automation-discovery",
    type: 'website' as const
  },

  privacy: {
    title: "Privacy Policy | Steel City AI",
    description: "Steel City AI's privacy policy. Learn how we collect, use, and protect your data in compliance with GDPR, CCPA, and applicable regulations.",
    canonical: "https://steelcityai.com/privacy",
    noindex: true,
    type: 'website' as const
  },

  terms: {
    title: "Terms of Service | Steel City AI",
    description: "Steel City AI terms of service. Read our terms and conditions for using our AI automation services and platform.",
    canonical: "https://steelcityai.com/terms",
    noindex: true,
    type: 'website' as const
  }
};