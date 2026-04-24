import React, { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'motion/react'
import { Activity, ShieldCheck, Heart, Clock, ArrowRight, Zap, ChevronRight, Menu, Plus } from 'lucide-react'
import ArtisticBackground from '../components/ui/dynamic-background'
import { IMAGES, BRAND } from '../constants'
import { cn } from '../lib/utils'

const SectionLabel = ({ children, className }) => (
  <div className={cn("caps-technical text-sage mb-6 flex items-center gap-3", className)}>
    <span className="w-8 h-[1px] bg-sage/30" />
    {children}
  </div>
)

const FadeIn = ({ children, delay = 0, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, delay }}
    className={className}
  >
    {children}
  </motion.div>
)

export default function Landing() {
  const navigate = useNavigate()
  const targetRef = useRef(null)
  
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"]
  })

  const facilities = [
    { title: "Diagnostic Lounge", type: "PRE-CLINICAL", img: IMAGES.clinic_interior, description: "A high-end space designed for peace of mind while we analyze your data." },
    { title: "Surgical Pavilion", type: "ADVANCED CARE", img: IMAGES.specialist_team, description: "Precision technology meets expert hands for restorative procedures." },
    { title: "Wellness Sanctuary", type: "RECOVERY", img: IMAGES.wellness_space, description: "Post-consultation recovery in an environment tuned for human biology." },
    { title: "Advanced Lab", type: "PRECISION", img: IMAGES.lab_precision, description: "Rapid molecular analysis to provide surgical certainty in diagnosis." }
  ]

  const services = [
    { title: "AI Triage", icon: <Activity />, desc: "Structured clinical follow-ups and urgency classification." },
    { title: "Secure Data", icon: <ShieldCheck />, desc: "Encrypted, HIPAA-compliant patient information handling." },
    { title: "Human Access", icon: <Heart />, desc: "Direct bridge to registered medical practitioners." },
    { title: "24/7 Response", icon: <Clock />, desc: "Always-on clinical logic for peace of mind." }
  ]

  return (
    <div className="bg-paper overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full h-[72px] glass z-[100] px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-full bg-obsidian flex items-center justify-center text-paper">
            <Plus size={18} strokeWidth={3} />
          </div>
          <span className="font-serif text-2xl font-semibold tracking-tight text-obsidian decoration-sage/30 underline underline-offset-4 decoration-2 hover:text-sage transition-colors">
            {BRAND.name}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-12">
          {['Philosophy', 'Facilities', 'Science'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} className="caps-technical text-obsidian/60 hover:text-sage transition-colors">
              {item}
            </a>
          ))}
          <button 
            onClick={() => navigate('/triage')}
            className="px-8 py-2.5 bg-obsidian text-paper rounded-full caps-technical hover:bg-sage hover:text-paper transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Enter {BRAND.name}
          </button>
        </div>

        <button className="md:hidden text-obsidian">
          <Menu size={24} />
        </button>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-32">
        <ArtisticBackground />
        
        <div className="max-w-5xl mx-auto px-6 text-center z-10 relative">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-3 px-6 py-2 bg-obsidian/5 backdrop-blur-xl border border-obsidian/10 rounded-full text-[9px] font-bold tracking-[0.3em] uppercase text-obsidian mb-8 shadow-sm">
              <span className="text-sage animate-clinical w-2 h-2 rounded-full bg-current" />
              {BRAND.tagline}
            </div>

            <h1 className="text-5xl md:text-8xl font-semibold text-obsidian leading-[0.9] mb-10 select-none tracking-tighter">
              Clinical <br />
              <span className="text-luxury">Intelligence.</span>
            </h1>

            <p className="text-lg md:text-2xl text-obsidian/70 max-w-[600px] mx-auto mb-12 font-medium leading-relaxed italic">
              {BRAND.copy.hero_sub}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              <button
                onClick={() => navigate('/triage')}
                className="group relative flex items-center gap-4 px-10 py-5 bg-obsidian text-paper rounded-full text-xs font-bold tracking-[0.2em] uppercase cursor-pointer shadow-2xl hover:bg-sage hover:text-paper transition-all transform hover:-translate-y-1"
              >
                Launch Assessment
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
              
              <button className="px-10 py-5 border border-obsidian/10 rounded-full text-xs font-bold tracking-[0.2em] uppercase hover:bg-obsidian/5 transition-colors">
                The Science
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 2, duration: 1 }}
            className="mt-16 flex flex-col items-center gap-2"
          >
            <span className="caps-technical text-obsidian text-[8px] tracking-[0.5em]">Scroll to Discover</span>
            <div className="w-[1px] h-10 bg-gradient-to-b from-obsidian to-transparent opacity-20" />
          </motion.div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section id="philosophy" className="py-32 px-6 lg:px-24 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <FadeIn>
            <SectionLabel>Our Philosophy</SectionLabel>
            <h2 className="text-5xl md:text-7xl font-semibold leading-tight text-obsidian mb-10">
              The architecture <br />
              of <span className="text-sage italic">trust.</span>
            </h2>
            <p className="text-xl md:text-2xl text-slate-muted leading-relaxed mb-12">
              {BRAND.copy.mission}
            </p>
            <div className="grid grid-cols-2 gap-10">
              {services.slice(0, 2).map((s, i) => (
                <div key={i} className="flex flex-col gap-4">
                  <div className="text-sage">{s.icon}</div>
                  <h4 className="text-xl font-semibold">{s.title}</h4>
                  <p className="text-sm text-slate-muted">{s.desc}</p>
                </div>
              ))}
            </div>
          </FadeIn>
          <FadeIn delay={0.2} className="relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl">
            <img 
              src={IMAGES.clinical_tech} 
              alt="Clinical Tech" 
              className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian/40 to-transparent" />
            <div className="absolute bottom-10 left-10 p-8 glass rounded-2xl max-w-[300px]">
              <div className="caps-technical text-sage mb-2">Protocol 01</div>
              <p className="text-sm text-obsidian font-medium">Real-time analysis using neural clinical pathways.</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Facilities - Premium Horizontal Scroll */}
      <section id="facilities" className="bg-paper relative" ref={targetRef}>
        <div className="h-[300vh]">
          <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
            <div className="px-6 lg:px-24 mb-12">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
                <FadeIn>
                  <SectionLabel>The Facilities</SectionLabel>
                  <h2 className="text-5xl md:text-7xl font-semibold text-obsidian italic tracking-tight">Residencies of Care</h2>
                </FadeIn>
                <FadeIn delay={0.1} className="md:w-1/3">
                  <p className="text-lg md:text-xl text-slate-muted leading-relaxed">Our physical presence matches our digital precision. Safe, serene, and surgically tuned environments for recovery.</p>
                </FadeIn>
              </div>
            </div>

            <motion.div 
              style={{ x: useTransform(scrollYProgress, [0.1, 0.9], ["0%", "-75%"]) }}
              className="flex gap-12 px-6 lg:px-24 w-max"
            >
              {facilities.map((f, i) => (
                <div 
                  key={i} 
                  className="relative flex-shrink-0 w-[85vw] md:w-[600px] aspect-[4/5] md:aspect-square group overflow-hidden rounded-[3rem] shadow-2xl transition-transform duration-700"
                >
                  <img 
                    src={f.img} 
                    alt={f.title} 
                    className="w-full h-full object-cover grayscale-[0.2] transition-transform duration-[1500ms] group-hover:scale-110 group-hover:grayscale-0" 
                  />
                  <div className="absolute inset-0 bg-obsidian/20 group-hover:bg-obsidian/0 transition-colors duration-500" />
                  
                  {/* Card Content Overlay */}
                  <div className="absolute inset-0 p-10 flex flex-col justify-between text-white transition-all duration-700">
                    <div className="caps-technical text-sage/90 bg-obsidian/20 backdrop-blur-md self-start px-5 py-2 rounded-full border border-white/10 uppercase text-[10px] tracking-[0.3em]">
                      {f.type}
                    </div>
                    
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <h3 className="text-4xl md:text-5xl font-semibold mb-6 tracking-tight leading-none group-hover:text-sage transition-colors">{f.title}</h3>
                      <p className="text-sm md:text-base opacity-0 group-hover:opacity-100 transition-opacity duration-500 max-w-[320px] leading-relaxed mb-8 font-medium">
                        {f.description}
                      </p>
                      <div className="flex items-center gap-3 caps-technical text-[10px] opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100">
                        View Facility Specification <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Subtle index number */}
                  <div className="absolute top-10 right-10 text-white/20 font-mono text-sm group-hover:text-white/40 transition-colors">
                    0{i + 1}
                  </div>
                </div>
              ))}

              {/* End of Gallery Card */}
              <div className="flex-shrink-0 w-[50vw] flex items-center justify-center pr-24">
                <div className="text-center group cursor-pointer" onClick={() => navigate('/triage')}>
                  <div className="w-24 h-24 rounded-full border border-obsidian/10 flex items-center justify-center mb-8 group-hover:bg-obsidian group-hover:text-paper transition-all transform group-hover:scale-110">
                    <ArrowRight size={32} />
                  </div>
                  <div className="caps-technical text-obsidian font-bold tracking-[0.4em]">Initialize Assessment</div>
                </div>
              </div>
            </motion.div>

            {/* Progress indicator */}
            <div className="absolute bottom-12 left-6 lg:left-24 right-6 lg:right-24 h-[1px] bg-obsidian/5 overflow-hidden">
               <motion.div 
                style={{ scaleX: scrollYProgress, transformOrigin: "left" }}
                className="h-full bg-sage w-full"
               />
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-40 bg-obsidian text-paper overflow-hidden relative">
        <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(242,87,43,0.3)_0%,transparent_70%)]" />
        </div>
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <FadeIn>
             <SectionLabel className="text-sage/60 justify-center">Deployment</SectionLabel>
             <h2 className="text-6xl md:text-8xl font-semibold mb-12 leading-[0.9]">
               Begin your <br />
               <span className="text-luxury text-sage">diagnostic journey.</span>
             </h2>
             <button
              onClick={() => navigate('/triage')}
              className="px-16 py-8 bg-paper text-obsidian rounded-full caps-technical hover:bg-sage hover:text-paper transition-all shadow-2xl"
             >
               Initiate Symptom Check
             </button>
             <p className="mt-8 text-xs text-white/30 tracking-[0.2em] uppercase">No login required · Confidential · Clinical AI Platform</p>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 lg:px-24 bg-paper border-t border-muted">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16">
          <div className="max-w-[300px]">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-6 h-6 rounded-full bg-obsidian flex items-center justify-center text-paper">
                    <Plus size={14} strokeWidth={3} />
                </div>
                <span className="font-serif text-xl font-semibold">{BRAND.name}</span>
             </div>
             <p className="text-sm text-slate-muted leading-relaxed">
               Redefining medical triage through editorial precision and clinical intelligence. Built for the modern patient.
             </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-20">
             <div className="flex flex-col gap-4">
                <div className="caps-technical text-sage">Experience</div>
                {['Approach', 'Facilities', 'Science', 'Ethics'].map(l => <a key={l} href="#" className="text-sm text-obsidian/60 hover:text-obsidian">{l}</a>)}
             </div>
             <div className="flex flex-col gap-4">
                <div className="caps-technical text-sage">Legals</div>
                {['Privacy', 'HIPAA', 'Terms', 'Clinical Safety'].map(l => <a key={l} href="#" className="text-sm text-obsidian/60 hover:text-obsidian">{l}</a>)}
             </div>
             <div className="flex flex-col gap-4">
                <div className="caps-technical text-sage">Connect</div>
                {['Instagram', 'Twitter', 'LinkedIn'].map(l => <a key={l} href="#" className="text-sm text-obsidian/60 hover:text-obsidian">{l}</a>)}
             </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-muted flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] text-slate-muted uppercase tracking-widest font-bold">
            &copy; 2026 {BRAND.name.toUpperCase()} LABORATORIES. ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-6">
            <ShieldCheck size={16} className="text-sage" />
            <span className="text-[10px] text-slate-muted uppercase tracking-widest">Medical Grade Security Enforced</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
