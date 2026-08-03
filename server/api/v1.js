import { Router } from 'express'
import { chatWithOpenRouter } from '../chat/openrouter.js'
import {
  evaluateProtocol,
  mergeUrgency,
  rewriteTriageBlock,
} from '../triage/protocol.js'
import { parseTriageResult, buildAssessment } from '../triage/parse.js'
import { appendAuditEvent } from '../triage/audit.js'
import { findNearbyCare } from '../care/facilities.js'
import { resolveApiKey, getSupabaseAdmin } from './keys.js'

const router = Router()

function normalizeMessages(rawMessages) {
  return (Array.isArray(rawMessages) ? rawMessages : [])
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim()
    )
    .map((m) => ({
      role: m.role,
      content: m.content.trim().slice(0, 4000),
    }))
    .slice(-24)
}

async function runTriagePipeline({ messages, locale, model, brandName }) {
  let text = await chatWithOpenRouter({
    messages,
    model,
    locale,
    brandName,
  })

  const protocol = evaluateProtocol(messages)
  const llmParsed = parseTriageResult(text)
  const merge = mergeUrgency(llmParsed?.urgency, protocol)

  if (
    llmParsed ||
    merge.overridden ||
    merge.urgency === 'CALL_EMERGENCY' ||
    merge.urgency === 'HOSPITAL_NOW'
  ) {
    text = rewriteTriageBlock(text, merge, llmParsed)
  }

  const finalParsed = parseTriageResult(text)
  const assessment = buildAssessment({
    messages,
    llmParsed: finalParsed,
    protocol,
    merge,
    model,
  })

  return { text, assessment, protocol, merge, finalParsed }
}

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: 'v1',
    service: 'MediTriage Public API',
  })
})

/**
 * POST /api/v1/triage
 * Authorization: Bearer mt_live_...
 */
router.post('/triage', async (req, res) => {
  const auth = await resolveApiKey(req.get('authorization'))
  if (!auth.ok) {
    return res.status(auth.status || 401).json({ error: auth.error })
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const messages = normalizeMessages(body.messages)
  if (!messages.length) {
    return res.status(400).json({ error: 'messages required' })
  }

  const locale = typeof body.locale === 'string' ? body.locale : 'en'
  const includeCare = body.includeCare !== false
  const model =
    process.env.OPENROUTER_MODEL?.trim() || 'openai/gpt-4o-mini'

  try {
    const result = await runTriagePipeline({
      messages,
      locale,
      model,
      brandName: auth.org?.name || 'MediTriage',
    })

    let care = null
    if (includeCare && result.merge?.urgency) {
      care = await findNearbyCare({
        urgency: result.merge.urgency,
        lat: Number(body.lat),
        lng: Number(body.lng),
      })
    }

    const requestId = appendAuditEvent({
      type: 'public_api_triage',
      org: auth.org?.slug || null,
      via: auth.via,
      messageCount: messages.length,
      finalUrgency: result.merge.urgency,
      locale,
    })

    res.json({
      requestId,
      org: auth.org,
      text: result.text,
      assessment: result.assessment,
      protocol: {
        engine: result.protocol.engine,
        urgency: result.protocol.urgency,
        matched: result.protocol.matched,
      },
      merge: result.merge,
      care,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Triage failed'
    console.error('[api/v1/triage]', message)
    appendAuditEvent({ type: 'public_api_error', error: message })
    res.status(500).json({ error: message })
  }
})

/**
 * POST /api/v1/cases — push a finished assessment into a clinic inbox (API)
 */
router.post('/cases', async (req, res) => {
  const auth = await resolveApiKey(req.get('authorization'))
  if (!auth.ok) {
    return res.status(auth.status || 401).json({ error: auth.error })
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const assessment =
    body.assessment && typeof body.assessment === 'object'
      ? body.assessment
      : null
  if (!assessment) {
    return res.status(400).json({ error: 'assessment required' })
  }

  const db = getSupabaseAdmin()
  if (!db || !auth.org?.id) {
    return res.status(503).json({
      error:
        'Case ingest requires SUPABASE_SERVICE_ROLE_KEY and a DB-backed API key',
    })
  }

  const { data, error } = await db
    .from('clinic_cases')
    .insert({
      org_id: auth.org.id,
      title:
        typeof body.title === 'string'
          ? body.title.slice(0, 120)
          : 'API assessment',
      urgency: assessment?.urgency?.final || body.urgency || null,
      assessment,
      status: 'new',
    })
    .select('id, shared_at, urgency, status')
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  res.status(201).json({ case: data })
})

export { runTriagePipeline, normalizeMessages }
export default router
