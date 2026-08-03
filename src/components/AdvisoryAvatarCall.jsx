import React from 'react'
import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  RoomAudioRenderer,
} from '@livekit/components-react'
import { Track } from 'livekit-client'
import { cn } from '../lib/utils'

/** Renders remote avatar video inside LiveKitRoom. */
function AvatarVideoInner({ className }) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare])
  const videoTrack =
    tracks.find((t) => t.source === Track.Source.Camera) ?? tracks[0]

  if (!videoTrack) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-4 bg-obsidian/80 p-8 min-h-[200px] h-full',
          className
        )}
      >
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-paper/30 border-t-accent" />
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-paper/80">
            Almost there — your advisory is stepping in
          </p>
          <p className="text-xs text-paper/50 max-w-[260px]">
            In a moment you&apos;ll hear your AI summary, spoken clearly.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative w-full h-full min-h-[240px] overflow-hidden bg-obsidian',
        className
      )}
    >
      <VideoTrack
        trackRef={videoTrack}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  )
}

/**
 * Connects to a Beyond Presence call and shows the avatar.
 * audio={false} video={false} = do NOT publish local mic/cam.
 * Remote tracks are still subscribed (RoomAudioRenderer + VideoTrack).
 */
export function AdvisoryAvatarCall({ serverUrl, token, className }) {
  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect={true}
      audio={false}
      video={false}
      className={cn(
        'rounded-[2rem] overflow-hidden flex flex-col min-h-0 flex-1 h-full',
        className
      )}
      onError={(err) => console.error('[AdvisoryAvatarCall]', err)}
    >
      <RoomAudioRenderer />
      <AvatarVideoInner className="flex-1 min-h-0" />
    </LiveKitRoom>
  )
}

export default AdvisoryAvatarCall
