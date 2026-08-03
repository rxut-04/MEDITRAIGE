import { cn } from '../lib/utils'

/**
 * Clickable triage option chips for structured intake.
 * - single: one click advances
 * - multi: toggle selections; exclusive "none" options clear others
 * Users can always type a free-text answer in the composer instead.
 */
export default function TriageOptionCard({
  title,
  hint,
  options,
  mode = 'single',
  selectedIds = [],
  onSelect,
  onContinue,
  continueLabel = 'Continue',
  disabled = false,
}) {
  const isMulti = mode === 'multi'
  const canContinue =
    isMulti && selectedIds.length > 0 && typeof onContinue === 'function'

  const defaultHint = isMulti
    ? 'Select all that apply, then continue — or type your own answer below'
    : 'Tap an option — or type your own answer below'

  return (
    <div className="ml-11 max-w-[680px]">
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-obsidian/40">
          Quick answers
        </span>
        <span className="text-[10px] text-obsidian/30">
          Optional · you can also type
        </span>
      </div>
      {title && (
        <p className="mb-1 text-sm font-medium text-obsidian/80">{title}</p>
      )}
      <p className="mb-4 text-xs text-obsidian/45">{hint || defaultHint}</p>

      <div
        className={cn(
          'flex flex-wrap gap-2',
          mode === 'single' && options.some((o) => o.hint) && 'gap-2'
        )}
      >
        {options.map((option) => {
          const active = selectedIds.includes(option.id)
          const isSeverity = Boolean(option.hint) && /^\d+$/.test(option.label)

          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect?.(option)}
              className={cn(
                'rounded-full border px-4 py-2.5 text-left text-sm font-medium transition',
                isSeverity && 'min-w-[3.25rem] justify-center text-center',
                active
                  ? 'border-accent bg-accent/10 text-obsidian ring-1 ring-accent/30'
                  : 'border-obsidian/12 bg-paper text-obsidian/75 hover:border-obsidian/25 hover:bg-muted',
                disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              <span className="block leading-none">{option.label}</span>
              {option.hint && (
                <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.12em] text-obsidian/40">
                  {option.hint}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {canContinue && (
        <button
          type="button"
          disabled={disabled}
          onClick={onContinue}
          className="mt-4 rounded-full bg-obsidian px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-paper transition hover:bg-accent disabled:opacity-40"
        >
          {continueLabel}
        </button>
      )}
    </div>
  )
}
