import type { WorkspaceConfig } from './types'
import { FLASH, PRO, VISION } from './catalog'

/** The workspace config as the desktop holds it after the org overlay. */
export const INITIAL_CONFIG: WorkspaceConfig = {
  version: 1,
  launchAtStartup: true,
  llm: {
    model: FLASH,
    mode: 'single',
    thinkingModes: { [FLASH]: 'high', [PRO]: 'max', [VISION]: 'high' }
  },
  safety: { bypassPermissions: false, blockCredentials: true },
  weekStartsOn: 0,
  variables: [
    { name: 'GITHUB_ORG', value: 'wolffish-inc', sensitive: false },
    { name: 'REPO_ROOT', value: '~/dev/wolffish-cloud', sensitive: false },
    { name: 'JIRA_PROJECT', value: 'WFC', sensitive: false },
    { name: 'STAGING_URL', value: 'https://staging.api.wolffi.sh', sensitive: false },
    { name: 'ONCALL_CHANNEL', value: '#platform-oncall', sensitive: false },
    { name: 'SENTRY_AUTH_TOKEN', value: 'sntrys_eyJpYXQiOjE3NTYyNDk0MTMuNjQ3MDYzfQ', sensitive: true },
    { name: 'DATADOG_API_KEY', value: '4f1c8b2e9a7d4c3f8e6b1a2d5c9f7e3b', sensitive: true },
    { name: 'CLOUDFLARE_API_TOKEN', value: 'cfk_Qm9vayBhIGNhbGwgd2l0aCBZb3VuZXM', sensitive: true }
  ],
  inapp: { verbose: false, reasoning: false },
  stt: { defaultModel: 'base', language: 'auto' },
  tts: { defaultVoice: 'af_bella', defaultSpeed: '1.0', voiceReplies: true },
  computerUse: { screenshotMaxWidth: 1280, screenshotFormat: 'jpeg' },
  browserExtension: { port: 23152, screenshotMaxWidth: 1280, screenshotFormat: 'jpeg', screenshotQuality: 80 },
  updates: { enabled: true },
  compaction: { dailyHour: 16, weeklyDay: 4, weeklyHour: 17 },
  reflection: { hour: 3, quietHours: 12 },
  locale: 'en',
  theme: 'light',
  onboardingCompleted: true
}

/**
 * Config paths the organization owns — applied on every read, forced on
 * every write. The Settings page shows the org-managed notice for these.
 */
export const ORG_LOCKED_KEYS: string[] = [
  'safety.blockCredentials',
  'updates.enabled',
  'browserExtension.port'
]
