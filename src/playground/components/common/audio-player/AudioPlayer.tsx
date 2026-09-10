'use client'

import { useTranslation } from '@/playground/i18n'
import { cn } from '@/playground/lib/cn'
import { useFileUrl } from '@/playground/lib/files'
import { useDemoAction } from '@/playground/providers/PlaygroundProvider'
import {
  DashboardSpeed01Icon,
  Download01Icon,
  FolderOpenIcon,
  PauseIcon,
  PlayIcon,
  VolumeMute02Icon
} from 'hugeicons-react'
import { useCallback, useEffect, useRef, useState } from 'react'

/** 'file'/'upload' are the same channel here; 'voice' is a TTS voice memo. */
export type AudioSource = 'upload' | 'voice' | 'file'

export type AudioPlayerProps = {
  /**
   * For an upload, a workspace-relative path
   * (e.g. "uploads/conv-…/recording.mp3"). For `source: 'voice'`, the path
   * under workspace/speech/ the TTS plugin returned.
   */
  filePath: string
  fileExists: boolean
  mimeType: string
  fileName: string
  /**
   * Which channel the bytes came from on the desktop. Kept so the demo's
   * voice memos read the same as the desktop's; the visual language and
   * controls are identical either way.
   */
  source?: AudioSource
}

/**
 * Inline audio player. Used for both uploaded audio attachments and
 * TTS-generated voice memos — the visual language and controls are identical.
 */
export function AudioPlayer({
  filePath,
  fileExists,
  mimeType,
  fileName,
  source = 'upload'
}: AudioPlayerProps): React.JSX.Element {
  if (!fileExists) {
    return <DeletedPlayer />
  }
  return (
    <ActivePlayer filePath={filePath} mimeType={mimeType} fileName={fileName} source={source} />
  )
}

function DeletedPlayer(): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <div
      className={cn(
        'border-border bg-surface flex w-full max-w-[85%] max-sm:max-w-full items-center gap-3 self-start',
        'rounded-2xl border px-4 py-3 opacity-50'
      )}
    >
      <div className="bg-muted/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
        <VolumeMute02Icon size={16} className="text-muted" />
      </div>
      <span className="text-muted text-sm italic">{t('chat.audioPlayer.deleted')}</span>
    </div>
  )
}

function ActivePlayer({
  filePath,
  mimeType,
  fileName,
  source
}: {
  filePath: string
  mimeType: string
  fileName: string
  source: AudioSource
}): React.JSX.Element {
  void source
  const { t } = useTranslation()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const { url, error } = useFileUrl(filePath, mimeType)
  const demoAction = useDemoAction()

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTime = (): void => setCurrentTime(audio.currentTime)
    const onMeta = (): void => setDuration(audio.duration)
    const onEnded = (): void => {
      setPlaying(false)
      setCurrentTime(0)
      audio.currentTime = 0
    }
    // Keep the button in sync when playback is paused from outside togglePlay
    // (e.g. Chat pausing feed media when you navigate away).
    const onPause = (): void => setPlaying(false)

    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('pause', onPause)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('pause', onPause)
    }
  }, [url])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      void audio.play()
      setPlaying(true)
    }
  }, [playing])

  const cycleSpeed = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    const speeds = [1, 1.5, 2]
    const idx = speeds.indexOf(playbackRate)
    const next = speeds[(idx + 1) % speeds.length]
    audio.playbackRate = next
    setPlaybackRate(next)
  }, [playbackRate])

  const seek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current
      const bar = progressRef.current
      if (!audio || !bar || !duration) return
      const rect = bar.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      audio.currentTime = ratio * duration
      setCurrentTime(audio.currentTime)
    },
    [duration]
  )

  if (error) {
    return <DeletedPlayer />
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      className={cn(
        'border-border bg-surface flex w-full max-w-[85%] max-sm:max-w-full flex-col gap-1 self-start',
        'rounded-2xl border px-4 py-3'
      )}
    >
      <div className="text-muted truncate text-[11px] font-medium" title={fileName}>
        {fileName}
      </div>
      <div className="flex items-center gap-3">
        {url && <audio ref={audioRef} src={url} preload="metadata" />}

        <button
          type="button"
          onClick={togglePlay}
          disabled={!url}
          className={cn(
            'flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full',
            'bg-primary text-primary-fg hover:brightness-110',
            'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {playing ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
        </button>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div
            ref={progressRef}
            onClick={seek}
            className="bg-border h-1.5 w-full cursor-pointer rounded-full"
          >
            <div
              className="bg-primary h-full rounded-full transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-muted flex items-center justify-between text-[10px] tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={cycleSpeed}
          title={t('demo.media.speed', { rate: playbackRate })}
          className={cn(
            'text-muted hover:text-fg flex shrink-0 cursor-pointer items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium',
            'focus-visible:ring-2 focus-visible:ring-accent'
          )}
        >
          <DashboardSpeed01Icon size={12} />
          {playbackRate}x
        </button>

        <button
          type="button"
          onClick={demoAction}
          title={t('chat.fileCard.reveal')}
          className={cn(
            'text-muted hover:text-fg flex shrink-0 cursor-pointer items-center justify-center rounded p-1',
            'focus-visible:ring-2 focus-visible:ring-accent'
          )}
        >
          <FolderOpenIcon size={14} />
        </button>
        <button
          type="button"
          onClick={demoAction}
          title={t('chat.fileCard.download')}
          className={cn(
            'text-muted hover:text-fg flex shrink-0 cursor-pointer items-center justify-center rounded p-1',
            'focus-visible:ring-2 focus-visible:ring-accent'
          )}
        >
          <Download01Icon size={14} />
        </button>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
