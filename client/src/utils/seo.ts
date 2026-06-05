// SEO utility functions and constants

export const siteConfig = {
  name: "Steel City AI",
  description: "Transform your business with AI-powered workflow automation. Specializing in document processing, customer service automation, marketing optimization, and custom AI solutions.",
  url: "https://steelcityai.com",
  ogImage: "/images/steel-city-ai-social.jpg",
  keywords: [
    "AI automation",
    "workflow automation", 
    "document processing",
    "customer service AI",
    "marketing automation",
    "data analysis",
    "business automation",
    "Steel City AI",
    "artificial intelligence",
    "process automation",
    "business intelligence",
    "machine learning solutions"
  ]
};

export function generatePageTitle(pageTitle?: string): string {
  if (!pageTitle) return siteConfig.name;
  return `${pageTitle} | ${siteConfig.name}`;
}

export function generateMetaDescription(description?: string): string {
  return description || siteConfig.description;
}

export function generateKeywords(additionalKeywords: string[] = []): string {
  return [...siteConfig.keywords, ...additionalKeywords].join(", ");
}

export function generateCanonicalUrl(path: string): string {
  return `${siteConfig.url}${path.startsWith('/') ? path : `/${path}`}`;
}

// Schema.org structured data generators
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    alternateName: "Steel City Artificial Intelligence",
    description: siteConfig.description,
    url: siteConfig.url,
    logo: `${siteConfig.url}/images/logo.png`,
    foundingDate: "2024",
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
      availableLanguage: ["English"],
      email: "info@steelcityai.com"
    },
    sameAs: [
      "https://linkedin.com/company/steelcityai",
      "https://twitter.com/steelcityai"
    ],
    serviceArea: {
      "@type": "Country", 
      name: "United States"
    }
  };
}

export function generateServiceSchema(service: {
  name: string;
  description: string;
  price?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.description,
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url
    },
    areaServed: "United States",
    serviceType: "AI Automation Service",
    ...(service.price && {
      offers: {
        "@type": "Offer",
        price: service.price,
        priceCurrency: "USD"
      }
    })
  };
}

export function generateBreadcrumbSchema(breadcrumbs: Array<{name: string; url: string}>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url.startsWith('http') ? crumb.url : `${siteConfig.url}${crumb.url}`
    }))
  };
}

export function generateArticleSchema(article: {
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  image?: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    author: {
      "@type": "Organization",
      name: article.author || siteConfig.name
    },
    publisher: {
      "@type": "Organization", 
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/images/logo.png`
      }
    },
    image: article.image ? `${siteConfig.url}${article.image}` : siteConfig.ogImage,
    url: article.url.startsWith('http') ? article.url : `${siteConfig.url}${article.url}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": article.url.startsWith('http') ? article.url : `${siteConfig.url}${article.url}`
    }
  };
}

// Sitemap data structure
export const sitemapPages = [
  {
    url: '/',
    changefreq: 'monthly',
    priority: 1.0,
    lastmod: new Date().toISOString()
  },
  {
    url: '/services',
    changefreq: 'monthly', 
    priority: 0.9,
    lastmod: new Date().toISOString()
  },
  {
    url: '/contact',
    changefreq: 'monthly',
    priority: 0.8,
    lastmod: new Date().toISOString()
  },
  {
    url: '/case-studies',
    changefreq: 'weekly',
    priority: 0.8,
    lastmod: new Date().toISOString()
  }
];

// Robots.txt content
export const robotsTxtContent = `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${siteConfig.url}/sitemap.xml

# Crawl-delay
Crawl-delay: 1

# Disallow admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /private/

# Allow important pages
Allow: /
Allow: /services
Allow: /contact
Allow: /case-studies
`;

// Common FAQ data for FAQ schema
export const commonFAQs = [
  {
    question: "What AI automation services does Steel City AI provide?",
    answer: "We specialize in document processing automation, customer service AI chatbots, marketing automation, data analysis, and custom AI solutions tailored to your business needs."
  },
  {
    question: "How long does it take to implement AI automation solutions?",
    answer: "Implementation timelines vary based on complexity, but most projects are completed within 2-8 weeks. We provide detailed project timelines during our initial consultation."
  },
  {
    question: "What types of businesses can benefit from AI automation?",
    answer: "Businesses of all sizes across industries including healthcare, finance, retail, manufacturing, and professional services can benefit from our AI automation solutions."
  },
  {
    question: "Do you provide ongoing support after implementation?",
    answer: "Yes, we offer comprehensive ongoing support, maintenance, and optimization services to ensure your AI solutions continue to deliver maximum value."
  },
  {
    question: "How do you ensure data security and privacy?",
    answer: "We implement enterprise-grade security measures, follow strict data privacy protocols, and ensure all solutions comply with relevant regulations like GDPR and CCPA."
  }
];