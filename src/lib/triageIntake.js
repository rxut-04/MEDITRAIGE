/** LLM-driven triage follow-ups + urgency badge helpers. */

export const DURATION_OPTIONS = [
  { id: 'lt24h', label: 'Less than 24 hours' },
  { id: '1-3d', label: '1–3 days' },
  { id: '4-7d', label: '4–7 days' },
  { id: '1-4w', label: '1–4 weeks' },
  { id: 'gt1m', label: 'More than a month' },
]

export const SEVERITY_OPTIONS = Array.from({ length: 10 }, (_, i) => {
  const n = i + 1
  let hint = 'Mild'
  if (n >= 8) hint = 'Severe'
  else if (n >= 5) hint = 'Moderate'
  return { id: String(n), label: `${n}`, hint }
})

export const ASSOCIATED_OPTIONS = [
  { id: 'fever', label: 'Fever or chills' },
  { id: 'breath', label: 'Shortness of breath' },
  { id: 'chest', label: 'Chest discomfort' },
  { id: 'nausea', label: 'Nausea or vomiting' },
  { id: 'dizziness', label: 'Dizziness or fainting' },
  { id: 'rash', label: 'Rash or swelling' },
  { id: 'weakness', label: 'Weakness or numbness' },
  { id: 'none', label: 'None of these', exclusive: true },
]

export const RED_FLAG_OPTIONS = [
  { id: 'chest_severe', label: 'Severe chest pain' },
  { id: 'breath_severe', label: 'Trouble breathing' },
  { id: 'neuro', label: 'Sudden weakness, facial droop, or speech trouble' },
  { id: 'bleed', label: 'Uncontrolled bleeding' },
  { id: 'conscious', label: 'Fainting / loss of consciousness' },
  { id: 'allergy', label: 'Severe allergic reaction' },
  { id: 'suicidality', label: 'Thoughts of self-harm' },
  { id: 'none', label: 'None of these', exclusive: true },
]

const PRESET_OPTIONS = {
  duration: DURATION_OPTIONS,
  severity: SEVERITY_OPTIONS,
  associated: ASSOCIATED_OPTIONS,
  red_flags: RED_FLAG_OPTIONS,
}

function getField(block, key) {
  const match = block.match(new RegExp(`${key}:\\s*(.+)`, 'i'))
  return match ? match[1].trim() : ''
}

/**
 * Parse optional clickable follow-up block from model output.
 * ---FOLLOW_UP---
 * TYPE: duration|severity|associated|red_flags|custom
 * MODE: single|multi
 * PROMPT: question text
 * OPTIONS: A | B | C   (required for custom; optional for presets)
 * ---END_FOLLOW_UP---
 */
export function parseFollowUp(text) {
  if (!text) return null
  const match = text.match(/---FOLLOW_UP---([\s\S]*?)---END_FOLLOW_UP---/i)
  if (!match) return null

  const block = match[1]
  const type = (getField(block, 'TYPE') || 'custom').toLowerCase()
  const mode = (getField(block, 'MODE') || (type === 'associated' || type === 'red_flags' ? 'multi' : 'single')).toLowerCase()
  const prompt = getField(block, 'PROMPT') || 'Please choose an option:'
  const rawOptions = getField(block, 'OPTIONS')

  let options = PRESET_OPTIONS[type] || null
  if (rawOptions) {
    options = rawOptions
      .split('|')
      .map((label) => label.trim())
      .filter(Boolean)
      .map((label, index) => ({ id: `opt-${index}`, label }))
  }

  if (!options?.length) return null

  return {
    type,
    mode: mode === 'multi' ? 'multi' : 'single',
    prompt,
    options,
  }
}

export function stripProtocolBlocks(text) {
  return String(text || '')
    .replace(/---FOLLOW_UP---[\s\S]*?---END_FOLLOW_UP---/gi, '')
    .replace(/---TRIAGE_RESULT---[\s\S]*?---END_TRIAGE---/gi, '')
    .trim()
}

export function parseTriageResult(text) {
  if (!text) return null
  const match = text.match(/---TRIAGE_RESULT---([\s\S]*?)---END_TRIAGE---/i)
  if (!match) return null

  const block = match[1]
  const get = (key) => getField(block, key)

  return {
    urgency: get('URGENCY'),
    summary: get('SUMMARY'),
    reasoning: get('REASONING'),
    guidance: get('GUIDANCE'),
    watchFor: get('WATCH_FOR'),
  }
}

/** Map internal urgency codes → badge tone for the UI. */
export function urgencyBadge(urgency) {
  const code = String(urgency || '').toUpperCase()
  if (code === 'SELF_CARE') {
    return {
      tone: 'green',
      label: 'Self-care',
      detail: 'Monitor at home. Seek care if symptoms worsen.',
    }
  }
  if (code === 'CLINIC_48H') {
    return {
      tone: 'yellow',
      label: 'See a doctor in 24–48h',
      detail: 'Arrange a clinic or GP visit soon.',
    }
  }
  if (code === 'HOSPITAL_NOW' || code === 'CALL_EMERGENCY') {
    return {
      tone: 'red',
      label:
        code === 'CALL_EMERGENCY'
          ? 'Seek ER / call emergency now'
          : 'Seek ER now',
      detail: 'Urgent in-person care is recommended.',
    }
  }
  return {
    tone: 'yellow',
    label: 'Clinical follow-up advised',
    detail: 'Review with a licensed clinician.',
  }
}
