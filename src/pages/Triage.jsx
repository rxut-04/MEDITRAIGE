import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { 
  ArrowLeft, 
  MessageCircle, 
  ShieldCheck, 
  Activity, 
  Clock, 
  Plus, 
  Send, 
  Calendar,
  X,
  CreditCard,
  User,
  Info,
  AlertCircle,
  AlertTriangle
} from 'lucide-react'
import MessageBubble from '../components/MessageBubble'
import TriageCard from '../components/TriageCard'
import AIVideoAvatar from '../components/AIVideoAvatar'
import { BRAND } from '../constants'
import { cn } from '../lib/utils'

const FLOWISE_URL = import.meta.env.VITE_FLOWISE_URL || 'https://cloud.flowiseai.com/api/v1/prediction/682517ef-8bf4-487c-916b-b72028e7d739'
const BEY_AGENT_ID = import.meta.env.VITE_BEY_AGENT_ID || 'f30d7eef-6e71-433f-938d-cecdd8c0b653'
const IS_TEST_MODE = import.meta.env.VITE_TEST_MODE === 'true' // Only test mode if explicitly requested via env
const SESSION_ID = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7)

// Parse triage result from agent response
function parseTriageResult(text) {
  if (!text) return null
  const match = text.match(/---TRIAGE_RESULT---([\s\S]*?)---END_TRIAGE---/)
  if (!match) return null

  const block = match[1]
  const get = (key) => {
    const m = block.match(new RegExp(`${key}:\\s*(.+)`, 'i'))
    return m ? m[1].trim() : ''
  }

  return {
    urgency: get('URGENCY'),
    summary: get('SUMMARY'),
    reasoning: get('REASONING'),
    guidance: get('GUIDANCE'),
    watchFor: get('WATCH_FOR'),
  }
}

