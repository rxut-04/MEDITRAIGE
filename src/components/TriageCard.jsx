import React from 'react'
import { motion } from 'motion/react'
import { ShieldAlert, Info, AlertTriangle } from 'lucide-react'
import { cn } from '../lib/utils'

export default function TriageCard({ result, urgencyConfig }) {
  if (!result) return null;
  const cfg = urgencyConfig[result.urgency] || { color: '#000', label: 'Inconclusive' }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white border border-muted rounded-2xl overflow-hidden shadow-2xl sticky top-24"
    >
      {/* Urgency header */}
      <div 
        className="p-6 border-b"
        style={{ backgroundColor: cfg.bg || '#FFFFFF', borderColor: cfg.bd || '#E5E5E5' }}
      >
        <div className="caps-technical text-obsidian/40 mb-2">Triage Assessment</div>
        <div 
          className="text-2xl font-semibold flex items-center gap-3 font-serif italic"
          style={{ color: cfg.color }}
        >
          {cfg.icon} {cfg.label}
        </div>
      </div>

      {/* Details */}
      <div className="p-6 space-y-8">
        {result.summary && (
          <div className="space-y-2">
            <div className="caps-technical text-sage flex items-center gap-2">
                <Info size={12} /> Clinical Summary
            </div>
            <p className="text-md text-obsidian leading-relaxed font-medium">
              {result.summary}
            </p>
          </div>
        )}

        {result.guidance && (
          <div className="space-y-2">
            <div className="caps-technical text-obsidian/60">Immediate Guidance</div>
            <p className="text-sm text-slate-muted leading-relaxed">
              {result.guidance}
            </p>
          </div>
        )}

        {result.watchFor && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl space-y-2">
            <div className="caps-technical text-red-600 flex items-center gap-2">
              <AlertTriangle size={14} /> Escalation Triggers
            </div>
            <p className="text-sm text-red-700 leading-relaxed italic">
              {result.watchFor}
            </p>
          </div>
        )}

        <div className="p-4 bg-muted/30 border border-muted rounded-xl text-[10px] text-obsidian/40 uppercase tracking-widest font-bold leading-normal">
          Disclaimer: This AI-generated assessment is for clinical guidance only. It does not constitute a prescription or diagnosis.
        </div>
      </div>
    </motion.div>
  )
}
