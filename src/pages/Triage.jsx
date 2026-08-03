import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowLeft,
  Download,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Trash2,
  Video,
  X,
} from 'lucide-react'
import MessageBubble from '../components/MessageBubble'
import AIVideoAvatar from '../components/AIVideoAvatar'
import ThemeToggle from '../components/ThemeToggle'
import TriageOptionCard from '../components/TriageOptionCard'
import UrgencyBadge from '../components/UrgencyBadge'
import AccountMenu from '../components/AccountMenu'
import CareRoutingCard from '../components/CareRoutingCard'
import LanguageToggle from '../components/LanguageToggle'
import { MediTriageChatInput } from '../components/ui/v0-ai-chat'
import { BRAND } from '../constants'
import { cn } from '../lib/utils'
import { useAuth } from '../lib/AuthProvider'
import { useLocale } from '../lib/LocaleProvider'
import { useBrand } from '../lib/BrandProvider'
import {
  deleteConversationRow,
  fetchConversations,
  saveAssessmentExport,
  saveMessage,
  upsertConversation,
} from '../lib/cloudStore'
import {
  parseFollowUp,
  parseTriageResult,
  stripProtocolBlocks,
} from '../lib/triageIntake'

const HISTORY_KEY = 'meditriage-conversations-v3'
const DEFAULT_GREETING =
  "Welcome to MediTriage. I'm your AI Clinical Liaison. Tell me what's going on — when you're ready, describe your symptoms and I'll ask clear follow-ups."

/** Always UUID-shaped so rows map cleanly onto Postgres uuid columns. */
function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8
    return value.toString(16)
  })
}

function createConversation(greeting = DEFAULT_GREETING, title = 'New assessment') {
  return {
    id: makeId(),
    title,
    updatedAt: Date.now(),
    triageResult: null,
    assessment: null,
    pendingFollowUp: null,
    multiSelections: [],
    messages: [
      {
        id: makeId(),
        role: 'assistant',
        content: greeting,
        stream: true,
      },
    ],
  }
}

function normalizeConversation(conversation) {
  return {
    ...conversation,
    assessment: conversation.assessment || null,
    pendingFollowUp: conversation.pendingFollowUp || null,
    multiSelections: conversation.multiSelections || [],
    messages: (conversation.messages || []).map((message) => ({
      ...message,
      stream: false,
    })),
  }
}

function loadConversations() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    if (Array.isArray(saved) && saved.length) {
      return saved.map(normalizeConversation)
    }
  } catch {
    // Corrupt or unavailable storage should not prevent a new assessment.
  }
  return [createConversation()]
}

function ConversationSidebar({
  open,
  conversations,
  activeId,
  onToggle,
  onHome,
  onNew,
  onSelect,
  onDelete,
  brandName,
  newLabel,
  recentLabel,
  clinicHref,
  clinicLabel,
}) {
  return (
    <aside
      className={cn(
        'relative z-40 flex h-full shrink-0 flex-col border-r border-obsidian/10 bg-muted transition-[width] duration-300',
        open ? 'w-[280px]' : 'w-[72px]'
      )}
    >
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-obsidian/10',
          open ? 'justify-between px-4' : 'justify-center'
        )}
      >
        {open && (
          <button
            type="button"
            onClick={onHome}
            className="flex min-w-0 items-center gap-2.5"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-obsidian text-paper">
              <Plus size={15} strokeWidth={3} />
            </span>
            <span className="truncate font-serif text-lg font-semibold">
              {brandName || BRAND.name}
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-obsidian/55 transition-colors hover:bg-obsidian/[0.06] hover:text-obsidian"
        >
          {open ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>
      </div>

      <div className={cn('px-3 pt-3', !open && 'px-2')}>
        <button
          type="button"
          onClick={onNew}
          className={cn(
            'flex h-11 w-full items-center rounded-xl bg-paper text-sm font-medium text-obsidian shadow-sm ring-1 ring-obsidian/[0.08] transition hover:bg-paper/70',
            open ? 'gap-3 px-3' : 'justify-center'
          )}
        >
          <Plus size={17} />
          {open && <span>{newLabel || 'New assessment'}</span>}
        </button>
        {open && clinicHref && (
          <a
            href={clinicHref}
            className="mt-2 flex h-10 w-full items-center rounded-xl border border-obsidian/12 px-3 text-[11px] font-medium text-obsidian/65 transition hover:border-obsidian/25"
          >
            {clinicLabel || 'Clinic'}
          </a>
        )}
      </div>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar">
        {open && (
          <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-obsidian/35">
            {recentLabel || 'Recent conversations'}
          </div>
        )}
        <div className="space-y-1">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                'group relative flex items-center rounded-xl transition-colors',
                activeId === conversation.id
                  ? 'bg-paper shadow-sm ring-1 ring-obsidian/[0.08]'
                  : 'hover:bg-obsidian/[0.04]',
                open ? 'px-3' : 'justify-center px-0'
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(conversation.id)}
                title={conversation.title}
                className={cn(
                  'flex h-11 min-w-0 flex-1 items-center text-left',
                  open ? 'gap-3 pr-7' : 'justify-center'
                )}
              >
                <MessageSquare
                  size={16}
                  className={cn(
                    'shrink-0',
                    activeId === conversation.id
                      ? 'text-accent'
                      : 'text-obsidian/40'
                  )}
                />
                {open && (
                  <span className="truncate text-[13px] text-obsidian/75">
                    {conversation.title}
                  </span>
                )}
              </button>
              {open && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDelete(conversation.id)
                  }}
                  aria-label={`Delete ${conversation.title}`}
                  title="Delete chat"
                  className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-lg text-obsidian/30 opacity-0 transition hover:bg-red-50 hover:text-red-500 focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div
        className={cn(
          'border-t border-obsidian/10 p-3',
          !open && 'flex justify-center px-2'
        )}
      >
        <AccountMenu collapsed={!open} />
      </div>
    </aside>
  )
}

