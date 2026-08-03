import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle'
import LanguageToggle from '../components/LanguageToggle'
import AccountMenu from '../components/AccountMenu'
import { useAuth } from '../lib/AuthProvider'
import { useBrand } from '../lib/BrandProvider'
import {
  fetchClinicCases,
  fetchMyMemberships,
  updateCaseStatus,
} from '../lib/clinicStore'
import { urgencyBadge } from '../lib/triageIntake'
import { cn } from '../lib/utils'

const STATUS_OPTIONS = ['new', 'reviewing', 'closed']

function urgencyTone(urgency) {
  return urgencyBadge(urgency)?.tone || 'yellow'
}

export default function Clinic() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const { user, ready, cloudEnabled } = useAuth()
  const { brand } = useBrand()
  const [memberships, setMemberships] = useState([])
  const [cases, setCases] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const activeOrg = useMemo(() => {
    if (slug) {
      return (
        memberships.find((m) => m.org?.slug === slug)?.org || {
          slug,
          name: brand.name,
          id: brand.id,
        }
      )
    }
    return memberships[0]?.org || null
  }, [memberships, slug, brand])

  const selected = cases.find((c) => c.id === selectedId) || cases[0] || null

  const load = async () => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const mine = await fetchMyMemberships(user.id)
      setMemberships(mine)
      const org =
        (slug && mine.find((m) => m.org?.slug === slug)?.org) ||
        mine[0]?.org ||
        null
      if (!org?.id) {
        setCases([])
        setError(
          mine.length === 0
            ? 'No clinic membership yet. Run schema-phase3.sql, then add yourself as org_members owner (see SQL file footer).'
            : 'Organization not found for this slug.'
        )
        return
      }
      const rows = await fetchClinicCases(org.id)
      setCases(rows)
      if (rows[0]) setSelectedId(rows[0].id)
    } catch (err) {
      setError(err.message || 'Failed to load clinic inbox')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!ready) return
    load()
  }, [ready, user?.id, slug])

  const filtered = cases.filter((row) => {
    if (filter === 'all') return true
    if (filter === 'urgent') {
      return (
        row.urgency === 'CALL_EMERGENCY' || row.urgency === 'HOSPITAL_NOW'
      )
    }
    return row.status === filter
  })

  const setStatus = async (status) => {
    if (!selected) return
    await updateCaseStatus(selected.id, status)
    setCases((current) =>
      current.map((row) =>
        row.id === selected.id ? { ...row, status } : row
      )
    )
  }

  if (!cloudEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper p-6 text-center">
        <div>
          <Building2 className="mx-auto text-obsidian/40" size={28} />
          <h1 className="mt-3 font-serif text-2xl">Clinic dashboard</h1>
          <p className="mt-2 max-w-md text-sm text-obsidian/55">
            Configure Supabase env vars to enable the clinic inbox.
          </p>
          <Link to="/triage" className="mt-4 inline-block text-sm underline">
            Back to triage
          </Link>
        </div>
      </div>
    )
  }

  if (ready && !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper p-6">
        <h1 className="font-serif text-2xl">Clinic staff sign-in</h1>
        <p className="max-w-sm text-center text-sm text-obsidian/55">
          Sign in with the same magic link used in triage, then open this page
          again. Your user must be listed in org_members.
        </p>
        <div className="w-full max-w-sm rounded-2xl border border-obsidian/10 p-4">
          <AccountMenu />
        </div>
        <button
          type="button"
          onClick={() => navigate('/triage')}
          className="text-sm text-obsidian/60 underline"
        >
          Go to patient triage
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-paper text-obsidian">
      <aside className="flex w-[280px] shrink-0 flex-col border-r border-obsidian/10 bg-muted/30">
        <div className="flex items-center gap-2 border-b border-obsidian/10 px-4 py-4">
          <button
            type="button"
            onClick={() => navigate(slug ? `/o/${slug}/triage` : '/triage')}
            className="rounded-lg p-1.5 hover:bg-muted"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <div className="truncate font-serif text-lg leading-tight">
              {activeOrg?.name || brand.name}
            </div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-obsidian/40">
              Clinic inbox
            </div>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto px-3 py-3">
          {['all', 'urgent', 'new', 'reviewing', 'closed'].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
                filter === key
                  ? 'bg-obsidian text-paper'
                  : 'text-obsidian/45 hover:bg-muted'
              )}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {loading && (
            <p className="px-3 py-6 text-xs text-obsidian/40">Loading cases…</p>
          )}
          {!loading && filtered.length === 0 && (
            <p className="px-3 py-6 text-xs text-obsidian/40">
              No cases yet. Patients can tap “Share with clinic” after triage.
            </p>
          )}
          {filtered.map((row) => {
            const tone = urgencyTone(row.urgency)
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => setSelectedId(row.id)}
                className={cn(
                  'mb-1 w-full rounded-xl px-3 py-2.5 text-left transition',
                  selected?.id === row.id
                    ? 'bg-obsidian text-paper'
                    : 'hover:bg-muted'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{row.title}</span>
                  <span
                    className={cn(
                      'h-2 w-2 shrink-0 rounded-full',
                      tone === 'red' && 'bg-red-500',
                      tone === 'yellow' && 'bg-amber-500',
                      tone === 'green' && 'bg-emerald-500',
                      selected?.id === row.id && 'ring-1 ring-paper/40'
                    )}
                  />
                </div>
                <div
                  className={cn(
                    'mt-1 flex items-center gap-2 text-[10px] uppercase tracking-wider',
                    selected?.id === row.id
                      ? 'text-paper/60'
                      : 'text-obsidian/40'
                  )}
                >
                  <span>{row.urgency || '—'}</span>
                  <span>·</span>
                  <span>{row.status}</span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="border-t border-obsidian/10 p-3">
          <AccountMenu />
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-obsidian/10 px-5 py-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-obsidian/40">
              Case review
            </div>
            <h1 className="font-serif text-xl">
              {selected?.title || 'Select a case'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={load}
              className="rounded-lg border border-obsidian/12 p-2 text-obsidian/55 hover:text-obsidian"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        {error && (
          <div className="mx-5 mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {selected ? (
          <div className="grid flex-1 gap-5 overflow-y-auto p-5 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-4">
              <div className="rounded-2xl border border-obsidian/10 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-obsidian px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-paper">
                    {selected.urgency || 'Unknown'}
                  </span>
                  <span className="text-xs text-obsidian/45">
                    Shared {new Date(selected.shared_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-obsidian/75">
                  {selected.assessment?.summary ||
                    selected.assessment?.urgency?.final ||
                    'No summary'}
                </p>
                <p className="mt-3 text-sm leading-6 text-obsidian/60">
                  {selected.assessment?.reasoning}
                </p>
                <div className="mt-4 rounded-xl bg-muted/50 px-3 py-2 text-sm">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-obsidian/40">
                    Guidance
                  </div>
                  <p className="mt-1">{selected.assessment?.guidance}</p>
                </div>
                {selected.assessment?.watchFor && (
                  <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-red-700/70">
                      Watch for
                    </div>
                    <p className="mt-1 text-red-900/80 dark:text-red-100/80">
                      {selected.assessment.watchFor}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-obsidian/10 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-obsidian/40">
                  Status
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatus(status)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider',
                        selected.status === status
                          ? 'bg-obsidian text-paper'
                          : 'border border-obsidian/12 text-obsidian/55 hover:border-obsidian/30'
                      )}
                    >
                      {status === 'closed' ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <Clock3 size={12} />
                      )}
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-obsidian/10 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-obsidian/40">
                Clinician packet (JSON)
              </div>
              <pre className="mt-3 max-h-[60vh] overflow-auto rounded-xl bg-obsidian/[0.04] p-3 text-[11px] leading-5 text-obsidian/70">
                {JSON.stringify(selected.assessment, null, 2)}
              </pre>
            </section>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-obsidian/40">
            {loading ? 'Loading…' : 'Select a case from the inbox'}
          </div>
        )}
      </main>
    </div>
  )
}
