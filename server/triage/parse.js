/** Shared parsers for triage protocol blocks (server-side). */

function getField(block, key) {
  const match = block.match(new RegExp(`${key}:\\s*(.+)`, 'i'))
  return match ? match[1].trim() : ''
}

export function parseTriageResult(text) {
  if (!text) return null
  const match = text.match(/---TRIAGE_RESULT---([\s\S]*?)---END_TRIAGE---/i)
  if (!match) return null

  const block = match[1]
  return {
    urgency: getField(block, 'URGENCY'),
    summary: getField(block, 'SUMMARY'),
    reasoning: getField(block, 'REASONING'),
    guidance: getField(block, 'GUIDANCE'),
    watchFor: getField(block, 'WATCH_FOR'),
  }
}

export function stripProtocolBlocks(text) {
  return String(text || '')
    .replace(/---FOLLOW_UP---[\s\S]*?---END_FOLLOW_UP---/gi, '')
    .replace(/---TRIAGE_RESULT---[\s\S]*?---END_TRIAGE---/gi, '')
    .trim()
}

/**
 * Build a clinician-ready assessment object.
 */
export function buildAssessment({
  messages = [],
  llmParsed = null,
  protocol = null,
  merge = null,
  model = null,
}) {
  const userTurns = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)

  return {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    model: model || process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
    protocolEngine: protocol?.engine || 'meditriage-protocol-v1',
    chiefComplaint: userTurns[0] || null,
    transcriptExcerpt: userTurns.slice(-6),
    urgency: {
      final: merge?.urgency || llmParsed?.urgency || protocol?.urgency || null,
      source: merge?.source || 'unknown',
      llm: merge?.llmUrgency || llmParsed?.urgency || null,
      protocol: merge?.protocolUrgency || protocol?.urgency || null,
      overridden: Boolean(merge?.overridden),
      matchedRules: merge?.matched || protocol?.matched || [],
    },
    summary: llmParsed?.summary || null,
    reasoning: llmParsed?.reasoning || null,
    guidance: llmParsed?.guidance || null,
    watchFor: llmParsed?.watchFor || null,
    disclaimer:
      'Not a diagnosis. Advisory triage only. Seek emergency care for life-threatening symptoms.',
  }
}