function AvatarDialog({ open, onClose, triageResult }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close avatar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-obsidian/45 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed left-1/2 top-1/2 z-[201] h-[min(720px,88vh)] w-[min(440px,92vw)] -translate-x-1/2 -translate-y-1/2"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute -right-3 -top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-paper text-obsidian shadow-xl transition hover:scale-105"
            >
              <X size={18} />
            </button>
            <AIVideoAvatar triageResult={triageResult} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default function Triage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { locale, t } = useLocale()
  const { brand } = useBrand()
  const localeRef = useRef(locale)
  const brandRef = useRef(brand)
  localeRef.current = locale
  brandRef.current = brand
  const initialConversations = useRef(null)
  if (!initialConversations.current) {
    initialConversations.current = loadConversations()
  }

  const [conversations, setConversations] = useState(
    initialConversations.current
  )
  const [activeId, setActiveId] = useState(
    initialConversations.current[0].id
  )
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sendQueue, setSendQueue] = useState([])
  const [error, setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const bottomRef = useRef(null)
  const conversationsRef = useRef(conversations)
  const activeIdRef = useRef(activeId)
  const loadingRef = useRef(false)
  const queueRef = useRef([])
  const userIdRef = useRef(null)

  conversationsRef.current = conversations
  activeIdRef.current = activeId
  userIdRef.current = user?.id || null

  const activeConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === activeId) ||
      conversations[0],
    [activeId, conversations]
  )

  // Pull cloud history once a session exists; fall back silently to local.
  useEffect(() => {
    if (!user?.id) return
    let active = true

    fetchConversations(user.id)
      .then((cloud) => {
        if (!active || !cloud) return
        if (cloud.length === 0) {
          // First cloud login — push the current local thread up.
          const local = conversationsRef.current[0]
          if (local && local.messages.some((m) => m.role === 'user')) {
            void upsertConversation(user.id, local).then(() =>
              Promise.all(
                local.messages.map((message) =>
                  saveMessage(user.id, local.id, message)
                )
              )
            )
          }
          return
        }
        setConversations(cloud)
        setActiveId(cloud[0].id)
      })
      .catch((cloudError) => {
        console.warn('[cloud] history load failed', cloudError?.message)
      })

    return () => {
      active = false
    }
  }, [user?.id])

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(conversations))
    } catch {
      // Chat remains usable when browser storage is unavailable.
    }
  }, [conversations])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConversation?.messages, loading])

  const updateActiveConversation = useCallback(
    (updater) => {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === activeId
            ? updater(conversation)
            : conversation
        )
      )
    },
    [activeId]
  )

  const startNewConversation = () => {
    const next = createConversation(t('greeting'), t('newAssessment'))
    setConversations((current) => [next, ...current])
    setActiveId(next.id)
    setInput('')
    setSendQueue([])
    queueRef.current = []
    setError(null)
    setLoading(false)
    loadingRef.current = false
  }

  const selectConversation = (id) => {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id
          ? {
              ...conversation,
              messages: conversation.messages.map((message) => ({
                ...message,
                stream: false,
              })),
            }
          : conversation
      )
    )
    setActiveId(id)
    setSendQueue([])
    queueRef.current = []
    setError(null)
  }

  const deleteConversation = (id) => {
    const target = conversations.find((conversation) => conversation.id === id)
    const hasContent = (target?.messages?.length || 0) > 1
    if (
      hasContent &&
      !window.confirm('Delete this chat? This cannot be undone.')
    ) {
      return
    }

    if (id === activeId) {
      setInput('')
      setSendQueue([])
      queueRef.current = []
      setError(null)
      setLoading(false)
      loadingRef.current = false
    }

    setConversations((current) => {
      const remaining = current.filter(
        (conversation) => conversation.id !== id
      )
      if (id === activeId) {
        const next = remaining[0] || createConversation()
        setActiveId(next.id)
        return remaining.length ? remaining : [next]
      }
      return remaining
    })

    if (userIdRef.current) {
      deleteConversationRow(userIdRef.current, id).catch((cloudError) =>
        console.warn('[cloud] delete failed', cloudError?.message)
      )
    }
  }

  const finishStreaming = useCallback(
    (messageId) => {
      updateActiveConversation((conversation) => ({
        ...conversation,
        messages: conversation.messages.map((message) =>
          message.id === messageId ? { ...message, stream: false } : message
        ),
      }))
    },
    [updateActiveConversation]
  )

  const pendingFollowUp = activeConversation?.pendingFollowUp || null
  const multiSelections = activeConversation?.multiSelections || []

  /** Best-effort cloud write; local state stays authoritative on failure. */
  const syncConversation = useCallback(async (conversation, newMessages = []) => {
    const userId = userIdRef.current
    if (!userId || !conversation) return

    try {
      await upsertConversation(userId, conversation)
      for (const message of newMessages) {
        await saveMessage(userId, conversation.id, message)
      }
    } catch (syncError) {
      console.warn('[cloud] sync failed', syncError?.message)
    }
  }, [])

  const dispatchUserMessage = useCallback(async (userMessage) => {
    const trimmed = userMessage.trim()
    if (!trimmed) return

    const conversationId = activeIdRef.current
    const snapshot =
      conversationsRef.current.find((item) => item.id === conversationId) ||
      null
    if (!snapshot) return

    const hasUserMessage = snapshot.messages.some(
      (message) => message.role === 'user'
    )
    const title = hasUserMessage
      ? undefined
      : trimmed.slice(0, 42) || 'New assessment'

    const historyForApi = [
      ...snapshot.messages
        .filter(
          (message) =>
            message.role === 'user' || message.role === 'assistant'
        )
        .map((message) => ({
          role: message.role,
          content: message.content,
        })),
      { role: 'user', content: trimmed },
    ]

    const userMessageRow = {
      id: makeId(),
      role: 'user',
      content: trimmed,
      stream: false,
    }

    const withUser = {
      ...snapshot,
      ...(title ? { title } : {}),
      pendingFollowUp: null,
      multiSelections: [],
      updatedAt: Date.now(),
      messages: [
        ...snapshot.messages.map((message) => ({
          ...message,
          stream: false,
        })),
        userMessageRow,
      ],
    }

    conversationsRef.current = conversationsRef.current.map((item) =>
      item.id === conversationId ? withUser : item
    )
    setConversations(conversationsRef.current)

    void syncConversation(withUser, [
      ...(hasUserMessage ? [] : snapshot.messages),
      userMessageRow,
    ])

    loadingRef.current = true
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyForApi,
          locale: localeRef.current,
          brandName: brandRef.current?.name,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(
          data.error || `Clinical engine error ${response.status}`
        )
      }

      const agentText =
        typeof data.text === 'string' ? data.text : String(data.text || '')
      if (!agentText.trim()) {
        throw new Error('Empty response from clinical engine')
      }

      const parsed = parseTriageResult(agentText)
      const followUp = parseFollowUp(agentText)
      const displayText = stripProtocolBlocks(agentText) || agentText
      const assessment =
        data.assessment && typeof data.assessment === 'object'
          ? data.assessment
          : null
      const mergedResult = assessment?.urgency?.final
        ? {
            urgency: assessment.urgency.final,
            summary: assessment.summary || parsed?.summary || '',
            reasoning: assessment.reasoning || parsed?.reasoning || '',
            guidance: assessment.guidance || parsed?.guidance || '',
            watchFor: assessment.watchFor || parsed?.watchFor || '',
            source: assessment.urgency.source,
            overridden: assessment.urgency.overridden,
          }
        : parsed

      const latest =
        conversationsRef.current.find((item) => item.id === conversationId) ||
        withUser

      const assistantRow = {
        id: makeId(),
        role: 'assistant',
        content: displayText,
        stream: true,
        showUrgency: Boolean(mergedResult?.urgency || parsed?.urgency),
      }

      const withAssistant = {
        ...latest,
        ...(title ? { title } : {}),
        triageResult: mergedResult || latest.triageResult,
        assessment: assessment || latest.assessment,
        pendingFollowUp: followUp,
        multiSelections: [],
        updatedAt: Date.now(),
        messages: [...latest.messages, assistantRow],
      }

      conversationsRef.current = conversationsRef.current.map((item) =>
        item.id === conversationId ? withAssistant : item
      )
      setConversations(conversationsRef.current)

      void syncConversation(withAssistant, [assistantRow])
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Unable to reach the clinical engine'
      setError(message)

      const latest =
        conversationsRef.current.find((item) => item.id === conversationId) ||
        withUser

      const withError = {
        ...latest,
        pendingFollowUp: null,
        multiSelections: [],
        messages: [
          ...latest.messages,
          {
            id: makeId(),
            role: 'assistant',
            content:
              'I could not reach the clinical service. Please try again in a moment.',
            stream: true,
          },
        ],
      }

      conversationsRef.current = conversationsRef.current.map((item) =>
        item.id === conversationId ? withError : item
      )
      setConversations(conversationsRef.current)
    } finally {
      loadingRef.current = false
      setLoading(false)

      const remaining = queueRef.current
      if (remaining.length > 0) {
        const [next, ...rest] = remaining
        queueRef.current = rest
        setSendQueue(rest)
        await dispatchUserMessage(next.text)
      }
    }
  }, [])

  const enqueueOrSend = useCallback((text) => {
    const trimmed = String(text || '').trim()
    if (!trimmed) return

    if (loadingRef.current) {
      const item = { id: makeId(), text: trimmed }
      const next = [...queueRef.current, item]
      queueRef.current = next
      setSendQueue(next)
      return
    }

    void dispatchUserMessage(trimmed)
  }, [dispatchUserMessage])

  const sendMessage = () => {
    if (!input.trim()) return
    const userMessage = input.trim()
    setInput('')
    enqueueOrSend(userMessage)
  }

  const handleQuickPrompt = (label) => {
    enqueueOrSend(`I've been having ${label.toLowerCase()}.`)
  }

  const handleFollowUpSelect = (option) => {
    if (!pendingFollowUp) return

    if (pendingFollowUp.mode === 'multi') {
      if (loadingRef.current) return
      const catalog = pendingFollowUp.options
      let next
      if (option.exclusive) {
        next = [option.id]
      } else {
        const withoutExclusive = multiSelections.filter(
          (id) => !catalog.find((item) => item.id === id)?.exclusive
        )
        next = withoutExclusive.includes(option.id)
          ? withoutExclusive.filter((id) => id !== option.id)
          : [...withoutExclusive, option.id]
      }
      updateActiveConversation((conversation) => ({
        ...conversation,
        multiSelections: next,
      }))
      return
    }

    enqueueOrSend(option.label)
  }

  const continueMultiFollowUp = () => {
    if (!pendingFollowUp || !multiSelections.length) return
    const labels = multiSelections
      .map(
        (id) =>
          pendingFollowUp.options.find((option) => option.id === id)?.label ||
          id
      )
      .join(', ')
    enqueueOrSend(labels)
  }

  const exportAssessment = async () => {
    const assessment = activeConversation?.assessment
    if (!assessment) return

    try {
      const response = await fetch('/api/assessment/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment,
          conversationId: activeConversation.id,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Export failed')
      }

      const payload = data.assessment || assessment

      if (userIdRef.current) {
        saveAssessmentExport(
          userIdRef.current,
          activeConversation.id,
          payload
        ).catch((cloudError) =>
          console.warn('[cloud] export log failed', cloudError?.message)
        )
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `meditriage-assessment-${activeConversation.id.slice(0, 8)}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (exportError) {
      const message =
        exportError instanceof Error ? exportError.message : 'Export failed'
      setError(message)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-paper font-sans text-obsidian">
      <ConversationSidebar
        open={sidebarOpen}
        conversations={conversations}
        activeId={activeId}
        onToggle={() => setSidebarOpen((value) => !value)}
        onHome={() => navigate('/')}
        onNew={startNewConversation}
        onSelect={selectConversation}
        onDelete={deleteConversation}
        brandName={brand.name}
        newLabel={t('newAssessment')}
        recentLabel={t('recent')}
        clinicHref={brand.slug ? `/o/${brand.slug}/clinic` : '/clinic'}
        clinicLabel={t('clinicDashboard')}
      />

      <main className="relative flex min-w-0 flex-1 flex-col bg-paper">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-obsidian/10 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-obsidian/55 transition hover:bg-muted hover:text-obsidian"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => setSidebarOpen((value) => !value)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-obsidian/55 transition hover:bg-muted hover:text-obsidian lg:hidden"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">
                {activeConversation?.title || 'New assessment'}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-obsidian/35">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Private medical assistant
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle />
            <ThemeToggle />
            {activeConversation?.assessment?.urgency?.final && (
              <button
                type="button"
                onClick={exportAssessment}
                title="Export clinician-ready assessment"
                className="flex items-center gap-2 rounded-full border border-obsidian/15 bg-paper px-3 py-2 text-xs font-medium text-obsidian/70 transition hover:border-obsidian/30 hover:text-obsidian sm:px-3.5"
              >
                <Download size={15} />
                <span className="hidden sm:inline">{t('exportAssessment')}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setAvatarOpen(true)}
              className="flex items-center gap-2 rounded-full bg-obsidian px-3.5 py-2 text-xs font-medium text-paper transition hover:bg-accent sm:px-4"
            >
              <Video size={15} />
              <span className="hidden sm:inline">{t('openAvatar')}</span>
            </button>
          </div>
        </header>

        <section className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
          <div className="mx-auto flex min-h-full w-full max-w-[780px] flex-col px-5 pb-56 pt-10 sm:px-8 sm:pt-14">
            <div className="mb-10">
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                {t('secureClinical')}
              </div>
              <h1 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">
                {t('howCanHelp')}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-obsidian/45">
                {t('helpSub')}
              </p>
            </div>

            <div className="flex flex-col gap-9">
              {activeConversation?.messages.map((message) => (
                <div key={message.id} className="flex flex-col gap-3">
                  <MessageBubble
                    role={message.role}
                    content={message.content}
                    stream={message.stream}
                    onStreamComplete={() => finishStreaming(message.id)}
                  />
                  {message.showUrgency &&
                    activeConversation?.triageResult?.urgency && (
                      <>
                        <UrgencyBadge
                          urgency={activeConversation.triageResult.urgency}
                          overridden={
                            activeConversation.triageResult.overridden
                          }
                          source={activeConversation.triageResult.source}
                        />
                        <CareRoutingCard
                          urgency={activeConversation.triageResult.urgency}
                          assessment={activeConversation.assessment}
                          conversationId={activeConversation.id}
                          title={activeConversation.title}
                          orgSlug={brand.slug || 'demo-clinic'}
                        />
                      </>
                    )}
                </div>
              ))}

              {!loading && pendingFollowUp && (
                <TriageOptionCard
                  title={pendingFollowUp.prompt}
                  hint={
                    pendingFollowUp.mode === 'multi'
                      ? 'Select all that apply, then continue — or type your own answer below'
                      : 'Tap an option — or type your own answer below'
                  }
                  options={pendingFollowUp.options}
                  mode={pendingFollowUp.mode}
                  selectedIds={multiSelections}
                  onSelect={handleFollowUpSelect}
                  onContinue={
                    pendingFollowUp.mode === 'multi'
                      ? continueMultiFollowUp
                      : undefined
                  }
                  continueLabel="Continue"
                />
              )}

              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-obsidian text-paper">
                    <Plus size={13} strokeWidth={3} />
                  </div>
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((index) => (
                      <motion.span
                        key={index}
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.2,
                          delay: index * 0.18,
                        }}
                        className="h-1.5 w-1.5 rounded-full bg-obsidian/45"
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
                  {error}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
        </section>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-paper via-paper to-transparent px-4 pb-4 pt-14 sm:px-8 sm:pb-6">
          <div className="pointer-events-auto mx-auto w-full max-w-[760px]">
            <MediTriageChatInput
              value={input}
              onChange={setInput}
              onSubmit={sendMessage}
              busy={loading}
              queue={sendQueue}
              showQuickPrompts={!pendingFollowUp}
              placeholder={
                pendingFollowUp
                  ? 'Or type your own answer...'
                  : t('placeholder')
              }
              onQuickPrompt={handleQuickPrompt}
            />
          </div>
        </div>
      </main>

      <AvatarDialog
        open={avatarOpen}
        onClose={() => setAvatarOpen(false)}
        triageResult={activeConversation?.triageResult}
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(23, 23, 23, 0.12);
          border-radius: 999px;
        }
      `}</style>
    </div>
  )
}
