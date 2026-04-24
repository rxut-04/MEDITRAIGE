import React from 'react'
import { User, Video, Shield, Mic, Headphones } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '../lib/utils'

export default function AIVideoAvatar({ agentId, sessionId, isSpeaking }) {
  const [useSimulator, setUseSimulator] = React.useState(false)

  // The /j/ path for interactive sessions - trying more aggressive UI hiding
  // Added voice settings and UI suppression params
  const embedUrl = `https://bey.chat/j/${agentId}?sessionId=${sessionId}&embedded=true&minimal=true&ui=false&hide_ui=true&autoplay=true&show_intro=false&skip_intro=true&no_ui=true&controls=false&force_autoplay=true&mute=false&watermark=false&captions=false&logo=false&agent_name=false`

  return (
    <div className={cn(
      "aspect-[3/4] bg-obsidian rounded-[2rem] overflow-hidden shadow-2xl relative border-4 transition-all duration-700",
      isSpeaking ? "border-accent shadow-accent/40 scale-[1.02]" : "border-paper shadow-accent/20"
    )}>
      {isSpeaking && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-accent z-10 pointer-events-none"
        />
      )}
      {/* Aggressive cropping to focus on upper body and hide platform text */}
      <div className="absolute inset-x-[-15%] inset-y-[-10%] scale-[1.35] origin-center -translate-y-[8%]">
        <iframe
          src={embedUrl}
          className="w-full h-full border-0 pointer-events-none"
          allow="camera; microphone; autoplay; encrypted-media"
          referrerPolicy="no-referrer"
          id="beyond-presence-iframe"
        />
      </div>
    </div>
  )
}
