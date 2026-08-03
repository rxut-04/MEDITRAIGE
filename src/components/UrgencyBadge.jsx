import { AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react'
import { urgencyBadge } from '../lib/triageIntake'
import { cn } from '../lib/utils'

const TONE_STYLES = {
  green: {
    wrap: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
    icon: CheckCircle2,
    pill: 'bg-emerald-500',
  },
  yellow: {
    wrap: 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100',
    icon: Clock3,
    pill: 'bg-amber-500',
  },
  red: {
    wrap: 'border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200',
    icon: AlertTriangle,
    pill: 'bg-red-500',
  },
}

export default function UrgencyBadge({
  urgency,
  overridden = false,
  source,
  className,
}) {
  if (!urgency) return null

  const badge = urgencyBadge(urgency)
  const style = TONE_STYLES[badge.tone] || TONE_STYLES.yellow
  const Icon = style.icon

  return (
    <div
      className={cn(
        'ml-11 max-w-[680px] rounded-2xl border px-4 py-3.5',
        style.wrap,
        className
      )}
      role="status"
      aria-label={`Urgency: ${badge.label}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white',
            style.pill
          )}
        >
          <Icon size={16} strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">
            Urgency assessment
          </div>
          <div className="mt-1 text-base font-semibold leading-snug">
            {badge.label}
          </div>
          <p className="mt-1 text-sm leading-5 opacity-80">{badge.detail}</p>
          {overridden && (
            <p className="mt-2 text-[11px] font-medium leading-4 opacity-70">
              Safety protocol escalated this result
              {source ? ` (${source})` : ''}.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
