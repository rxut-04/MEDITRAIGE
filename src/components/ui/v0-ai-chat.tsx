"use client"

import { useCallback, useEffect, useRef } from "react"
import {
  Activity,
  ArrowUpIcon,
  CornerDownLeft,
  HeartPulse,
  Info,
  Paperclip,
  ShieldCheck,
  Thermometer,
  Wind,
} from "lucide-react"
import { Textarea } from "./textarea"
import { cn } from "../../lib/utils"

interface UseAutoResizeTextareaProps {
  minHeight: number
  maxHeight?: number
}

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current
      if (!textarea) return

      if (reset) {
        textarea.style.height = `${minHeight}px`
        return
      }

      textarea.style.height = `${minHeight}px`
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
      )
      textarea.style.height = `${newHeight}px`
    },
    [minHeight, maxHeight]
  )

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = `${minHeight}px`
    }
  }, [minHeight])

  useEffect(() => {
    const handleResize = () => adjustHeight()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [adjustHeight])

  return { textareaRef, adjustHeight }
}

const QUICK_PROMPTS = [
  { icon: Activity, label: "Headache" },
  { icon: Thermometer, label: "Fever" },
  { icon: HeartPulse, label: "Chest pain" },
  { icon: Wind, label: "Breathing issue" },
  { icon: Activity, label: "Stomach pain" },
]

export interface QueuedMessage {
  id: string
  text: string
}

export interface MediTriageChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  /** True while a reply is in flight — input stays editable; send queues. */
  busy?: boolean
  placeholder?: string
  queue?: QueuedMessage[]
  onQuickPrompt?: (label: string) => void
  /** Hide symptom starter chips (e.g. when a follow-up option card is showing). */
  showQuickPrompts?: boolean
  className?: string
}

/**
 * v0-style chat composer, themed for MediTriage clinical intake.
 * Stays writable while busy; queued sends show above the field.
 */
export function MediTriageChatInput({
  value,
  onChange,
  onSubmit,
  busy = false,
  placeholder = "Describe what you are feeling...",
  queue = [],
  onQuickPrompt,
  showQuickPrompts = true,
  className,
}: MediTriageChatInputProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  })

  const canSend = Boolean(value.trim())

  const handleSubmit = () => {
    if (!canSend) return
    onSubmit()
    adjustHeight(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const queueCount = queue.length
  const preview = queue[0]?.text || ""

  return (
    <div className={cn("mx-auto flex w-full max-w-4xl flex-col", className)}>
      {queueCount > 0 && (
        <div className="mb-2 rounded-xl border border-obsidian/10 bg-white px-3.5 py-2.5 text-obsidian shadow-[0_10px_30px_rgba(23,23,23,0.08)] dark:border-white/10 dark:bg-neutral-800 dark:text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-xs text-obsidian/55 dark:text-white/55">
              <span className="shrink-0 font-semibold text-obsidian/90 dark:text-white/90">
                {queueCount} Queued
              </span>
              <span className="flex shrink-0 items-center gap-1 text-obsidian/45 dark:text-white/45">
                <CornerDownLeft className="h-3.5 w-3.5" />
                to Send
              </span>
            </div>
            {busy && (
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-sage/90">
                Sending…
              </span>
            )}
          </div>
          {preview && (
            <p className="mt-1.5 truncate text-sm text-obsidian/85 dark:text-white/85">
              &ldquo;{preview}
              {preview.length > 72 ? "…" : ""}&rdquo;
            </p>
          )}
          {queueCount > 1 && (
            <p className="mt-1 text-[11px] text-obsidian/40 dark:text-white/40">
              +{queueCount - 1} more waiting
            </p>
          )}
        </div>
      )}

      <div className="relative rounded-2xl border border-obsidian/10 bg-white shadow-[0_18px_50px_rgba(23,23,23,0.12)] transition-colors dark:border-white/10 dark:bg-neutral-800 dark:shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
        <div className="overflow-y-auto">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
              adjustHeight()
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              busy
                ? "Type another message — it will queue…"
                : placeholder
            }
            className={cn(
              "min-h-[60px] w-full resize-none border-none bg-transparent px-4 py-3",
              "text-sm text-obsidian dark:text-white",
              "placeholder:text-sm placeholder:text-obsidian/40 dark:placeholder:text-white/40",
              "focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
              "cursor-text"
            )}
            style={{ overflow: "hidden" }}
          />
        </div>

        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              disabled
              title="Attachments coming soon"
              className="group flex items-center gap-1 rounded-lg p-2 text-obsidian/45 transition-colors dark:text-white/50"
            >
              <Paperclip className="h-4 w-4" />
              <span className="hidden text-xs text-obsidian/40 transition-opacity dark:text-white/40 sm:group-hover:inline">
                Attach
              </span>
            </button>
            <span className="hidden items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-obsidian/40 dark:text-white/35 sm:flex">
              <ShieldCheck className="h-3.5 w-3.5 text-sage" />
              Secure
            </span>
            <span className="hidden items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-obsidian/40 dark:text-white/35 md:flex">
              <Info className="h-3.5 w-3.5" />
              Not a diagnosis
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSend}
              title={busy ? "Queue message" : "Send"}
              className={cn(
                "flex items-center justify-center rounded-lg border px-1.5 py-1.5 transition-colors",
                canSend
                  ? "border-sage bg-sage text-white hover:brightness-110"
                  : "border-obsidian/15 text-obsidian/30 dark:border-white/15 dark:text-white/35"
              )}
            >
              <ArrowUpIcon
                className={cn(
                  "h-4 w-4",
                  canSend
                    ? "text-white"
                    : "text-obsidian/30 dark:text-white/35"
                )}
              />
              <span className="sr-only">{busy ? "Queue" : "Send"}</span>
            </button>
          </div>
        </div>
      </div>

      {showQuickPrompts && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {QUICK_PROMPTS.map(({ icon: Icon, label }) => (
            <ActionButton
              key={label}
              icon={<Icon className="h-3.5 w-3.5" />}
              label={label}
              onClick={() => onQuickPrompt?.(label)}
            />
          ))}
        </div>
      )}

      <p className="mt-2 text-center text-[10px] text-obsidian/30">
        For emergencies, contact your local emergency services immediately.
      </p>
    </div>
  )
}

/** Full demo shell from the source component (unused in triage; kept for reference). */
export function VercelV0Chat() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center space-y-8 p-4">
      <h1 className="text-4xl font-bold text-obsidian dark:text-paper">
        How can I help today?
      </h1>
      <MediTriageChatInput
        value=""
        onChange={() => {}}
        onSubmit={() => {}}
        placeholder="Describe your symptoms..."
      />
    </div>
  )
}

interface ActionButtonProps {
  icon: React.ReactNode
  label: string
  onClick?: () => void
}

function ActionButton({ icon, label, onClick }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-full border border-obsidian/10 bg-paper px-3.5 py-2 text-obsidian/55 transition-colors",
        "hover:border-obsidian/20 hover:bg-muted hover:text-obsidian"
      )}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}
