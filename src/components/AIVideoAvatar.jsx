import React, { useCallback, useState } from 'react'
import { ExternalLink, Mic, RotateCcw, Volume2 } from 'lucide-react'
import { motion } from 'motion/react'
import { AdvisoryAvatarCall } from './AdvisoryAvatarCall'
import { cn } from '../lib/utils'

const URGENCY_SPEECH = {
  SELF_CARE: 'Self-care',
  CLINIC_48H: 'Clinic follow-up within 48 hours',
  HOSPITAL_NOW: 'Urgent hospital admission',
  CALL_EMERGENCY: 'Emergency — call emergency services now',
}

/**
 * Map MediTriage structured result → Beyond Presence briefing payload.
 */
export function triageToBriefing(triageResult) {
  if (!triageResult) {
    return { riskLevel: 'Moderate', suggestions: [] }
  }

  const riskLevel =
    URGENCY_SPEECH[triageResult.urgency] ||
    triageResult.urgency ||
    'Moderate'

  const suggestions = [
    triageResult.summary && { suggestion: triageResult.summary },
    triageResult.reasoning && { suggestion: triageResult.reasoning },
    triageResult.guidance && { suggestion: triageResult.guidance },
    triageResult.watchFor && {
      suggestion: `Watch for: ${triageResult.watchFor}`,
    },
  ].filter(Boolean)

  return { riskLevel, suggestions }
}

function authHeaders() {
  const secret = import.meta.env.VITE_BEY_CALL_SECRET
  if (!secret) return { 'Content-Type': 'application/json' }
  return {
    'Content-Type': 'application/json',
    'x-bey-call-secret': secret,
  }
}

/**
 * First-party popup only — iframe Google login loops (3P cookies blocked).
 * Unique window name per agent so a stale call window is never reused.
 */
function openHostedCall(joinUrl) {
  const width = 480
  const height = 720
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2))
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2))
  const features = `popup=yes,width=${width},height=${height},left=${left},top=${top}`
  const windowName = `meditriage-bey-${joinUrl.split('/').pop()}`
  const win = window.open(joinUrl, windowName, features)
  if (win) {
    win.focus()
    return true
  }
  // Popup blocked — full tab still works as first-party
  window.open(joinUrl, '_blank', 'noopener,noreferrer')
  return false
}

/**
 * Pattern A — start advisory call on button click once triage briefing exists.
 * Prefers LiveKit (Growth Plan). Falls back to hosted bey.chat agent session.
 */
export default function AIVideoAvatar({ triageResult, className }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [popupBlocked, setPopupBlocked] = useState(false)

  const briefingReady =
    !!triageResult &&
    !!(triageResult.summary || triageResult.guidance || triageResult.urgency)

  const start = useCallback(async () => {
    if (!briefingReady) return
    setLoading(true)
    setError(null)
    setPopupBlocked(false)
    try {
      const { riskLevel, suggestions } = triageToBriefing(triageResult)
      const res = await fetch('/api/bey/create-advisory-call', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          risk_level: riskLevel,
          suggestions,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start avatar')

      if (data.mode === 'hosted' && data.join_url) {
        const opened = openHostedCall(data.join_url)
        setPopupBlocked(!opened)
        setSession({ mode: 'hosted', joinUrl: data.join_url })
        return
      }

      if (!data.livekit_url || !data.livekit_token) {
        throw new Error('Invalid response from advisory API')
      }
      setSession({
        mode: 'livekit',
        serverUrl: data.livekit_url,
        token: data.livekit_token,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start avatar')
    } finally {
      setLoading(false)
    }
  }, [briefingReady, triageResult])

  const listenAgain = useCallback(async () => {
    setSession(null)
    await start()
  }, [start])

  return (
    <div
      className={cn(
        'w-full h-full bg-obsidian rounded-[2rem] overflow-hidden shadow-2xl relative border-4 border-paper shadow-accent/20 flex flex-col min-h-0',
        className
      )}
    >
      {session?.mode === 'livekit' ? (
        <>
          <AdvisoryAvatarCall
            key={session.token}
            serverUrl={session.serverUrl}
            token={session.token}
            className="flex-1 min-h-0"
          />
          <div className="absolute inset-x-0 bottom-0 z-20 p-5 bg-gradient-to-t from-obsidian via-obsidian/80 to-transparent">
            <button
              type="button"
              onClick={listenAgain}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-paper/10 text-paper text-xs font-semibold hover:bg-paper/20 transition-all disabled:opacity-50"
            >
              <RotateCcw size={14} />
              {loading ? 'Preparing…' : 'Listen again'}
            </button>
          </div>
        </>
      ) : session?.mode === 'hosted' ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 relative">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background:
                'radial-gradient(ellipse at 50% 30%, rgba(242,87,43,0.35), transparent 60%)',
            }}
          />
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="relative z-10 w-20 h-20 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center"
          >
            <Volume2 className="text-accent" size={32} />
          </motion.div>

          <div className="relative z-10 text-center space-y-2 max-w-[300px]">
            <p className="text-paper font-semibold text-base">
              Avatar call opened in a new window
            </p>
            <p className="text-paper/55 text-xs leading-relaxed">
              Do <span className="text-paper/80 font-medium">not</span> use an in-page embed —
              Google login loops there. In the popup: sign in once if asked, then click{' '}
              <span className="text-paper font-semibold">Start Conversation</span> and allow
              microphone/speaker to hear the briefing.
            </p>
            {popupBlocked && (
              <p className="text-xs text-amber-300/90">
                Popup was blocked — allow popups for this site, then reopen.
              </p>
            )}
          </div>

          <div className="relative z-10 w-full max-w-[300px] flex flex-col gap-2">
            <button
              type="button"
              onClick={() => openHostedCall(session.joinUrl)}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-accent text-paper text-sm font-semibold"
            >
              Open avatar window <ExternalLink size={14} />
            </button>
            <button
              type="button"
              onClick={listenAgain}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-paper/10 text-paper text-xs font-semibold disabled:opacity-50"
            >
              <RotateCcw size={12} />
              {loading ? 'Preparing…' : 'Listen again (new briefing)'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 relative">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background:
                'radial-gradient(ellipse at 50% 30%, rgba(242,87,43,0.35), transparent 60%)',
            }}
          />
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="relative z-10 w-24 h-24 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center"
          >
            <Volume2 className="text-accent" size={36} />
          </motion.div>

          <div className="relative z-10 text-center space-y-2 max-w-[280px]">
            <p className="text-paper font-semibold text-lg">
              Clinical Avatar Briefing
            </p>
            <p className="text-paper/55 text-xs leading-relaxed">
              {briefingReady
                ? 'Your triage assessment is ready. Start the avatar to hear risk level and guidance spoken aloud.'
                : 'Complete the chat assessment first. When a triage result is ready, you can hear it from the avatar.'}
            </p>
          </div>

          {error && (
            <p className="relative z-10 text-xs text-red-300 text-center px-4 max-w-[300px]">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={start}
            disabled={!briefingReady || loading}
            className="relative z-10 w-full max-w-[280px] flex items-center justify-center gap-3 px-6 py-4 rounded-full bg-accent text-paper font-semibold text-sm tracking-wide hover:brightness-110 transition-all shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Mic size={18} />
            {loading
              ? 'Preparing briefing…'
              : briefingReady
                ? 'Start Case Briefing'
                : 'Awaiting triage result'}
          </button>
        </div>
      )}
    </div>
  )
}
