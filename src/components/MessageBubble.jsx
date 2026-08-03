import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { cn } from '../lib/utils'

export default function MessageBubble({
  role,
  content,
  stream = false,
  onStreamComplete,
}) {
  const isUser = role === 'user'
  const displayContent = useMemo(
    () =>
      content
        .replace(/---FOLLOW_UP---[\s\S]*?---END_FOLLOW_UP---/gi, '')
        .replace(/---TRIAGE_RESULT---[\s\S]*?---END_TRIAGE---/gi, '')
        .trim(),
    [content]
  )
  const [visibleLength, setVisibleLength] = useState(
    stream && !isUser ? 0 : displayContent.length
  )
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onStreamComplete)
  onCompleteRef.current = onStreamComplete

  useEffect(() => {
    completedRef.current = false

    if (isUser || !stream) {
      setVisibleLength(displayContent.length)
      return
    }

    if (!displayContent.length) {
      setVisibleLength(0)
      return
    }

    setVisibleLength(0)
    const chunkSize = Math.max(1, Math.ceil(displayContent.length / 180))
    const timer = window.setInterval(() => {
      setVisibleLength((current) =>
        Math.min(current + chunkSize, displayContent.length)
      )
    }, 14)

    return () => window.clearInterval(timer)
  }, [displayContent, isUser, stream])

  // Notify parent only after paint — never inside a setState updater.
  useEffect(() => {
    if (isUser || !stream) return
    if (visibleLength < displayContent.length) return
    if (!displayContent.length || completedRef.current) return
    completedRef.current = true
    onCompleteRef.current?.()
  }, [displayContent.length, isUser, stream, visibleLength])

  if (!displayContent) return null

  const isTyping = !isUser && stream && visibleLength < displayContent.length

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'w-full flex',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {isUser ? (
        <div className="max-w-[82%] rounded-[1.35rem] rounded-br-md bg-obsidian px-5 py-3 text-[15px] leading-6 text-paper shadow-sm">
          <p className="whitespace-pre-wrap">{displayContent}</p>
        </div>
      ) : (
        <div className="flex w-full max-w-[680px] gap-4">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-obsidian text-paper">
            <Plus size={13} strokeWidth={3} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
              Clinical Intelligence
            </div>
            <p className="whitespace-pre-wrap text-[15px] leading-7 text-obsidian/85">
              {displayContent.slice(0, visibleLength)}
              {isTyping && (
                <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-accent align-middle" />
              )}
            </p>
          </div>
        </div>
      )}
    </motion.article>
  )
}
