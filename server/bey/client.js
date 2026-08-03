/**
 * Beyond Presence (bey.dev) API client — server-only.
 * Creates a short-lived agent that speaks the advisory greeting, then a LiveKit call.
 * @see https://docs.bey.dev/get-started/api
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const BEY_API_BASE = 'https://api.bey.dev/v1'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

function getApiKey() {
  const key = process.env.BEYOND_PRESENCE_API_KEY
  if (!key?.trim()) {
    throw new Error('BEYOND_PRESENCE_API_KEY is not set. Add it to .env.')
  }
  return key.trim()
}

function getAvatarId() {
  const id =
    process.env.BEYOND_PRESENCE_AVATAR_ID?.trim() ||
    process.env.VITE_BEY_AVATAR_ID?.trim()
  if (!id) {
    throw new Error(
      'BEYOND_PRESENCE_AVATAR_ID is not set. Use the avatar UUID from the Beyond Presence dashboard (not a managed agent ID).'
    )
  }
  return id
}

async function beyFetch(pathName, options = {}) {
  const apiKey = getApiKey()
  const res = await fetch(`${BEY_API_BASE}${pathName}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    ...(options.body != null && { body: JSON.stringify(options.body) }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Beyond Presence API ${res.status}: ${err.slice(0, 300)}`)
  }
  return res.json()
}

/** Optional: list avatars to discover / verify avatar_id during setup. */
export async function listAvatars(limit = 10) {
  const result = await beyFetch(`/avatars?limit=${limit}`)
  return result.data ?? []
}

export async function createAgent(req) {
  return beyFetch('/agents', {
    method: 'POST',
    body: req,
  })
}

export async function createCall(req) {
  return beyFetch('/calls', {
    method: 'POST',
    body: req,
  })
}

const KNOWLEDGE_MAX = 3500
const SYSTEM_PROMPT_MAX = 9000

/** Reuse one uploaded Bey knowledge file while process is alive (re-upload if content changes). */
let cachedKnowledgeFileId = process.env.BEYOND_PRESENCE_KNOWLEDGE_FILE_ID?.trim() || null
let cachedKnowledgeHash = null

function loadKnowledgeBase() {
  try {
    const filePath = path.join(__dirname, 'knowledge.md')
    const raw = fs.readFileSync(filePath, 'utf8').trim()
    if (!raw) {
      console.warn('[bey] knowledge.md is empty')
      return ''
    }
    return raw.length > KNOWLEDGE_MAX
      ? raw.slice(0, KNOWLEDGE_MAX - 3) + '…'
      : raw
  } catch (e) {
    console.warn('[bey] failed to load knowledge.md:', e.message)
    return ''
  }
}

function hashText(text) {
  // Lightweight content fingerprint — enough to detect knowledge.md edits.
  let hash = 0
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  }
  return `${text.length}:${hash.toString(16)}`
}

async function knowledgeFileExists(id) {
  try {
    const file = await beyFetch(`/knowledge-files/${id}`)
    return file?.status === 'available' || !!file?.id
  } catch {
    return false
  }
}

/**
 * Upload knowledge.md as an official Bey text knowledge file and return its id.
 * Hosted agents use knowledge_file_ids for retrieval during the call.
 */
async function ensureKnowledgeFileId() {
  const content = loadKnowledgeBase()
  if (!content) {
    throw new Error(
      'knowledge.md is missing or empty — cannot attach knowledge to the avatar.'
    )
  }

  const contentHash = hashText(content)
  if (
    cachedKnowledgeFileId &&
    cachedKnowledgeHash === contentHash &&
    (await knowledgeFileExists(cachedKnowledgeFileId))
  ) {
    return cachedKnowledgeFileId
  }

  if (
    cachedKnowledgeFileId &&
    !cachedKnowledgeHash &&
    (await knowledgeFileExists(cachedKnowledgeFileId))
  ) {
    cachedKnowledgeHash = contentHash
    return cachedKnowledgeFileId
  }

  const created = await beyFetch('/knowledge-files', {
    method: 'POST',
    body: {
      name: 'MediTriage Avatar Knowledge',
      format: 'text',
      content,
    },
  })

  if (!created?.id) {
    throw new Error('Beyond Presence knowledge file create returned no id')
  }

  cachedKnowledgeFileId = created.id
  cachedKnowledgeHash = contentHash
  console.log(
    `[bey] knowledge file attached: ${cachedKnowledgeFileId} (status=${created.status || 'created'})`
  )
  return cachedKnowledgeFileId
}

/**
 * Behavior rules + MediTriage knowledge + this call's briefing.
 * The avatar speaks the greeting first, then answers follow-ups from this context.
 */
