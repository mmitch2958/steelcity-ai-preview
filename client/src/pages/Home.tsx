import { useEffect } from 'react'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import AIAgentAssistants from '@/components/AIAgentAssistants'
import FeaturedRoles from '@/components/FeaturedRoles'
import Services from '@/components/Services'
import About from '@/components/About'
import CaseStudies from '@/components/CaseStudies'
import DiscoveryCTA from '@/components/DiscoveryCTA'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'
import { SEO, seoConfigs } from "@/components/SEO"
import { StructuredData, structuredDataConfigs } from "@/components/StructuredData"
import { generateBreadcrumbSchema, commonFAQs } from "@/utils/seo"

export default function Home() {
  useEffect(() => {
    const scrollTarget = sessionStorage.getItem('scrollToSection')
    if (scrollTarget) {
      sessionStorage.removeItem('scrollToSection')
      setTimeout(() => {
        document.getElementById(scrollTarget)?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO {...seoConfigs.home} />
      <StructuredData type="Organization" data={structuredDataConfigs.organization} />
      <StructuredData type="LocalBusiness" data={structuredDataConfigs.localBusiness} />
      <StructuredData type="FAQPage" data={structuredDataConfigs.faqPage(commonFAQs)} />
      <StructuredData 
        type="BreadcrumbList" 
        data={generateBreadcrumbSchema([
          { name: "Home", url: "/" }
        ])} 
      />
      <Header />
      <Hero />
      <AIAgentAssistants />
      <FeaturedRoles />
      <Services />
      <About />
      <CaseStudies />
      <DiscoveryCTA />
      <Contact />
      <Footer />
    </div>
  )
}