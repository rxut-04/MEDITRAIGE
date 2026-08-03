import { supabase } from './supabase'

/**
 * Cloud persistence for signed-in users.
 * Every function is a no-op (returns null/false) when Supabase is unavailable,
 * so the app keeps working in local-only mode.
 */

function ok() {
  return Boolean(supabase)
}

/** Load all conversations + messages for the signed-in user. */
export async function fetchConversations(userId) {
  if (!ok() || !userId) return null

  const { data: rows, error } = await supabase
    .from('conversations')
    .select('id, title, triage_result, assessment, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  if (!rows?.length) return []

  const ids = rows.map((row) => row.id)
  const { data: messageRows, error: messageError } = await supabase
    .from('messages')
    .select('id, conversation_id, role, content, show_urgency, created_at')
    .in('conversation_id', ids)
    .order('created_at', { ascending: true })

  if (messageError) throw messageError

  const grouped = new Map()
  for (const message of messageRows || []) {
    const list = grouped.get(message.conversation_id) || []
    list.push({
      id: message.id,
      role: message.role,
      content: message.content,
      showUrgency: message.show_urgency,
      stream: false,
    })
    grouped.set(message.conversation_id, list)
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    triageResult: row.triage_result || null,
    assessment: row.assessment || null,
    pendingFollowUp: null,
    multiSelections: [],
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
    messages: grouped.get(row.id) || [],
  }))
}

/** Create or update a conversation row. */
export async function upsertConversation(userId, conversation) {
  if (!ok() || !userId || !conversation) return false

  const { error } = await supabase.from('conversations').upsert(
    {
      id: conversation.id,
      user_id: userId,
      title: conversation.title || 'New assessment',
      triage_result: conversation.triageResult || null,
      assessment: conversation.assessment || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )

  if (error) throw error
  return true
}

/** Insert one message (idempotent by id). */
export async function saveMessage(userId, conversationId, message) {
  if (!ok() || !userId || !conversationId || !message) return false

  const { error } = await supabase.from('messages').upsert(
    {
      id: message.id,
      conversation_id: conversationId,
      user_id: userId,
      role: message.role,
      content: message.content,
      show_urgency: Boolean(message.showUrgency),
    },
    { onConflict: 'id' }
  )

  if (error) throw error
  return true
}

export async function deleteConversationRow(userId, conversationId) {
  if (!ok() || !userId || !conversationId) return false

  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId)
    .eq('user_id', userId)

  if (error) throw error
  return true
}

export async function saveAssessmentExport(userId, conversationId, payload) {
  if (!ok() || !userId || !payload) return false

  const { error } = await supabase.from('assessment_exports').insert({
    conversation_id: conversationId || null,
    user_id: userId,
    urgency: payload?.urgency?.final || null,
    payload,
  })

  if (error) throw error
  return true
}