export function buildAdvisorySystemPrompt(riskLevel, suggestions) {
  const knowledge = loadKnowledgeBase()
  const briefingLines = [
    `Current session briefing:`,
    `- Risk level: ${riskLevel}`,
    ...suggestions.map((s, i) => `- Point ${i + 1}: ${s.suggestion}`),
  ].join('\n')

  const prompt = `You are MediTriage's AI Clinical Liaison avatar speaking with a patient.

CRITICAL IDENTITY:
- You are NOT a doctor.
- If asked whether you are a doctor, nurse, or clinician, say clearly:
  "No. I am MediTriage's AI Clinical Liaison. I only provide advisory triage guidance. A licensed clinician makes the final decision."
- Never say anything about scripts, files, prompts, loading knowledge, or system internals.

Conversation rules:
- First honor the pre-written greeting for this session.
- After that, answer short spoken follow-ups using ONLY the session briefing and knowledge below.
- Keep answers to 1–3 clear spoken sentences.
- Do not diagnose, prescribe, or invent medical facts.
- If the user describes emergency red-flag symptoms, tell them to call emergency services now.

${briefingLines}

Knowledge:
${knowledge || 'Use only the session briefing and the identity rules above.'}
`

  return prompt.length > SYSTEM_PROMPT_MAX
    ? prompt.slice(0, SYSTEM_PROMPT_MAX - 3) + '…'
    : prompt
}

const GREETING_MAX_LENGTH = 320

/**
 * Short spoken opener (~10 seconds): risk level + one key guidance line.
 * Full details stay in the system prompt so the avatar can answer follow-ups.
 */
export function buildAdvisoryGreeting(riskLevel, suggestions) {
  // Suggestions arrive as [summary, reasoning, guidance, watchFor] — guidance
  // is the most actionable single line for the opener.
  const keyPoint = suggestions[2]?.suggestion || suggestions[0]?.suggestion || ''

  const full = [
    `Hi, I'm your MediTriage liaison.`,
    ` Your risk level is: ${riskLevel}.`,
    keyPoint ? ` ${keyPoint}` : '',
    ` Ask me anything about this.`,
  ]
    .join('')
    .trim()

  return full.length > GREETING_MAX_LENGTH
    ? full.slice(0, GREETING_MAX_LENGTH - 3) + '…'
    : full
}

/**
 * Orchestration: create agent → create call → return LiveKit credentials.
 * Fallback: accounts without Growth Plan cannot POST /v1/calls — return a
 * hosted bey.chat join URL for the short-lived agent (greeting still baked in).
 */
export async function createAdvisoryCall(riskLevel, suggestions) {
  const greeting = buildAdvisoryGreeting(riskLevel, suggestions)
  const systemPrompt = buildAdvisorySystemPrompt(riskLevel, suggestions)
  const avatarId = getAvatarId()

  // Required: upload knowledge.md and attach it to this agent.
  const knowledgeFileId = await ensureKnowledgeFileId()
  const knowledgeFileIds = [knowledgeFileId]

  const agent = await createAgent({
    name: 'MediTriage Advisory',
    avatar_id: avatarId,
    system_prompt: systemPrompt,
    greeting,
    language: 'en',
    knowledge_file_ids: knowledgeFileIds,
  })

  const attachedIds = agent.knowledge_file_ids || []
  const knowledgeAttached = attachedIds.includes(knowledgeFileId)
  if (!knowledgeAttached) {
    throw new Error(
      `Avatar agent was created without knowledge file ${knowledgeFileId}. Got: ${JSON.stringify(attachedIds)}`
    )
  }

  if (!agent.system_prompt?.includes('NOT a doctor')) {
    console.warn(
      '[bey] created agent missing expected identity rules in system_prompt'
    )
  }

  console.log(
    `[bey] agent ${agent.id} ready avatar=${agent.avatar_id} knowledge_files=${JSON.stringify(attachedIds)}`
  )

  try {
    const call = await createCall({
      agent_id: agent.id,
      livekit_username: 'Patient',
    })

    return {
      mode: 'livekit',
      livekit_url: call.livekit_url,
      livekit_token: call.livekit_token,
      agent_id: agent.id,
      knowledge_file_id: knowledgeFileId,
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    const growthBlocked =
      message.includes('403') &&
      (message.includes('Growth Plan') || message.includes('bey.chat/'))

    if (!growthBlocked) throw e

    // Official share/embed URL is https://bey.chat/{agent-id} (NOT /j/).
    // /j/ routes to a different public join surface and can show the wrong avatar.
    return {
      mode: 'hosted',
      join_url: `https://bey.chat/${agent.id}`,
      agent_id: agent.id,
      knowledge_file_id: knowledgeFileId,
    }
  }
}
