import { supabase } from './supabase'

/**
 * Clinic inbox helpers (frontend + RLS).
 * Falls back to demo org fetch via API when Supabase admin isn't needed.
 */

export async function fetchOrgBySlug(slug) {
  const clean = String(slug || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
  if (!clean) return null

  if (supabase) {
    const { data } = await supabase
      .from('organizations')
      .select('id, slug, name, logo_url, primary_color, tagline, disclaimer')
      .eq('slug', clean)
      .maybeSingle()
    if (data) return data
  }

  const res = await fetch(`/api/orgs/${clean}`)
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'Org not found')
  return json.org
}

export async function fetchMyMemberships(userId) {
  if (!supabase || !userId) return []
  const { data, error } = await supabase
    .from('org_members')
    .select('role, org_id, organizations(id, slug, name, primary_color, tagline)')
    .eq('user_id', userId)
  if (error) throw error
  return (data || []).map((row) => ({
    role: row.role,
    org: row.organizations,
  }))
}

export async function fetchClinicCases(orgId) {
  if (!supabase || !orgId) return []
  const { data, error } = await supabase
    .from('clinic_cases')
    .select(
      'id, title, urgency, status, assessment, shared_at, updated_at, notes, conversation_id'
    )
    .eq('org_id', orgId)
    .order('shared_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data || []
}

export async function updateCaseStatus(caseId, status, notes) {
  if (!supabase || !caseId) return false
  const patch = { status }
  if (typeof notes === 'string') patch.notes = notes
  const { error } = await supabase
    .from('clinic_cases')
    .update(patch)
    .eq('id', caseId)
  if (error) throw error
  return true
}

export async function shareCaseWithClinic({
  orgSlug = 'demo-clinic',
  conversationId,
  title,
  urgency,
  assessment,
  userId,
}) {
  if (!supabase || !userId || !assessment) {
    throw new Error('Sign in required to share with a clinic')
  }

  const org = await fetchOrgBySlug(orgSlug)
  if (!org?.id) {
    throw new Error(
      'Clinic org not found in database. Run schema-phase3.sql in Supabase first.'
    )
  }

  const { data, error } = await supabase
    .from('clinic_cases')
    .insert({
      org_id: org.id,
      conversation_id: conversationId || null,
      patient_user_id: userId,
      title: title || 'Shared assessment',
      urgency: urgency || assessment?.urgency?.final || null,
      assessment,
      status: 'new',
    })
    .select('id')
    .single()

  if (error) throw error
  return data
}
