
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Bot, Zap, Brain, Target, LineChart, ShieldCheck, Send } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Contact from '@/components/Contact'
import { SEO } from '@/components/SEO'

// Enhanced Interactive Demo
function OnboardingWizardDemo() {
  const [role, setRole] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai', text: string }[]>([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleRoleSelect = (selectedRole: string) => {
    setRole(selectedRole);
    setMessages([
      { sender: 'ai', text: `Hi! I'm your ${selectedRole} Onboarding Agent. I've analyzed your role requirements and current company protocols. What would you like to learn first?` }
    ]);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userText = input;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInput('');
    
    // Simulated AI Response logic
    setTimeout(() => {
      let response = "That's a great question. Based on our internal training documentation, for the " + role + " role, we prioritize the safety compliance modules first. I can pull up the 'Hazardous Materials Handling' protocol for you—would you like to see that?";
      if (userText.toLowerCase().includes('safety')) {
          response = "Safety is our priority. As a " + role + ", you must follow SOP-402: 'PPE Standardization.' This involves a mandatory 3-point check before entering the production floor. Shall I walk you through the checklist?";
      }
      setMessages(prev => [...prev, { sender: 'ai', text: response }]);
    }, 800);
  };

  return (
    <div className="bg-[#111418] border border-[#252b33] rounded-3xl p-9 max-w-4xl mx-auto shadow-2xl">
      {!role ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <h3 className="text-3xl font-bold tracking-tight">AI Onboarding Simulation</h3>
          <p className="text-gray-400">Choose a role to initialize your personalized AI onboarding agent.</p>
          <div className="grid grid-cols-2 gap-4">
            {['Production Tech', 'QA Specialist', 'Systems Engineer', 'Site Safety'].map(r => (
              <Button key={r} variant="outline" onClick={() => handleRoleSelect(r)} className="justify-start h-auto py-4">
                {r}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-[500px] flex flex-col animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#252b33]">
             <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400"><Bot /></div>
             <div>
                <h4 className="font-bold">{role} Agent</h4>
                <p className="text-xs text-emerald-400">Trained on company data</p>
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-xl ${m.sender === 'user' ? 'bg-[#c5a26f] text-black' : 'bg-[#1a1f25] text-gray-200'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          
          <div className="flex gap-2">
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-[#0a0c0f] border border-[#252b33] rounded-xl px-4 py-3 outline-none" 
              placeholder="Ask about protocols or training..."
            />
            <Button onClick={handleSend}><Send className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OnboardingService() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="AI Training Agents | Steel City AI" description="Customized AI onboarding agents for your enterprise." />
      <Header />

      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="mb-4 bg-violet-400/20 text-violet-200 border-violet-400/30">Service Offering</Badge>
            <h1 className="text-5xl font-bold mb-6 tracking-tight">Custom AI Training Agents</h1>
            <p className="text-xl opacity-90 mb-10 leading-relaxed">
              Automate your onboarding process with agents trained specifically on <strong>your company data</strong>. Stop repeating instructions and start building high-performance teams at scale.
            </p>
            <Button size="lg" variant="secondary" asChild><a href="#demo">Try the Interactive Agent →</a></Button>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-violet-400/20 flex items-center justify-center">
                <Bot className="h-6 w-6 text-violet-200" />
              </div>
              <div>
                <p className="font-semibold leading-tight">Your AI Onboarding Agent</p>
                <p className="text-sm opacity-70">Active 24/7</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Brain, label: 'Adaptive Curriculum' },
                { icon: Target, label: 'Role-Specific Paths' },
                { icon: Zap, label: 'Instant Answers' },
                { icon: LineChart, label: 'Progress Tracking' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <Icon className="h-5 w-5 text-violet-200 mb-2" />
                  <p className="text-sm opacity-90">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Why Enterprise Teams Choose Our Agents</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-xl border bg-card">
              <Bot className="w-10 h-10 text-violet-500 mb-4" />
              <h3 className="text-xl font-bold mb-3">Knowledge-First Integration</h3>
              <p className="text-muted-foreground">Trained on your actual SOPs, handbooks, and documents. The agent provides answers based on <em>your</em> company data, not generic internet knowledge.</p>
            </div>
            <div className="p-8 rounded-xl border bg-card">
              <Target className="w-10 h-10 text-violet-500 mb-4" />
              <h3 className="text-xl font-bold mb-3">Adaptive Learning Paths</h3>
              <p className="text-muted-foreground">Our AI detects skill gaps in real-time, intelligently speeding through what the employee already knows and slowing down for complex protocols.</p>
            </div>
            <div className="p-8 rounded-xl border bg-card">
              <ShieldCheck className="w-10 h-10 text-violet-500 mb-4" />
              <h3 className="text-xl font-bold mb-3">24/7 Mentor Availability</h3>
              <p className="text-muted-foreground">Employees can ask questions any time of day. No more waiting for supervisors to free up time to answer basic process questions.</p>
            </div>
            <div className="p-8 rounded-xl border bg-card">
              <LineChart className="w-10 h-10 text-violet-500 mb-4" />
              <h3 className="text-xl font-bold mb-3">Real-Time Manager Analytics</h3>
              <p className="text-muted-foreground">Managers get a clear dashboard on every new hire's progress, showing exactly which processes they've mastered and where they need extra support.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="demo" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Live Agent Preview</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">This simulator demonstrates how our AI interacts with a new hire to explain company-specific protocols.</p>
          <OnboardingWizardDemo />
        </div>
      </section>

      <Contact />
      <Footer />
    </div>
  )
}
