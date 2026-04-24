import React from 'react'
import { motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { cn } from '../lib/utils'

export default function MessageBubble({ role, content }) {
  const isUser = role === 'user'

  // Parse and clean triage result blocks from display
  const displayContent = content
    .replace(/---TRIAGE_RESULT---[\s\S]*?---END_TRIAGE---/, '')
    .trim()

  if (!displayContent) return null

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "flex flex-col gap-1.5 max-w-[85%] lg:max-w-[70%]",
        isUser ? "self-end items-end" : "self-start"
      )}
    >
      {!isUser && (
        <div className="flex items-center gap-2 px-1 mb-0.5">
          <div className="w-5 h-5 rounded-full bg-obsidian flex items-center justify-center text-paper scale-75">
             <Plus size={10} strokeWidth={4} />
          </div>
          <span className="caps-technical text-[9px] text-accent">Clinical Intelligence</span>
        </div>
      )}
      
      <div className={cn(
        "px-6 py-4 text-md leading-relaxed transition-all",
        isUser 
          ? "bg-obsidian text-paper rounded-[1.5rem] rounded-tr-none shadow-xl shadow-obsidian/5" 
          : "bg-white text-obsidian border border-muted rounded-[1.5rem] rounded-tl-none shadow-sm"
      )}>
        <p className={cn("whitespace-pre-wrap", !isUser && "font-medium")}>
          {displayContent}
        </p>
      </div>
      
      <div className={cn("text-[9px] caps-technical text-obsidian/20 px-2 mt-1")}>
        {isUser ? "Transmitting" : "Response Encrypted"}
      </div>
    </motion.div>
  )
}
