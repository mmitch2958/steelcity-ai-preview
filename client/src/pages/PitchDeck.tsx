import logoImage from '@assets/SquareSteelCityLogo.svg'

export default function PitchDeck() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900" style={{ fontFamily: "'Inter', sans-serif" }}>
      <nav className="fixed w-full z-50 border-b border-slate-200" style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.5)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex-shrink-0 flex items-center">
              <a href="/">
                <img
                  src={logoImage}
                  alt="Steel City AI"
                  className="h-36 w-auto object-contain"
                />
              </a>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline gap-4 flex-wrap">
                <a href="#workflow" className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium">How it Works</a>
                <a href="#features" className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium">Features</a>
                <a href="/contact" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">Book Demo</a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl tracking-tight font-extrabold text-slate-900 sm:text-5xl md:text-6xl mb-6">
              Stop Posting.<br />
              <span style={{
                background: 'linear-gradient(90deg, #1e3a8a 0%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Start Automating.</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-slate-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Meet your new autonomous marketing team. From a single sentence to a fully researched, designed, and scheduled campaign in seconds.
            </p>
            <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
              <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
                <a href="#workflow" className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 sm:px-8">See the Workflow</a>
                <a href="#features" className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 sm:px-8">View Sample Posts</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white font-bold text-xl mb-6">1</div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4">The Briefing</h2>
              <p className="text-lg text-slate-600 mb-6">
                You don't need to be a prompt engineer. Just tell the system what you want to talk about in plain English.
              </p>
              <ul className="space-y-3 text-slate-500">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Simple text input
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Select target platforms instantly
                </li>
              </ul>
            </div>
            <div className="mt-10 lg:mt-0">
              <div className="rounded-xl border border-slate-200 overflow-hidden shadow-lg hover:-translate-y-1 transition-transform duration-300">
                <img src="/images/pitch/briefing.png" alt="AI Briefing Input" className="w-full h-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="rounded-xl border border-slate-200 overflow-hidden shadow-lg hover:-translate-y-1 transition-transform duration-300">
                <img src="/images/pitch/research.png" alt="AI Research Findings" className="w-full h-auto" />
              </div>
            </div>
            <div className="order-1 lg:order-2 mb-10 lg:mb-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white font-bold text-xl mb-6">2</div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Deep Market Research</h2>
              <p className="text-lg text-slate-600 mb-6">
                Most AI hallucinates. Ours investigates. The system scans real-time data to find trending topics, rising values, and local opportunities.
              </p>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <p className="font-semibold text-slate-800">"Rising Property Values"</p>
                <p className="text-sm text-slate-500">Identified as a key trend in area 16046.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white font-bold text-xl mb-6">3</div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Multimedia Design</h2>
              <p className="text-lg text-slate-600 mb-6">
                It doesn't just write text. The Design Agent proposes video scripts, infographics, and photo collages tailored to the research.
              </p>
            </div>
            <div className="mt-10 lg:mt-0">
              <div className="rounded-xl border border-slate-200 overflow-hidden shadow-lg hover:-translate-y-1 transition-transform duration-300">
                <img src="/images/pitch/design.png" alt="Design Suggestions" className="w-full h-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold mb-4">Autonomous Quality Control</h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              The system scores its own work. If it's not an 8/10, it rewrites the post automatically before you ever see it.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="rounded-xl border border-slate-700 overflow-hidden shadow-lg hover:-translate-y-1 transition-transform duration-300">
              <img src="/images/pitch/review.png" alt="Post Review Score" className="w-full h-auto" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-start">
            <div>
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white font-bold text-xl mb-6">4</div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Omni-Channel Launch</h2>
              <p className="text-lg text-slate-600 mb-6">
                One click deploys optimized content to Facebook, Instagram, LinkedIn, and YouTube.
              </p>
              <div className="rounded-xl border border-slate-200 overflow-hidden shadow-lg hover:-translate-y-1 transition-transform duration-300 mb-8">
                <img src="/images/pitch/platforms.png" alt="Platform Versions" className="w-full h-auto" />
              </div>
            </div>
            <div className="mt-10 lg:mt-0">
              <h3 className="text-xl font-bold text-slate-900 mb-4">The Final Result</h3>
              <div className="rounded-xl border border-slate-200 overflow-hidden shadow-lg hover:-translate-y-1 transition-transform duration-300">
                <img src="/images/pitch/final-post.png" alt="Final Post Preview" className="w-full h-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Smart Scheduling</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              AI analyzes optimal posting times for each platform and automatically schedules your content for maximum engagement.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-lg hover:-translate-y-1 transition-transform duration-300">
              <img src="/images/pitch/schedule.png" alt="AI Scheduling" className="w-full h-auto" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-blue-600">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to scale?</span>
            <span className="block">Start your autonomous team today.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-blue-100">
            Join the beta and experience the future of social media marketing.
          </p>
          <a href="/contact" className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 sm:w-auto">
            Sign up for free
          </a>
        </div>
      </section>

      <footer className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-base text-slate-400">
            &copy; 2026 Steel City AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
