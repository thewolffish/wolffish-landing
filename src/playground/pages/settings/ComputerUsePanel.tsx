'use client'

import { Button } from '@/playground/components/core/Button'
import { PanelBackChevron } from '@/playground/pages/settings/drillNav'
import { useTranslation } from '@/playground/i18n'
import { useDemo, useDemoAction } from '@/playground/providers/PlaygroundProvider'
import { COMPUTER_USE_PERMISSIONS } from '@/playground/data/services'
import { compactionAtFor, contextWindowFor, modelMeta, PROVIDER } from '@/playground/data/catalog'
import type { ModelCapabilities } from '@/playground/data/types'

import { CapabilityGateBody, CapabilityGateCard, useCapabilityGate } from './capabilityGate'

/**
 * Computer Use has no capture settings to offer. Screenshot resolution and
 * format are chosen by the agent per capture (`max_width` / `format` on
 * computer_screenshot), so the values in `config.json → computerUse` are only
 * the fallback default — nothing a person needs to reach for mid-task. What
 * is left here is the part a person genuinely owns: the macOS permissions.
 */
export function ComputerUsePanel(): React.JSX.Element {
  const { t } = useTranslation()
  const gate = useCapabilityGate('computer-use')
  const { config } = useDemo()
  const demoAction = useDemoAction()

  const permissions = COMPUTER_USE_PERMISSIONS
  const meta = modelMeta(config.llm.model)
  const modelCaps: ModelCapabilities = {
    provider: PROVIDER,
    model: config.llm.model,
    supportsVision: meta.vision,
    contextWindow: contextWindowFor(config.llm.model),
    compactionAt: compactionAtFor(config.llm.model)
  }
  const loaded = true

  return (
    <div className="flex min-h-full w-full items-start justify-center px-6 py-10 max-sm:px-4 max-sm:py-6">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <PanelBackChevron />
            <h1 className="text-fg text-2xl font-semibold tracking-tight">
              {t('settings.services.computerUse.title')}
            </h1>
          </div>
          <p className="text-muted text-sm leading-relaxed">
            {t('settings.services.computerUse.subtitle')}
          </p>
        </header>

        <CapabilityGateCard gate={gate} label={t('settings.services.tabs.computerUse')} />

        <CapabilityGateBody gate={gate}>
          {loaded && (
            <>
              {modelCaps.model !== null && !modelCaps.supportsVision && (
                <section className="border-amber-500/30 bg-amber-500/5 flex flex-col gap-1 rounded-2xl border p-5">
                  <h2 className="text-fg text-sm font-semibold">
                    {t('settings.services.computerUse.visionWarningTitle')}
                  </h2>
                  <p className="text-muted text-sm leading-relaxed">
                    {t('settings.services.computerUse.visionWarning', { model: modelCaps.model })}
                  </p>
                </section>
              )}

              {/* Permissions */}
              {permissions.platform === 'darwin' && (
                <section className="bg-surface border-border flex flex-col gap-3 rounded-2xl border p-6 max-sm:p-4">
                  <h2 className="text-fg text-sm font-semibold">
                    {t('settings.services.computerUse.permissionsTitle')}
                  </h2>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className={permissions.accessibility ? 'text-green-500' : 'text-red-400'}
                      >
                        {permissions.accessibility ? '●' : '○'}
                      </span>
                      <span className="text-fg">
                        {t('settings.services.computerUse.permAccessibility')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className={permissions.screenRecording ? 'text-green-500' : 'text-red-400'}
                      >
                        {permissions.screenRecording ? '●' : '○'}
                      </span>
                      <span className="text-fg">
                        {t('settings.services.computerUse.permScreenRecording')}
                      </span>
                    </div>
                  </div>
                  {permissions.hint && (
                    <p className="text-muted text-sm leading-relaxed">{permissions.hint}</p>
                  )}
                  <Button onClick={demoAction} className="self-start">
                    {t('settings.services.computerUse.recheckPermissions')}
                  </Button>
                </section>
              )}

              {permissions.platform === 'linux' && permissions.hint && (
                <section className="bg-surface border-border flex flex-col gap-3 rounded-2xl border p-6 max-sm:p-4">
                  <h2 className="text-fg text-sm font-semibold">
                    {t('settings.services.computerUse.permissionsTitle')}
                  </h2>
                  <p className="text-muted text-sm leading-relaxed">{permissions.hint}</p>
                </section>
              )}

              {/* How it works */}
              <section className="bg-surface border-border flex flex-col gap-3 rounded-2xl border p-6 max-sm:p-4">
                <h2 className="text-fg text-sm font-semibold">
                  {t('settings.services.computerUse.howItWorksTitle')}
                </h2>
                <ul className="text-muted flex flex-col gap-2 text-sm leading-relaxed">
                  <li>{t('settings.services.computerUse.howItWorks.step1')}</li>
                  <li>{t('settings.services.computerUse.howItWorks.step2')}</li>
                  <li>{t('settings.services.computerUse.howItWorks.step3')}</li>
                  <li>{t('settings.services.computerUse.howItWorks.step4')}</li>
                  <li>{t('settings.services.computerUse.howItWorks.step5')}</li>
                </ul>
              </section>
            </>
          )}
        </CapabilityGateBody>
      </div>
    </div>
  )
}
