'use client'

import { ENGINE_STATUS } from '@/playground/data/services'
import { useDemoAction } from '@/playground/providers/PlaygroundProvider'

export type EngineInstallPhase = 'python' | 'engine' | 'ffmpeg' | 'model' | 'done'

type Progress = { phase: EngineInstallPhase; percent: number }

export type EngineInstallState = {
  /** null ONLY on the very first check of the session, before status resolves. */
  installed: boolean | null
  installing: boolean
  progress: Progress | null
  error: string | null
  install: () => void
}

/**
 * Drives the manual install + readiness state for a local voice engine
 * (Kokoro TTS or faster-whisper STT). On the desktop the install runs in the
 * main process and streams byte progress back; here both engines are already
 * installed on the machine this replica stands in for, so the card paints its
 * settled installed state and the Reinstall button says what it would do.
 */
export function useEngineInstall(kind: 'tts' | 'stt'): EngineInstallState {
  const install = useDemoAction()
  return {
    installed: ENGINE_STATUS[kind].installed,
    installing: false,
    progress: null,
    error: null,
    install
  }
}