const BookingDrawer = ({ isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-obsidian/40 backdrop-blur-sm z-[200]"
        />
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-full max-w-[480px] bg-paper shadow-2xl z-[201] p-12 overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-16">
            <div className="caps-technical text-sage">Appointment Gateway</div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <h2 className="text-5xl font-semibold mb-10 leading-tight">Secure your <br /><span className="text-luxury">residency.</span></h2>
          
          <div className="space-y-12">
            <section>
              <div className="caps-technical text-obsidian/40 mb-6">Select Specialist</div>
              <div className="grid grid-cols-1 gap-4">
                {['General Practitioner', 'Clinical Diagnostician', 'Advanced Surgeon'].map(s => (
                  <button key={s} className="group p-6 border border-muted rounded-2xl flex items-center justify-between hover:bg-obsidian hover:text-paper transition-all">
                    <span className="font-medium">{s}</span>
                    <ArrowLeft size={16} className="rotate-180 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="caps-technical text-obsidian/40 mb-6">Schedule Time</div>
              <div className="flex items-center gap-4 p-6 glass rounded-2xl border-sage/20">
                <Calendar className="text-sage" size={24} />
                <div>
                   <div className="font-semibold text-obsidian">Earliest Available</div>
                   <div className="text-xs text-slate-muted">Today at 14:30 · Diagnostic Lounge 02</div>
                </div>
              </div>
            </section>

            <button className="w-full py-6 bg-sage text-paper rounded-full caps-technical shadow-xl shadow-sage/20 hover:scale-[1.02] active:scale-100 transition-all">
              Initialize Booking
            </button>
            <p className="text-center text-[10px] text-slate-muted uppercase tracking-widest leading-loose">
              By initializing, you agree to our clinical safety protocols and HIPAA encrypted data storage requirements.
            </p>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
)

export default function Triage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [triageResult, setTriageResult] = useState(null)
  const [error, setError] = useState(null)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    const greeting = "Welcome to MediTriage. I'm your AI Clinical Liaison. I'm here to analyze your symptoms with structural precision. To begin our diagnostic assessment, please describe your primary symptoms and their duration."
    setMessages([{
      role: 'assistant',
      content: greeting,
    }])
    
    // Speak initial greeting after a short delay for iframe load
    const timer = setTimeout(() => {
      const avatarIframe = document.getElementById('beyond-presence-iframe')
      if (avatarIframe && avatarIframe.contentWindow) {
        setIsAvatarSpeaking(true)
        avatarIframe.contentWindow.postMessage({
          type: 'bp_speak',
          text: greeting
        }, 'https://bey.chat')
        setTimeout(() => setIsAvatarSpeaking(false), 8000)
      }
    }, 3000)
    
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const triggerAvatarSpeech = (text) => {
    const avatarIframe = document.getElementById('beyond-presence-iframe')
    if (avatarIframe && avatarIframe.contentWindow) {
      setIsAvatarSpeaking(true)
      
      // Remove triage result structural tags for speech
      const speechText = text.replace(/---TRIAGE_RESULT---[\s\S]*?---END_TRIAGE---/g, '').trim()
      
      // Beyond Presence often uses specific commands. Let's try both common ones.
      const targetOrigin = "https://bey.chat"
      avatarIframe.contentWindow.postMessage({
        type: 'bp_speak',
        text: speechText
      }, targetOrigin)
      
      avatarIframe.contentWindow.postMessage({
        type: 'SAY_TEXT',
        text: speechText
      }, targetOrigin)

      // Auto-clear speaking state after a reasonable duration
      const duration = Math.min(Math.max(speechText.length * 65, 4000), 15000)
      setTimeout(() => setIsAvatarSpeaking(false), duration)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)
    setError(null)

    try {
      if (IS_TEST_MODE || !FLOWISE_URL) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        let mockResponse = "";
        let mockTriage = null;
        const userMsgCount = messages.filter(m => m.role === 'user').length + 1;

        if (userMsgCount === 1) {
          mockResponse = "Understood. Have you experienced any fever, or is there localized pain exceeding a level of 4/10?";
        } else if (userMsgCount === 2) {
          mockResponse = "Analysis complete. I have generated a structured triage assessment based on your clinical inputs.\n\n---TRIAGE_RESULT---\nURGENCY: CLINIC_48H\nSUMMARY: Mild localized symptoms consistent with non-acute inflammation.\nREASONING: Lack of systemic fever reduces urgency, though localized discomfort warrants professional physical exam within 48h.\nGUIDANCE: Secure a GP consultation. Monitor site for increased redness or pain levels.\nWATCH_FOR: Rapid swelling, high fever (>38.5C), or severe lethargy.\n---END_TRIAGE---";
          mockTriage = parseTriageResult(mockResponse);
        } else {
          mockResponse = "I am monitoring for any updates. Should your symptoms change, please provide a detailed description immediately.";
        }

        if (mockTriage) setTriageResult(mockTriage);
        setMessages(prev => [...prev, { role: 'assistant', content: mockResponse }]);
        
        // Trigger Avatar Speech in Test Mode
        triggerAvatarSpeech(mockResponse);
        return;
      }

      const res = await fetch(FLOWISE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage, chatId: SESSION_ID }),
      })

      if (!res.ok) throw new Error(`MediTriage is unable to reach the clinical engine: Error ${res.status}`)

      const data = await res.json()
      // Extract clean text from potential JSON response or structured output
      let agentText = ""
      if (typeof data === 'string') {
        agentText = data
      } else {
        // Handle common Flowise/LangChain response formats
        agentText = data.text || data.answer || data.response || data.output || JSON.stringify(data)
      }
      
      // Secondary cleaning for markdown or JSON nested in strings
      if (typeof agentText === 'string') {
        const jsonMatch = agentText.match(/```json\s+([\s\S]*?)```/)
        if (jsonMatch && jsonMatch[1]) {
          try {
            const parsed = JSON.parse(jsonMatch[1].trim())
            agentText = parsed.text || parsed.answer || parsed.response || jsonMatch[1].trim()
          } catch (e) {
            agentText = jsonMatch[1].trim()
          }
        } else if (agentText.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(agentText.trim())
            agentText = parsed.text || parsed.answer || parsed.response || agentText
          } catch (e) {
            // Not partial JSON, continue
          }
        }
      }

      const parsed = parseTriageResult(agentText)
      if (parsed) setTriageResult(parsed)
      setMessages(prev => [...prev, { role: 'assistant', content: agentText }])
      
      // Trigger Avatar Speech
      triggerAvatarSpeech(agentText)
    } catch (err) {
      setError(err.message)
      setMessages(prev => [...prev, { role: 'assistant', content: "SYSTEM_ERROR: Neural link connection failed. Please verify API configuration." }])
    } finally {
      setLoading(false)
    }
  }

  const URGENCY_LABELS = {
    SELF_CARE: { label: 'Self-Care Protocol', color: '#171717', bg: '#f2572b10', bd: '#f2572b20', icon: <Plus size={16} /> },
    CLINIC_48H: { label: 'Clinic Follow-up (48h)', color: '#171717', bg: '#F5F5F5', bd: '#E5E5E5', icon: <Clock size={16} /> },
    HOSPITAL_NOW: { label: 'Urgent Hospital Admission', color: '#FFFFFF', bg: '#f2572b', bd: '#f2572b', icon: <Plus size={16} className="rotate-45" /> },
    CALL_EMERGENCY: { label: 'CRITICAL: CALL EMERGENCY', color: '#FFFFFF', bg: '#171717', bd: '#171717', icon: <AlertCircle size={16} /> },
  }
  return (
    <div className="h-screen bg-paper flex flex-col font-sans text-obsidian overflow-hidden">
      <BookingDrawer isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />

      {/* Header */}
      <nav className="h-[72px] glass z-[150] px-6 lg:px-12 flex items-center justify-between border-b border-muted shrink-0">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-full transition-colors text-obsidian"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
             <div className="w-7 h-7 rounded-full bg-obsidian flex items-center justify-center text-paper cursor-pointer" onClick={() => navigate('/')}>
                <Plus size={14} strokeWidth={3} />
             </div>
             <span 
                onClick={() => navigate('/')} 
                className="font-serif text-xl font-semibold tracking-tight cursor-pointer hover:text-sage transition-colors"
             >
                {BRAND.name}
             </span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-8">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-muted rounded-full border border-dark/5">
                <div className="w-1.5 h-1.5 rounded-full bg-sage animate-clinical" />
                <span className="caps-technical text-[9px]">Neural Clinical Link Active</span>
            </div>
            <div className="h-6 w-[1px] bg-muted" />
            <div className="flex items-center gap-3">
                <div className="text-right">
                    <div className="caps-technical text-sage text-[8px]">Session Protocol</div>
                    <div className="text-[10px] font-bold text-obsidian/40">{SESSION_ID.slice(0, 12)}</div>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-4">
            <button 
                onClick={() => setIsBookingOpen(true)}
                className="px-6 py-2 bg-obsidian text-paper rounded-full caps-technical text-[10px] hover:bg-sage transition-all"
            >
                Reserve Consultation
            </button>
        </div>
      </nav>

      {/* Main Framework */}
      <main className="flex-1 max-w-[1440px] mx-auto w-full flex flex-col lg:grid lg:grid-cols-[400px_1fr] gap-8 overflow-hidden pt-6 pb-6 px-4 lg:px-10 relative">
        
        {/* Left Column: Avatar Only */}
        <aside className="flex flex-col items-center justify-center h-full relative">
           <div className="w-full max-w-[340px]">
              <AIVideoAvatar 
                agentId={BEY_AGENT_ID} 
                sessionId={SESSION_ID} 
                isSpeaking={isAvatarSpeaking}
              />
           </div>
           
           <AnimatePresence>
             {isAvatarSpeaking && (
               <motion.div
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 10 }}
                 className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-accent/90 backdrop-blur-md text-paper px-6 py-3 rounded-full shadow-xl border border-white/20 whitespace-nowrap z-50 flex items-center gap-3"
               >
                 <div className="flex gap-1">
                   {[0, 1, 2].map((i) => (
                     <motion.div
                       key={i}
                       animate={{ height: [8, 16, 8] }}
                       transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                       className="w-0.5 bg-paper rounded-full"
                     />
                   ))}
                 </div>
                 <span className="caps-technical text-[10px] font-bold">AI Clinical Liaison is on the way...</span>
               </motion.div>
             )}
           </AnimatePresence>
        </aside>


        {/* Right Column: Clinical Chat (Expanded) */}
        <section className="flex flex-col h-full bg-white border border-muted rounded-[2.5rem] overflow-hidden shadow-sm relative lg:mb-4">
           <div className="p-6 border-b flex items-center justify-between glass sticky top-0 z-10">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <MessageCircle size={20} className="text-obsidian" />
                 </div>
                 <div>
                    <div className="font-semibold text-obsidian">Assessment Transcript</div>
                    <div className="text-[10px] caps-technical text-sage">Secure Tunneling Active</div>
                 </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-sage/10 rounded-full">
                 <span className="w-1.5 h-1.5 rounded-full bg-sage" />
                 <span className="text-[9px] caps-technical text-sage">LIVE ASSESSMENT</span>
              </div>
           </div>

           {/* Chat Viewport */}
           <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 custom-scrollbar">
              {messages.map((msg, i) => (
                <MessageBubble key={i} role={msg.role} content={msg.content} />
              ))}
              
              {loading && (
                <div className="self-start flex gap-2 p-6 bg-paper border border-muted rounded-[1.5rem] rounded-tl-none">
                  {[0,1,2].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                      className="w-2 h-2 rounded-full bg-sage"
                    />
                  ))}
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-medium caps-technical">
                    {error}
                </div>
              )}
              <div ref={bottomRef} />
           </div>

           {/* Input Controls */}
           <div className="p-6 border-t bg-paper/50">
              <div className="relative group">
                 <textarea
                   value={input}
                   onChange={e => setInput(e.target.value)}
                   onKeyDown={e => {
                     if (e.key === 'Enter' && !e.shiftKey) {
                       e.preventDefault()
                       sendMessage()
                     }
                   }}
                   placeholder="Initiate clinical description..."
                   disabled={loading}
                   className="w-full bg-white border border-muted rounded-2xl py-5 px-6 pr-24 focus:outline-none focus:ring-1 focus:ring-sage focus:border-sage transition-all resize-none shadow-sm text-md font-medium placeholder:text-obsidian/20"
                   rows={1}
                 />
                 <button
                   onClick={sendMessage}
                   disabled={loading || !input.trim()}
                   className="absolute right-3 top-1/2 -translate-y-1/2 p-4 bg-obsidian text-paper rounded-xl hover:bg-sage transition-all disabled:opacity-20 disabled:cursor-not-allowed group-hover:scale-105"
                 >
                   <Send size={20} />
                 </button>
              </div>
              <div className="mt-4 flex items-center justify-center gap-8 opacity-40">
                  <div className="flex items-center gap-2">
                     <ShieldCheck size={12} />
                     <span className="text-[9px] caps-technical">HIPAA COMPLIANT</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <Info size={12} />
                     <span className="text-[9px] caps-technical">NON-DIAGNOSTIC AI</span>
                  </div>
              </div>
           </div>
        </section>

      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 10px;
        }
      `}</style>
    </div>
  )
}
