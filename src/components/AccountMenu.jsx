import { useState } from 'react'
import { Check, Cloud, CloudOff, LogOut, Mail } from 'lucide-react'
import { useAuth } from '../lib/AuthProvider'
import { useLocale } from '../lib/LocaleProvider'
import { cn } from '../lib/utils'

/**
 * Compact auth control for the triage sidebar.
 * Signed out → magic-link email form. Signed in → account + sign out.
 */
export default function AccountMenu({ collapsed = false }) {
  const { user, cloudEnabled, signInWithEmail, signOut } = useAuth()
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)

  if (!cloudEnabled) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-[11px] text-obsidian/40',
          collapsed && 'justify-center'
        )}
        title="Cloud sync not configured — history stays on this device"
      >
        <CloudOff size={14} />
        {!collapsed && <span>Local only</span>}
      </div>
    )
  }

  if (user) {
    return (
      <div className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[11px] font-bold uppercase text-accent">
          {(user.email || '?').slice(0, 2)}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11px] font-medium text-obsidian/75">
              {user.email}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600">
              <Cloud size={10} />
              Synced
            </div>
          </div>
        )}
        {!collapsed && (
          <button
            type="button"
            onClick={signOut}
            title="Sign out"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-obsidian/40 transition hover:bg-muted hover:text-obsidian"
          >
            <LogOut size={14} />
          </button>
        )}
      </div>
    )
  }

  if (collapsed) {
    return (
      <div className="flex justify-center text-obsidian/40" title="Sign in to sync">
        <CloudOff size={14} />
      </div>
    )
  }

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setStatus(null)
    const { error } = await signInWithEmail(email)
    setBusy(false)
    setStatus(error ? { type: 'error', text: error } : { type: 'sent' })
  }

  return (
    <div className="space-y-2">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-2 rounded-xl border border-obsidian/12 px-3 py-2 text-[11px] font-medium text-obsidian/65 transition hover:border-obsidian/25 hover:text-obsidian"
        >
          <Cloud size={14} />
          {t('signInSync')}
        </button>
      ) : status?.type === 'sent' ? (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-700 dark:text-emerald-300">
          <Check size={14} className="mt-0.5 shrink-0" />
          <span>Magic link sent. Check your email.</span>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-2">
          <div className="flex items-center gap-2 rounded-xl border border-obsidian/12 px-2.5 py-1.5">
            <Mail size={13} className="shrink-0 text-obsidian/40" />
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@email.com"
              className="w-full bg-transparent text-[11px] text-obsidian outline-none placeholder:text-obsidian/35"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-obsidian px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-accent disabled:opacity-50"
          >
            {busy ? 'Sending…' : 'Send magic link'}
          </button>
          {status?.type === 'error' && (
            <p className="text-[10px] leading-4 text-red-600">{status.text}</p>
          )}
        </form>
      )}
    </div>
  )
}
