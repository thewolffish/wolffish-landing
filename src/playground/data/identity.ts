import type { AuthUser, CloudProfile, DataAnalytics, SystemInfo } from './types'
import { daysAgo, iso } from './clock'

/** The signed-in employee — the owner seat of the Wolffish Inc demo org. */
export const ORG_NAME = 'Wolffish Inc'
export const API_BASE = 'https://api.wolffi.sh'
export const DESKTOP_VERSION = '1.4.2'

export const USER: AuthUser = {
  email: 'younes@wolffi.sh',
  name: 'Younes Alturkey',
  role: 'owner'
}

export const USER_ID = 'usr_demo_000'

/** The signed-in user's photo — the same official portrait the site uses. */
export const USER_AVATAR = 'https://cdn.wolffi.sh/generic/younes-official.jpeg'

export const PROFILE: CloudProfile = {
  name: USER.name,
  email: USER.email,
  phone: '+966 53 865 4514',
  position: 'Software Engineer',
  bio: 'Platform team. Ships the API, the deploy pipeline and whatever the on-call rotation drags in. Coffee first, then code.',
  role: 'owner',
  orgName: ORG_NAME,
  pinSet: true,
  hasAvatar: true
}

export const USER_CREATED_AT = iso(daysAgo(212))

export const SYSTEM_INFO: SystemInfo = {
  totalRamBytes: 34_359_738_368,
  freeDiskBytes: 612_180_213_760,
  totalDiskBytes: 994_662_584_320,
  platform: 'darwin',
  arch: 'arm64',
  cpuCount: 12,
  cpuModel: 'Apple M4 Pro'
}

export const DATA_ANALYTICS: DataAnalytics = {
  workspaceBytes: 3_912_446_211,
  hippocampusBytes: 3_118_774,
  corpusBytes: 14_237_812,
  prefrontalBytes: 61_447_713,
  ramBytes: 231_303_040,
  cpuPercent: 1.4,
  totalRamBytes: SYSTEM_INFO.totalRamBytes,
  cpuCount: SYSTEM_INFO.cpuCount
}

export const WORKSPACE_ROOT = '/Users/younes/.wfc/workspace'
