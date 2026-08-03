import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import cors from 'cors'
import { createAdvisoryCall } from './bey/client.js'
import { appendAuditEvent } from './triage/audit.js'
import { findNearbyCare } from './care/facilities.js'
import v1Router, { runTriagePipeline, normalizeMessages } from './api/v1.js'
import { getSupabaseAdmin } from './api/keys.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const app = express()
const PORT = Number(process.env.API_PORT) || 3001

app.use(cors({ origin: true }))
app.use(express.json({ limit: '64kb' }))

app.use((err, _req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON' })
  }
  return next(err)
})

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'MediTriage API',
    openrouter: Boolean(process.env.OPENROUTER_API_KEY?.trim()),
    protocol: 'meditriage-protocol-v1',
    publicApi: '/api/v1',
    careRouting: true,
    supabaseAdmin: Boolean(getSupabaseAdmin()),
  })
})

/** Public partner API */
app.use('/api/v1', v1Router)

/**
 * POST /api/chat
 */
app.post('/api/chat', async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const messages = normalizeMessages(body.messages)

  if (messages.length === 0) {
    return res.status(400).json({ error: 'messages required' })
  }

  const locale = typeof body.locale === 'string' ? body.locale.slice(0, 2) : 'en'
  const brandName =
    typeof body.brandName === 'string' ? body.brandName.slice(0, 80) : undefined

  try {
    const model =
      process.env.OPENROUTER_MODEL?.trim() || 'openai/gpt-4o-mini'
    const result = await runTriagePipeline({
      messages,
      locale,
      model,
      brandName,
    })

    const auditId = appendAuditEvent({
      type: 'chat_turn',
      model,
      locale,
      messageCount: messages.length,
      lastUser:
        [...messages].reverse().find((m) => m.role === 'user')?.content ||
        null,
      llmUrgency: result.finalParsed?.urgency || null,
      protocolUrgency: result.protocol.urgency,
      finalUrgency: result.merge.urgency,
      source: result.merge.source,
      overridden: result.merge.overridden,
      matchedRules: result.merge.matched,
      hasTriageResult: Boolean(result.finalParsed),
    })

    res.json({
      text: result.text,
      assessment: result.assessment,
      protocol: {
        engine: result.protocol.engine,
        urgency: result.protocol.urgency,
        matched: result.protocol.matched,
      },
      merge: result.merge,
      auditId,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Chat failed'
    console.error('[chat]', message)
    appendAuditEvent({ type: 'chat_error', error: message })
    res.status(500).json({ error: message })
  }
})

/**
 * GET /api/care/nearby?lat=&lng=&urgency=
 */
app.get('/api/care/nearby', async (req, res) => {
  try {
    const care = await findNearbyCare({
      lat: req.query.lat != null ? Number(req.query.lat) : undefined,
      lng: req.query.lng != null ? Number(req.query.lng) : undefined,
      urgency: typeof req.query.urgency === 'string' ? req.query.urgency : undefined,
    })
    res.json(care)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Care routing failed'
    res.status(500).json({ error: message })
  }
})

/**
 * GET /api/orgs/:slug — public white-label branding
 */
app.get('/api/orgs/:slug', async (req, res) => {
  const slug = String(req.params.slug || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 64)
  if (!slug) return res.status(400).json({ error: 'slug required' })

  const db = getSupabaseAdmin()
  if (db) {
    const { data, error } = await db
      .from('organizations')
      .select('id, slug, name, logo_url, primary_color, tagline, disclaimer')
      .eq('slug', slug)
      .maybeSingle()
    if (!error && data) return res.json({ org: data })
  }

  // Fallback demo branding without DB
  if (slug === 'demo-clinic') {
    return res.json({
      org: {
        id: null,
        slug: 'demo-clinic',
        name: 'Demo Clinic',
        logo_url: null,
        primary_color: '#0f766e',
        tagline: 'Partner triage for Demo Clinic',
        disclaimer:
          'Shared assessments are advisory only — not a diagnosis.',
      },
    })
  }

  res.status(404).json({ error: 'Organization not found' })
})

/**
 * POST /api/assessment/export
 */
app.post('/api/assessment/export', (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const assessment =
    body.assessment && typeof body.assessment === 'object'
      ? body.assessment
      : null

  if (!assessment) {
    return res.status(400).json({ error: 'assessment required' })
  }

  const exported = {
    ...assessment,
    exportedAt: new Date().toISOString(),
    conversationId:
      typeof body.conversationId === 'string' ? body.conversationId : null,
  }

  const auditId = appendAuditEvent({
    type: 'assessment_export',
    conversationId: exported.conversationId,
    urgency: exported?.urgency?.final || null,
  })

  res.json({ assessment: exported, auditId })
})

function assertAuthorized(req, res) {
  const secret = process.env.BEY_CALL_SECRET?.trim()
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      res.status(401).json({
        error: 'Unauthorized: BEY_CALL_SECRET must be configured in production.',
      })
      return false
    }
    return true
  }

  const provided =
    req.get('x-bey-call-secret') ||
    (req.get('authorization') || '').replace(/^Bearer\s+/i, '')

  if (provided !== secret) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }
  return true
}

app.post('/api/bey/create-advisory-call', async (req, res) => {
  if (!assertAuthorized(req, res)) return

  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const riskLevel =
    typeof body.risk_level === 'string' ? body.risk_level : 'Moderate'
  const suggestions = Array.isArray(body.suggestions)
    ? body.suggestions.filter((s) => s && typeof s.suggestion === 'string')
    : []

  try {
    const result = await createAdvisoryCall(riskLevel, suggestions)
    if (result.mode === 'hosted') {
      return res.json({
        mode: 'hosted',
        join_url: result.join_url,
        agent_id: result.agent_id,
        knowledge_file_id: result.knowledge_file_id,
      })
    }
    res.json({
      mode: 'livekit',
      livekit_url: result.livekit_url,
      livekit_token: result.livekit_token,
      knowledge_file_id: result.knowledge_file_id,
    })
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'Failed to create advisory call'
    console.error('[bey/create-advisory-call]', message)
    res.status(500).json({ error: message })
  }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MediTriage API on http://localhost:${PORT}`)
}).on('error', (err) => {
  console.error('[api] failed to start:', err.message)
  process.exit(1)
})
