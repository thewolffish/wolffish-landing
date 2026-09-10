import type {
  BraveStatus,
  ComputerUsePermissions,
  ExtensionServerStatus,
  MobileStatus
} from './types'
import { API_BASE } from './identity'
import { daysAgo, hoursAgo, minutesAgo, NOW } from './clock'

export const BRAVE_STATUS: BraveStatus = {
  provider: 'brave',
  managed: true,
  state: 'ready',
  configured: true,
  enabled: true,
  usedToday: 23,
  dailyCap: 400,
  orgUsedMonth: 4_812,
  orgMonthlyCap: 60_000,
  pricePerQueryUsd: 0.005,
  planQps: 20,
  limitPerSec: 20,
  error: null,
  fetchedAt: NOW
}

export const COMPUTER_USE_PERMISSIONS: ComputerUsePermissions = {
  platform: 'darwin',
  hint: null,
  accessibility: true,
  screenRecording: true
}

export const EXTENSION_STATUS: ExtensionServerStatus = {
  status: 'connected',
  error: null,
  extensionVersion: '0.2.7',
  port: 23152,
  browsers: [
    {
      id: 'ext_1',
      instanceId: 'a91f3c',
      key: 'chrome-a91f3c',
      browser: 'chrome',
      name: 'Google Chrome',
      version: '0.2.7',
      browserVersion: '151.0.7601.84',
      os: 'macOS',
      profileEmail: 'younes@wolffi.sh',
      connectedAt: hoursAgo(3),
      lastPing: minutesAgo(1)
    },
    {
      id: 'ext_2',
      instanceId: 'c02d77',
      key: 'brave-c02d77',
      browser: 'brave',
      name: 'Brave',
      version: '0.2.7',
      browserVersion: '1.84.120',
      os: 'macOS',
      profileEmail: null,
      connectedAt: hoursAgo(9),
      lastPing: minutesAgo(4)
    }
  ]
}

export const MOBILE_STATUS: MobileStatus = {
  paired: true,
  phones: [
    {
      id: 'dev_phone_01',
      name: "Younes's iPhone",
      platform: 'ios',
      model: 'iPhone 17 Pro',
      osVersion: '26.1',
      appVersion: '1.0.52',
      pairedAt: daysAgo(41),
      lastSeenAt: minutesAgo(7),
      pairMethod: 'qr',
      connected: true,
      connectedSince: hoursAgo(2)
    }
  ],
  bridge: {
    status: 'connected',
    phones: [
      {
        deviceId: 'dev_phone_01',
        name: "Younes's iPhone",
        platform: 'ios',
        appVersion: '1.0.52',
        connectedAt: hoursAgo(2)
      }
    ],
    connectedAt: hoursAgo(2),
    lastError: null,
    reconnects: 1,
    framesSent: 1_842,
    framesReceived: 1_207,
    bytesSent: 3_418_226,
    bytesReceived: 912_884
  },
  offer: null,
  verbose: false,
  notificationsEnabled: true,
  runCards: false,
  apiBase: API_BASE
}

export const ENGINE_STATUS = { stt: { installed: true }, tts: { installed: true } }

export const STT_MODELS = ['tiny', 'base', 'small', 'medium', 'large-v3'] as const

export const TTS_VOICES = [
  'af_bella',
  'af_heart',
  'af_nicole',
  'af_sarah',
  'am_adam',
  'am_michael',
  'bf_emma',
  'bm_george'
] as const
