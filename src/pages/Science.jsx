import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  MessageSquare,
  Plus,
  ShieldAlert,
  Stethoscope,
  Video,
} from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle'
import { ForestAscii } from '../components/ui/forest-ascii'
import { BRAND } from '../constants'
import { cn } from '../lib/utils'

const HERO_ASCII_PARAMS = {
  cellSize: 12,
  bgOpacity: 45,
  blurAmount: 0,
  blurType: "none",
  contrast: 150,
  brightness: -8,
  animIntensity: { enabled: true, intensity: 55 },
  animSpeed: { enabled: true, intensity: 70 },
  pfx: {
    vignette: { enabled: true, intensity: 42 },
    chromatic: { enabled: true, intensity: 12 },
    bloom: { enabled: false, intensity: 25 },
    filmGrain: { enabled: false, intensity: 32 },
    glitch: { enabled: false, intensity: 20 },
    pixelate: { enabled: false, intensity: 15 },
    scanLines: { enabled: false, intensity: 40 },
    // Halftone/filmGrain used getImageData every frame — keep off for smooth hero
    halftone: { enabled: false, intensity: 16 },
    filmDust: { enabled: true, intensity: 12 },
  },
}

const SectionLabel = ({ children, className }) => (
  <div
    className={cn(
      'caps-technical mb-6 flex items-center gap-3 text-sage',
      className
    )}
  >
    <span className="h-px w-8 bg-sage/30" />
    {children}
  </div>
)

const FadeIn = ({ children, delay = 0, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 32 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ duration: 0.7, delay }}
    className={className}
  >
    {children}
  </motion.div>
)

const URGENCY = [
  {
    code: 'SELF_CARE',
    label: 'Self-care',
    tone: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    detail: 'Monitor at home. Seek care if symptoms worsen.',
  },
  {
    code: 'CLINIC_48H',
    label: 'Clinic in 24–48h',
    tone: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    detail: 'Arrange a GP or clinic visit soon.',
  },
  {
    code: 'HOSPITAL_NOW',
    label: 'Seek ER soon',
    tone: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
    detail: 'Urgent in-person care is recommended.',
  },
  {
    code: 'CALL_EMERGENCY',
    label: 'Emergency now',
    tone: 'bg-red-500/15 text-red-700 dark:text-red-300',
    detail: 'Call emergency services / go to ER immediately.',
  },
]

const LAYERS = [
  {
    icon: MessageSquare,
    title: 'Conversational liaison',
    body: 'Patients describe symptoms in plain language first. The model does not dump a checklist until a real health concern appears.',
  },
  {
    icon: Activity,
    title: 'Structured follow-ups',
    body: 'Once symptoms are clear, MediTriage asks duration, severity (1–10), associated symptoms, and red flags — one question at a time.',
  },
  {
    icon: BadgeCheck,
    title: 'Tap or type',
    body: 'Each clinical question can ship clickable options. Users may tap a chip or type a free-text answer — both feed the same assessment.',
  },
  {
    icon: Stethoscope,
    title: 'Urgency, not diagnosis',
    body: 'The engine returns a visible urgency badge inspired by nurse-triage / ESI-style next-step guidance — never a disease label or prescription.',
  },
]

