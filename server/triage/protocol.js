/**
 * Deterministic triage protocol layer.
 * LLM handles conversation; this engine can escalate urgency for red flags.
 * Inspired by nurse-triage / ESI-style next-step logic — not a diagnosis.
 */

export const URGENCY_RANK = {
  SELF_CARE: 1,
  CLINIC_48H: 2,
  HOSPITAL_NOW: 3,
  CALL_EMERGENCY: 4,
}

export const URGENCY_CODES = Object.keys(URGENCY_RANK)

/** Red-flag patterns → CALL_EMERGENCY */
const EMERGENCY_PATTERNS = [
  {
    id: 'chest_severe',
    label: 'Severe chest pain / cardiac concern',
    re: /\b(severe\s+chest\s+pain|crushing\s+chest|chest\s+pain\s+with\s+(sweat|nausea|arm|jaw)|heart\s+attack)\b/i,
  },
  {
    id: 'breath_severe',
    label: 'Trouble breathing',
    re: /\b(can'?t\s+breathe|cannot\s+breathe|trouble\s+breathing|short(ness)?\s+of\s+breath|gasping|struggling\s+to\s+breathe|difficulty\s+breathing)\b/i,
  },
  {
    id: 'stroke',
    label: 'Stroke-like neurological signs',
    re: /\b(facial\s+droop|face\s+drooping|slurred\s+speech|sudden\s+weakness|one[- ]sided\s+weakness|stroke|can'?t\s+speak|arm\s+drift)\b/i,
  },
  {
    id: 'bleed',
    label: 'Uncontrolled bleeding',
    re: /\b(uncontrolled\s+bleed\w*|won'?t\s+stop\s+bleed\w*|severe\s+bleed\w*|bleeding\s+heavily|hemorrhage)\b/i,
  },
  {
    id: 'consciousness',
    label: 'Loss of consciousness / fainting',
    re: /\b(passed\s+out|pass(ed)?\s+out|lost\s+consciousness|loss\s+of\s+consciousness|unconscious|fainted|syncope)\b/i,
  },
  {
    id: 'anaphylaxis',
    label: 'Severe allergic reaction',
    re: /\b(anaphylaxis|throat\s+(is\s+)?(closing|swelling)|severe\s+allerg|lips?\s+swelling|tongue\s+swelling)\b/i,
  },
  {
    id: 'self_harm',
    label: 'Self-harm / suicidality',
    re: /\b(kill\s+myself|suicide|suicidal|self[- ]harm|want\s+to\s+die|end\s+my\s+life)\b/i,
  },
  {
    id: 'seizure',
    label: 'Seizure',
    re: /\b(seizure|convulsion|fitting)\b/i,
  },
  {
    id: 'neuro_headache',
    label: 'Sudden severe headache with neuro concern',
    re: /\b(worst\s+headache|thunderclap\s+headache|sudden\s+severe\s+headache).{0,40}\b(vision|weak|speech|vomit|neck\s+stiff)/i,
  },
  {
    id: 'fever_confusion',
    label: 'High fever with confusion',
    re: /\b(high\s+fever|fever\s+of\s+10[3-9]|40\s*c).{0,40}\b(confus|deliri|not\s+making\s+sense)/i,
  },
]

/** Patterns → HOSPITAL_NOW (urgent, not always ambulance) */
const HOSPITAL_PATTERNS = [
  {
    id: 'chest_moderate',
    label: 'Chest pain needing urgent evaluation',
    re: /\b(chest\s+pain|chest\s+pressure|chest\s+tightness)\b/i,
  },
  {
    id: 'breath_moderate',
    label: 'Breathing difficulty',
    re: /\b(wheezing|breathing\s+issue|hard\s+to\s+breathe|breathless)\b/i,
  },
  {
    id: 'dehydration',
    label: 'Persistent vomiting / dehydration risk',
    re: /\b(can'?t\s+keep\s+(food|fluids|water)\s+down|vomiting\s+(all|non[- ]stop|constantly)|severe\s+dehydration)\b/i,
  },
  {
    id: 'abdominal_severe',
    label: 'Severe abdominal pain',
    re: /\b(severe\s+(stomach|abdominal|belly)\s+pain|abdomen\s+rigid)\b/i,
  },
  {
    id: 'rapid_worsen',
    label: 'Rapidly worsening symptoms',
    re: /\b(getting\s+much\s+worse|rapidly\s+worsen|suddenly\s+worse|worse\s+by\s+the\s+hour)\b/i,
  },
]

/** Patterns that usually warrant clinic follow-up within 48h */
const CLINIC_PATTERNS = [
  {
    id: 'fever_persist',
    label: 'Persistent fever',
    re: /\b(fever).{0,30}\b(3\s*days|few\s+days|week|won'?t\s+go\s+away)\b/i,
  },
  {
    id: 'severity_high',
    label: 'High reported severity',
    re: /\b(severity\s*(is|=|:)?\s*(8|9|10)|pain\s*(is|=|:)?\s*(8|9|10)\s*\/\s*10)\b/i,
  },
  {
    id: 'infection_signs',
    label: 'Possible infection needing review',
    re: /\b(fever|chills|infected\s+wound|pus|swollen\s+glands)\b/i,
  },
]

function normalizeUrgency(code) {
  const c = String(code || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
  if (URGENCY_RANK[c]) return c
  return null
}

function maxUrgency(a, b) {
  const ra = URGENCY_RANK[a] || 0
  const rb = URGENCY_RANK[b] || 0
  return ra >= rb ? a : b
}

/**
 * Scan conversation transcript for protocol signals.
 * @param {Array<{ role: string, content: string }>} messages
 */
export function evaluateProtocol(messages = []) {
  const transcript = messages
    .filter((m) => m && typeof m.content === 'string')
    .map((m) => m.content)
    .join('\n')

  const matched = []
  let urgency = 'SELF_CARE'

  for (const rule of EMERGENCY_PATTERNS) {
    if (rule.re.test(transcript)) {
      matched.push({ level: 'CALL_EMERGENCY', ...rule, re: undefined })
      urgency = maxUrgency(urgency, 'CALL_EMERGENCY')
    }
  }

  for (const rule of HOSPITAL_PATTERNS) {
    if (rule.re.test(transcript)) {
      matched.push({ level: 'HOSPITAL_NOW', id: rule.id, label: rule.label })
      urgency = maxUrgency(urgency, 'HOSPITAL_NOW')
    }
  }

  for (const rule of CLINIC_PATTERNS) {
    if (rule.re.test(transcript)) {
      matched.push({ level: 'CLINIC_48H', id: rule.id, label: rule.label })
      urgency = maxUrgency(urgency, 'CLINIC_48H')
    }
  }

  // Severity digit alone (user answered "9")
  const severityHit = transcript.match(/\b(?:severity|pain)\D{0,12}([1-9]|10)\b/i)
  if (severityHit) {
    const n = Number(severityHit[1])
    if (n >= 8) {
      matched.push({
        level: 'CLINIC_48H',
        id: 'severity_numeric',
        label: `Reported severity ${n}/10`,
      })
      urgency = maxUrgency(urgency, 'CLINIC_48H')
    }
    if (n >= 9 && /\b(chest|breath|head|abdomen|stomach)\b/i.test(transcript)) {
      urgency = maxUrgency(urgency, 'HOSPITAL_NOW')
      matched.push({
        level: 'HOSPITAL_NOW',
        id: 'severity_with_site',
        label: `High severity (${n}) with concerning site`,
      })
    }
  }

  return {
    engine: 'meditriage-protocol-v1',
    urgency,
    matched,
    hasRedFlags: matched.some(
      (m) => m.level === 'CALL_EMERGENCY' || m.level === 'HOSPITAL_NOW'
    ),
  }
}

/**
 * Merge LLM triage with protocol.
 * Protocol may escalate; it never lowers a higher LLM emergency call unless LLM is invalid.
 */
export function mergeUrgency(llmUrgency, protocol) {
  const llm = normalizeUrgency(llmUrgency)
  const proto = normalizeUrgency(protocol?.urgency) || 'SELF_CARE'

  if (!llm) {
    return {
      urgency: proto,
      source: 'protocol',
      overridden: Boolean(protocol?.matched?.length),
      llmUrgency: null,
      protocolUrgency: proto,
      matched: protocol?.matched || [],
    }
  }

  const final = maxUrgency(llm, proto)
  const overridden = URGENCY_RANK[proto] > URGENCY_RANK[llm]

  return {
    urgency: final,
    source: overridden ? 'protocol_escalation' : 'llm',
    overridden,
    llmUrgency: llm,
    protocolUrgency: proto,
    matched: protocol?.matched || [],
  }
}

export function rewriteTriageBlock(text, merged, llmParsed) {
  const urgency = merged.urgency
  const summary =
    llmParsed?.summary ||
    'Based on the symptoms described, here is the recommended next step.'
  const reasoningParts = []
  if (llmParsed?.reasoning) reasoningParts.push(llmParsed.reasoning)
  if (merged.overridden) {
    reasoningParts.push(
      `Protocol escalation applied (${merged.matched
        .filter((m) => URGENCY_RANK[m.level] >= URGENCY_RANK[urgency])
        .map((m) => m.label)
        .slice(0, 3)
        .join('; ') || 'red-flag pattern detected'}).`
    )
  }
  const reasoning =
    reasoningParts.join(' ') ||
    'Urgency assigned by combining conversational assessment with safety protocol rules.'

  const guidance =
    llmParsed?.guidance ||
    defaultGuidance(urgency)

  const watchFor =
    llmParsed?.watchFor ||
    'Worsening pain, breathing trouble, confusion, fainting, or new neurological symptoms.'

  const block = [
    '---TRIAGE_RESULT---',
    `URGENCY: ${urgency}`,
    `SUMMARY: ${summary}`,
    `REASONING: ${reasoning}`,
    `GUIDANCE: ${guidance}`,
    `WATCH_FOR: ${watchFor}`,
    '---END_TRIAGE---',
  ].join('\n')

  if (/---TRIAGE_RESULT---[\s\S]*?---END_TRIAGE---/i.test(text)) {
    return text.replace(
      /---TRIAGE_RESULT---[\s\S]*?---END_TRIAGE---/i,
      block
    )
  }

  // If protocol forces emergency but LLM didn't emit a result, append one
  if (
    urgency === 'CALL_EMERGENCY' ||
    urgency === 'HOSPITAL_NOW' ||
    merged.overridden
  ) {
    return `${text.trim()}\n\n${block}`
  }

  return text
}

function defaultGuidance(urgency) {
  switch (urgency) {
    case 'CALL_EMERGENCY':
      return 'Call local emergency services or go to the ER now. Do not drive yourself if you feel unsafe.'
    case 'HOSPITAL_NOW':
      return 'Seek urgent/ER care as soon as possible today.'
    case 'CLINIC_48H':
      return 'Arrange a clinic or GP visit within 24–48 hours. Seek ER sooner if symptoms worsen.'
    default:
      return 'Monitor at home with rest and fluids as appropriate. Seek care if symptoms worsen or new red flags appear.'
  }
}
