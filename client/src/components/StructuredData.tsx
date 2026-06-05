import { useEffect } from 'react';

interface StructuredDataProps {
  type: 'Organization' | 'LocalBusiness' | 'Service' | 'Article' | 'FAQPage' | 'BreadcrumbList';
  data: any;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": type,
      ...data
    });
    
    // Add unique ID to prevent duplicates
    const id = `structured-data-${type.toLowerCase()}-${Date.now()}`;
    script.id = id;
    
    document.head.appendChild(script);
    
    return () => {
      const existingScript = document.getElementById(id);
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [type, data]);

  return null;
}

// Predefined structured data for Steel City AI
export const structuredDataConfigs = {
  organization: {
    name: "Steel City AI",
    alternateName: "Steel City Artificial Intelligence",
    description: "Leading AI integration service provider specializing in workflow automation, document processing, customer service automation, and business intelligence solutions.",
    url: "https://steelcityai.com",
    logo: "https://steelcityai.com/images/logo.png",
    foundingDate: "2024",
    founders: [
      {
        "@type": "Person",
        name: "Steel City AI Team"
      }
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Pittsburgh",
      addressRegion: "PA",
      addressCountry: "US"
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+1-412-555-0100",
      contactType: "customer service",
      availableLanguage: ["English"]
    },
    sameAs: [
      "https://linkedin.com/company/steelcityai",
      "https://twitter.com/steelcityai"
    ],
    serviceArea: {
      "@type": "Country",
      name: "United States"
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "AI Automation Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Document Processing Automation",
            description: "AI-powered document processing and data extraction services"
          }
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Customer Service Automation",
            description: "Intelligent chatbots and automated customer support solutions"
          }
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Marketing Automation",
            description: "AI-driven marketing optimization and campaign automation"
          }
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Data Analysis & Insights",
            description: "Advanced analytics and business intelligence solutions"
          }
        }
      ]
    }
  },

  localBusiness: {
    "@type": "LocalBusiness",
    name: "Steel City AI",
    image: "https://steelcityai.com/images/office.jpg",
    telephone: "+1-412-555-0100",
    email: "info@steelcityai.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "123 Innovation Drive",
      addressLocality: "Pittsburgh",
      addressRegion: "PA",
      postalCode: "15213",
      addressCountry: "US"
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 40.4406,
      longitude: -79.9959
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "17:00"
      }
    ],
    priceRange: "$$",
    paymentAccepted: ["Cash", "Credit Card", "Invoice"],
    currenciesAccepted: "USD"
  },

  breadcrumbs: (items: Array<{ name: string; url: string }>) => ({
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }),

  faqPage: (faqs: Array<{ question: string; answer: string }>) => ({
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  }),

  service: (serviceData: {
    name: string;
    description: string;
    provider: string;
    areaServed: string;
    hasOfferCatalog?: any;
  }) => ({
    name: serviceData.name,
    description: serviceData.description,
    provider: {
      "@type": "Organization",
      name: serviceData.provider
    },
    areaServed: serviceData.areaServed,
    serviceType: "AI Automation Service",
    ...serviceData.hasOfferCatalog && { hasOfferCatalog: serviceData.hasOfferCatalog }
  })
};