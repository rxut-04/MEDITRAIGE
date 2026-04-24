import React from 'react'

export default function SafetyBanner() {
  return (
    <div style={{
      background: '#FFF7ED', borderBottom: '1px solid #FED7AA',
      padding: '8px 24px', fontSize: '0.75rem', color: '#92400E',
      textAlign: 'center',
    }}>
      ⚠ MediTriage is an AI triage tool. It does not diagnose or prescribe.
      For emergencies, call <strong>112 / 911</strong> immediately.
    </div>
  )
}
