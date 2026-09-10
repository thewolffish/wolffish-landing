'use client'

import { Select, type SelectOption } from '@/playground/components/core/Select'
import { cn } from '@/playground/lib/cn'
import { useTranslation } from '@/playground/i18n'
import { useDemo } from '@/playground/providers/PlaygroundProvider'
import { PanelBackChevron } from '@/playground/pages/settings/drillNav'
import { useMemo } from 'react'

import { CapabilityGateBody, CapabilityGateCard, useCapabilityGate } from './capabilityGate'
import { EngineInstallCard } from './EngineInstallCard'
import { useEngineInstall } from './useEngineInstall'
import { WHISPER_LANGUAGES } from './whisperLanguages'

// Size, speed and blurb per model all live in the locale files under
// `settings.services.stt.models.<id>` — the sizes carry a unit word that has
// to read natively (e.g. "≈150 ميجا بايت"), so they cannot be literals here.
const MODEL_IDS = ['tiny', 'base', 'small', 'medium', 'large'] as const

const FORMATS = ['MP3', 'WAV', 'M4A', 'OGG', 'FLAC', 'WEBM', 'AAC']
// 'small', not 'base' — mirrors the plugin default: base misdetects short
// accented clips badly enough to transcribe English speech into Arabic script.
const DEFAULT_MODEL = 'small'
// Transcription is PINNED to one language; 'auto' (Whisper detection) is the
// explicit opt-in. '' in config means unset → the plugin pins English.
const DEFAULT_LANGUAGE = 'en'

export function SpeechToTextPanel(): React.JSX.Element {
  const { t } = useTranslation()
  const gate = useCapabilityGate('speech-to-text')
  const engine = useEngineInstall('stt')
  const ready = engine.installed === true
  const { config, patchConfig } = useDemo()

  // The persisted defaults; the selects save on change so the cerebellum
  // plugin (which re-reads config before every transcribe call) picks up new
  // selections without a restart.
  const model = config.stt.defaultModel || DEFAULT_MODEL
  const language = config.stt.language || DEFAULT_LANGUAGE

  const onModelChange = (next: string): void => {
    patchConfig((c) => ({ ...c, stt: { ...c.stt, defaultModel: next } }))
  }

  const onLanguageChange = (next: string): void => {
    patchConfig((c) => ({ ...c, stt: { ...c.stt, language: next } }))
  }

  const modelOptions: SelectOption<string>[] = useMemo(
    () =>
      MODEL_IDS.map((id) => ({
        value: id,
        label: t('settings.services.stt.modelOption', {
          id,
          size: t(`settings.services.stt.models.${id}.size`),
          speed: t(`settings.services.stt.models.${id}.speed`).toLocaleLowerCase()
        })
      })),
    [t]
  )

  // 'auto' pinned first with a localized label; the 100 languages keep their
  // English labels (like the Kokoro voice catalog) so the search box always
  // matches what the list shows.
  const languageOptions: SelectOption<string>[] = useMemo(
    () => [
      { value: 'auto', label: t('settings.services.stt.languageAuto') },
      ...WHISPER_LANGUAGES.map((l) => ({ value: l.code, label: l.label }))
    ],
    [t]
  )

  const selectedId = MODEL_IDS.find((id) => id === model) ?? DEFAULT_MODEL

  return (
    <div className="flex min-h-full w-full items-start justify-center px-6 py-10 max-sm:px-4 max-sm:py-6">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <PanelBackChevron />
            <h1 className="text-fg text-2xl font-semibold tracking-tight">
              {t('settings.services.stt.title')}
            </h1>
          </div>
          <p className="text-muted text-sm leading-relaxed">
            {t('settings.services.stt.subtitle')}
          </p>
        </header>

        <CapabilityGateCard gate={gate} label={t('settings.services.tabs.stt')} />

        <CapabilityGateBody gate={gate}>
          <EngineInstallCard
            state={engine}
            requirementKey="settings.services.stt.installRequirement"
          />

          <section className="bg-surface border-border flex flex-col gap-5 rounded-2xl border p-6 max-sm:p-4">
            <div className="flex flex-col gap-1">
              <span className="text-muted text-xs font-medium uppercase tracking-wider">
                {t('settings.services.engine')}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-fg text-sm font-medium">
                  {t('settings.services.stt.engineName')}
                </span>
                <span className="bg-border/60 text-muted rounded-md px-1.5 py-0.5 text-[10px] font-medium">
                  {t('settings.services.stt.local')}
                </span>
              </div>
              <p className="text-muted text-xs">{t('settings.services.stt.engineDescription')}</p>
            </div>

            <div
              className={cn(
                'flex flex-col gap-5',
                !ready && 'pointer-events-none select-none opacity-40'
              )}
              aria-disabled={!ready}
            >
              <div className="border-border/60 border-t" />

              <div className="flex flex-col gap-2">
                <Select<string>
                  label={t('settings.services.stt.model')}
                  value={model}
                  options={modelOptions}
                  onChange={onModelChange}
                />
                <p className="text-muted text-xs">
                  {t(`settings.services.stt.models.${selectedId}.description`)}
                </p>
              </div>

              <div className="border-border/60 border-t" />

              <div className="flex flex-col gap-2">
                <Select<string>
                  label={t('settings.services.stt.language')}
                  value={language}
                  options={languageOptions}
                  onChange={onLanguageChange}
                  searchable
                />
                <p className="text-muted text-xs">
                  {t('settings.services.stt.languageDescription')}
                </p>
              </div>
            </div>
          </section>

          <section className="bg-surface border-border flex flex-col gap-3 rounded-2xl border p-6 max-sm:p-4">
            <h2 className="text-fg text-sm font-medium">
              {t('settings.services.stt.modelsTitle')}
            </h2>
            <div className="divide-border/40 divide-y">
              {MODEL_IDS.map((id) => (
                <div
                  key={id}
                  className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-fg text-sm font-medium capitalize">{id}</span>
                    <span className="text-muted text-xs">
                      {t(`settings.services.stt.models.${id}.description`)}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end">
                    <span className="text-fg text-xs">
                      {t(`settings.services.stt.models.${id}.size`)}
                    </span>
                    <span className="text-muted text-xs">
                      {t(`settings.services.stt.models.${id}.speed`)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-border/60 mt-2 border-t pt-3">
              <h2 className="text-fg text-sm font-medium">
                {t('settings.services.stt.formatsTitle')}
              </h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {FORMATS.map((f) => (
                  <span
                    key={f}
                    className="bg-border/40 text-muted rounded-md px-2 py-0.5 text-xs font-medium"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </CapabilityGateBody>
      </div>
    </div>
  )
}
