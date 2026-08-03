import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

let admin = null

export function getSupabaseAdmin() {
  if (admin) return admin
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return admin
}

export function hashApiKey(raw) {
  return crypto.createHash('sha256').update(String(raw)).digest('hex')
}

export function generateApiKey() {
  const raw = `mt_live_${crypto.randomBytes(24).toString('hex')}`
  return {
    raw,
    prefix: raw.slice(0, 12),
    hash: hashApiKey(raw),
  }
}

/**
 * Resolve org from Bearer token.
 * Supports:
 *  1) Env TRIAGE_API_KEYS=mt_live_xxx:demo-clinic,mt_live_yyy:other
 *  2) Hashed keys in public.api_keys (needs service role)
 */
export async function resolveApiKey(authorizationHeader) {
  const token = String(authorizationHeader || '')
    .replace(/^Bearer\s+/i, '')
    .trim()
  if (!token || !token.startsWith('mt_')) {
    return { ok: false, status: 401, error: 'Missing or invalid API key' }
  }

  const envKeys = String(process.env.TRIAGE_API_KEYS || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  for (const entry of envKeys) {
    const [key, slug] = entry.split(':')
    if (key && key === token) {
      return {
        ok: true,
        org: { slug: slug || 'env', id: null, name: slug || 'Env key org' },
        via: 'env',
      }
    }
  }

  const db = getSupabaseAdmin()
  if (!db) {
    return {
      ok: false,
      status: 401,
      error:
        'API key not recognized. Set TRIAGE_API_KEYS or SUPABASE_SERVICE_ROLE_KEY.',
    }
  }

  const { data, error } = await db
    .from('api_keys')
    .select('id, org_id, revoked_at, organizations(id, slug, name)')
    .eq('key_hash', hashApiKey(token))
    .maybeSingle()

  if (error || !data || data.revoked_at) {
    return { ok: false, status: 401, error: 'Invalid or revoked API key' }
  }

  await db
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)

  const org = data.organizations
  return {
    ok: true,
    org: {
      id: org?.id || data.org_id,
      slug: org?.slug || null,
      name: org?.name || 'Organization',
    },
    via: 'db',
    apiKeyId: data.id,
  }
}
