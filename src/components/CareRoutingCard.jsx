import { useEffect, useState } from 'react'
import {
  Building2,
  Cross,
  MapPin,
  Navigation,
  Phone,
  Share2,
  Stethoscope,
} from 'lucide-react'
import { useLocale } from '../lib/LocaleProvider'
import { useAuth } from '../lib/AuthProvider'
import { shareCaseWithClinic } from '../lib/clinicStore'
import { cn } from '../lib/utils'

const TYPE_ICON = {
  hospital: Cross,
  urgent_care: Building2,
  clinic: Stethoscope,
}

export default function CareRoutingCard({
  urgency,
  assessment,
  conversationId,
  title,
  orgSlug = 'demo-clinic',
  className,
}) {
  const { t } = useLocale()
  const { user } = useAuth()
  const [care, setCare] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [shared, setShared] = useState(false)
  const [sharing, setSharing] = useState(false)

  const loadCare = (coords) => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ urgency: urgency || 'CLINIC_48H' })
    if (coords) {
      params.set('lat', String(coords.lat))
      params.set('lng', String(coords.lng))
    }
    fetch(`/api/care/nearby?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setCare(data)
      })
      .catch((err) => setError(err.message || 'Care routing failed'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!urgency) return
    loadCare(null)
  }, [urgency])

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError(t('careDenied'))
      loadCare(null)
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        loadCare({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        setError(t('careDenied'))
        loadCare(null)
      },
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }

  const share = async () => {
    if (!user || !assessment || shared) return
    setSharing(true)
    try {
      await shareCaseWithClinic({
        orgSlug,
        conversationId,
        title,
        urgency,
        assessment,
        userId: user.id,
      })
      setShared(true)
    } catch (err) {
      setError(err.message || 'Share failed')
    } finally {
      setSharing(false)
    }
  }

  if (!urgency) return null

  return (
    <div
      className={cn(
        'ml-11 max-w-[680px] rounded-2xl border border-obsidian/12 bg-paper/90 p-4',
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-obsidian/45">
            {t('careNearby')}
          </div>
          <p className="mt-1 text-sm font-medium text-obsidian/80">
            {care?.action || (loading ? t('careLocating') : '—')}
          </p>
          {care?.emergencyNumber && (
            <a
              href={`tel:${care.emergencyNumber}`}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-red-600"
            >
              <Phone size={14} />
              Emergency {care.emergencyNumber}
            </a>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={requestLocation}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full border border-obsidian/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-obsidian/70 transition hover:border-obsidian/30 disabled:opacity-50"
          >
            <Navigation size={12} />
            {loading ? t('careLocating') : t('careLocate')}
          </button>
          {user && assessment && (
            <button
              type="button"
              onClick={share}
              disabled={sharing || shared}
              className="inline-flex items-center gap-1.5 rounded-full bg-obsidian px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-paper transition hover:bg-accent disabled:opacity-60"
            >
              <Share2 size={12} />
              {shared ? t('shared') : t('shareClinic')}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-3 text-[11px] text-amber-700 dark:text-amber-300">
          {error}
        </p>
      )}

      <ul className="mt-4 space-y-2">
        {(care?.facilities || []).map((facility) => {
          const Icon = TYPE_ICON[facility.type] || Building2
          return (
            <li
              key={facility.id}
              className="flex items-start gap-3 rounded-xl border border-obsidian/8 bg-muted/40 px-3 py-2.5"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-obsidian/8 text-obsidian/70">
                <Icon size={14} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{facility.name}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-obsidian/50">
                  <span className="capitalize">{facility.type.replace('_', ' ')}</span>
                  {facility.distanceKm != null && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={10} />
                      {facility.distanceKm} km
                    </span>
                  )}
                  {facility.open24h && <span>24/7</span>}
                </div>
                {facility.address && (
                  <p className="mt-1 text-[11px] leading-4 text-obsidian/45">
                    {facility.address}
                  </p>
                )}
              </div>
              {facility.phone && (
                <a
                  href={`tel:${facility.phone}`}
                  className="shrink-0 rounded-lg border border-obsidian/12 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-obsidian/65 hover:border-obsidian/30"
                >
                  Call
                </a>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