export default function Science() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen overflow-x-hidden bg-paper text-obsidian">
      <nav className="glass fixed left-0 top-0 z-[100] flex h-[72px] w-full items-center justify-between px-6 lg:px-12">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-obsidian/55 transition hover:bg-muted hover:text-obsidian"
            aria-label="Back to home"
          >
            <ArrowLeft size={18} />
          </button>
          <div
            className="flex cursor-pointer select-none items-center gap-3"
            onClick={() => navigate('/')}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-obsidian text-paper">
              <Plus size={18} strokeWidth={3} />
            </div>
            <span className="font-serif text-2xl font-semibold tracking-tight text-obsidian underline decoration-sage/30 decoration-2 underline-offset-4">
              {BRAND.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          <button
            type="button"
            onClick={() => navigate('/triage')}
            className="hidden rounded-full bg-obsidian px-6 py-2.5 caps-technical text-paper transition hover:bg-sage sm:inline-flex"
          >
            Start assessment
          </button>
          <ThemeToggle />
        </div>
      </nav>

      {/* Hero — one composition: brand, headline, support, CTA, full-bleed ASCII */}
      <section className="relative flex min-h-screen items-end overflow-hidden pb-20 pt-28 md:items-center md:pb-0">
        <div className="absolute inset-0">
          <ForestAscii className="h-full w-full" params={HERO_ASCII_PARAMS} />
          {/* Soft left scrim for type — ASCII stays dominant */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/50 via-black/15 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
            className="max-w-2xl"
          >
            <div className="caps-technical mb-6 text-sage">The Science</div>
            <h1 className="mb-6 font-serif text-5xl font-semibold leading-[0.95] tracking-tight text-white md:text-7xl">
              How MediTriage{' '}
              <span className="italic text-sage">thinks</span> about urgency.
            </h1>
            <p className="mb-10 max-w-xl text-lg leading-relaxed text-white/75 md:text-xl">
              Not a diagnosis engine — a clinical triage layer that listens,
              structures what matters, and maps it to a clear next step.
            </p>
            <button
              type="button"
              onClick={() => navigate('/triage')}
              className="group inline-flex items-center gap-3 rounded-full bg-paper px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] text-obsidian transition hover:bg-sage hover:text-paper"
            >
              Try the clinical flow
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Pipeline */}
      <section className="border-t border-obsidian/10 bg-paper px-6 py-24 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <SectionLabel>Clinical pipeline</SectionLabel>
            <h2 className="mb-6 max-w-3xl font-serif text-4xl font-semibold tracking-tight md:text-5xl">
              From plain language to structured urgency.
            </h2>
            <p className="mb-16 max-w-2xl text-lg text-obsidian/60">
              MediTriage mirrors how a careful nurse triage works: understand the
              story, ask the missing clinical questions, then classify urgency —
              without pretending to be a licensed clinician.
            </p>
          </FadeIn>

          <div className="grid gap-10 md:grid-cols-2">
            {LAYERS.map((layer, index) => {
              const Icon = layer.icon
              return (
                <FadeIn key={layer.title} delay={index * 0.08}>
                  <div className="flex gap-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sage/10 text-sage">
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-obsidian/35">
                        0{index + 1}
                      </div>
                      <h3 className="mb-2 text-xl font-semibold">{layer.title}</h3>
                      <p className="text-sm leading-relaxed text-obsidian/60">
                        {layer.body}
                      </p>
                    </div>
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      {/* Urgency map */}
      <section className="bg-muted/60 px-6 py-24 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <SectionLabel>Urgency map</SectionLabel>
            <h2 className="mb-6 max-w-3xl font-serif text-4xl font-semibold tracking-tight md:text-5xl">
              Four next steps. One badge.
            </h2>
            <p className="mb-14 max-w-2xl text-lg text-obsidian/60">
              When enough signal is collected, the model emits a structured
              result. The UI surfaces it as a green / yellow / red-style badge
              patients can actually act on.
            </p>
          </FadeIn>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {URGENCY.map((item, index) => (
              <FadeIn key={item.code} delay={index * 0.06}>
                <div className="h-full rounded-3xl border border-obsidian/10 bg-paper p-6">
                  <div
                    className={cn(
                      'mb-4 inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]',
                      item.tone
                    )}
                  >
                    {item.label}
                  </div>
                  <div className="mb-2 font-mono text-[11px] text-obsidian/35">
                    {item.code}
                  </div>
                  <p className="text-sm leading-relaxed text-obsidian/65">
                    {item.detail}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Safety + avatar */}
      <section className="px-6 py-24 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-2 lg:items-start">
          <FadeIn>
            <SectionLabel>Safety envelope</SectionLabel>
            <h2 className="mb-6 font-serif text-4xl font-semibold tracking-tight md:text-5xl">
              Designed to escalate, not overclaim.
            </h2>
            <div className="space-y-5 text-obsidian/65">
              <p className="flex gap-3 text-sm leading-relaxed md:text-base">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-sage" />
                MediTriage is not a doctor, nurse, or licensed clinician. It does
                not diagnose disease or prescribe medication.
              </p>
              <p className="flex gap-3 text-sm leading-relaxed md:text-base">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-sage" />
                Red-flag patterns — severe chest pain, trouble breathing, stroke
                signs, uncontrolled bleeding, loss of consciousness, severe
                allergy, self-harm thoughts — push toward emergency care
                immediately.
              </p>
              <p className="flex gap-3 text-sm leading-relaxed md:text-base">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-sage" />
                The chat always stays writable: structured chips are shortcuts,
                never a forced funnel that blocks free description.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <SectionLabel>Presentation layer</SectionLabel>
            <h2 className="mb-6 font-serif text-4xl font-semibold tracking-tight md:text-5xl">
              Avatar briefing is theater, not authority.
            </h2>
            <div className="rounded-3xl border border-obsidian/10 bg-muted/80 p-8">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-obsidian text-paper">
                <Video size={20} />
              </div>
              <p className="mb-4 text-sm leading-relaxed text-obsidian/70 md:text-base">
                The optional Beyond Presence video avatar can brief patients on
                what MediTriage is and how to use it. Clinical decisions still
                come from the triage chat pipeline and urgency badge — the avatar
                is a human-facing explanation layer, not the medical brain.
              </p>
              <p className="text-xs uppercase tracking-[0.18em] text-obsidian/40">
                Presentation · not clinical authority
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-obsidian px-6 py-28 text-paper lg:px-12">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(242,87,43,0.35)_0%,transparent_70%)]" />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <FadeIn>
            <div className="caps-technical mb-6 justify-center text-sage/80">
              Experience it
            </div>
            <h2 className="mb-8 font-serif text-5xl font-semibold leading-[0.95] md:text-6xl">
              See the science{' '}
              <span className="italic text-sage">in the chat.</span>
            </h2>
            <button
              type="button"
              onClick={() => navigate('/triage')}
              className="rounded-full bg-paper px-12 py-5 caps-technical text-obsidian transition hover:bg-sage hover:text-paper"
            >
              Launch assessment
            </button>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
