import type { AdminRole, AdminUserStatus } from './types'
import { drawer } from './clock'
import { USER, USER_ID } from './identity'

/**
 * Wolffish Inc — the 51-seat demo org the API seeds (apps/api/scripts/
 * seed-demo.mjs): the same cast, the same addresses, the same roles, so the
 * admin roster and the leaderboard read like the deployed demo tenant.
 */
const CAST: Array<[string, string]> = [
  ['Shahad', 'Alotaibi'],
  ['Abdulaziz', 'Alqahtani'],
  ['Saad', 'Alharbi'],
  ['Alia', 'Alghamdi'],
  ['Hamad', 'Alshehri'],
  ['Amal', 'Alzahrani'],
  ['Sara', 'Almutairi'],
  ['Faisal', 'Aldossari'],
  ['Lina', 'Alsubaie'],
  ['Khalid', 'Aljuhani'],
  ['Bandar', 'Alanazi'],
  ['Yousef', 'Alshammari'],
  ['Lubna', 'Alrashidi'],
  ['Waleed', 'Albalawi'],
  ['Noura', 'Alamri'],
  ['Turki', 'Almalki'],
  ['Reem', 'Alyami'],
  ['Saad', 'Alharthi'],
  ['Sultan', 'Alqurashi'],
  ['Ziyad', 'Alhazmi'],
  ['Maha', 'Alruwaili'],
  ['Anas', 'Alenezi'],
  ['Dana', 'Alturki'],
  ['Meshal', 'Altamimi'],
  ['Shahad', 'Alharbi'],
  ['Salman', 'Alrajhi'],
  ['Osama', 'Alqahtani'],
  ['Nawaf', 'Alotaibi'],
  ['Jana', 'Alnasser'],
  ['Norah', 'Alghamdi'],
  ['Rakan', 'Alrasheed'],
  ['Joud', 'Aldakhil'],
  ['Ghada', 'Alzamil'],
  ['Abdullah', 'Alolayan'],
  ['Layla', 'Alsuwailem'],
  ['Fahad', 'Almutairi'],
  ['Wafa', 'Alhamdan'],
  ['Majed', 'Alsudairi'],
  ['Rania', 'Albishi'],
  ['Yazeed', 'Aloraini'],
  ['Farah', 'Alhussain'],
  ['Tariq', 'Alsahli'],
  ['Hana', 'Alfaraj'],
  ['Badr', 'Aldawood'],
  ['Latifa', 'Alshaya'],
  ['Mohammed', 'Alharbi'],
  ['Abrar', 'Almogbel'],
  ['Talal', 'Alkhathlan'],
  ['Ruba', 'Alsanea'],
  ['Nasser', 'Alowais']
]

const POSITIONS = [
  'Software Engineer',
  'Senior Software Engineer',
  'Frontend Engineer',
  'Backend Engineer',
  'DevOps Engineer',
  'Site Reliability Engineer',
  'QA Engineer',
  'Data Engineer',
  'Customer Support Specialist',
  'Technical Support Engineer',
  'Marketing Manager',
  'Content Marketer',
  'Growth Marketer',
  'Account Executive',
  'Sales Development Rep',
  'Solutions Consultant'
]

const BIO_FLAVOR = [
  'Coffee first, then code.',
  'Ships fast, breaks nothing.',
  'Loves clean dashboards.',
  'Automates everything twice.',
  'Asks the agent before asking a human.',
  'Keeps the backlog honest.',
  'Turns tickets into fans.',
  'Pipelines are a love language.'
]

/** Named roles the user.md mentions — pinned so the org reads coherently. */
const PINNED_POSITIONS: Record<string, string> = {
  'nawaf.alotaibi@wolffi.sh': 'Engineering Manager',
  'sara.almutairi@wolffi.sh': 'Frontend Lead',
  'bandar.alanazi@wolffi.sh': 'DevOps Engineer',
  'reem.alyami@wolffi.sh': 'QA Engineer',
  'dana.alturki@wolffi.sh': 'Finance Partner',
  'majed.alsudairi@wolffi.sh': 'Hiring Manager'
}

export type Person = {
  n: number
  id: string
  email: string
  name: string
  role: AdminRole
  status: AdminUserStatus
  position: string
  bio: string
  phone: string
}

function phoneFor(i: number): string {
  if (i === 0) return '+966 53 865 4514'
  const rnd = drawer(`phone-${i}`)
  const d = (n: number): string => String(Math.floor(rnd() * 10 ** n)).padStart(n, '0')
  return `+966 5${d(1)} ${d(3)} ${d(4)}`
}

function positionFor(i: number, role: AdminRole, email: string): string {
  if (PINNED_POSITIONS[email]) return PINNED_POSITIONS[email]
  if (i === 50) return 'Release Gate'
  if (role === 'owner') return 'Software Engineer'
  if (role === 'admin') return 'IT Administrator'
  if (role === 'support') return 'IT Support Specialist'
  const rnd = drawer(`position-${i}`)
  return POSITIONS[Math.floor(rnd() * POSITIONS.length)]
}

function bioFor(i: number, position: string): string {
  if (i === 0) return 'Platform team. Ships the API, the deploy pipeline and whatever the on-call rotation drags in.'
  const rnd = drawer(`bio-${i}`)
  return `${position} at Wolffish Inc. ${BIO_FLAVOR[Math.floor(rnd() * BIO_FLAVOR.length)]}`
}

export const ROSTER: Person[] = [
  {
    n: 0,
    id: USER_ID,
    email: USER.email,
    name: USER.name,
    role: 'owner',
    status: 'active',
    position: 'Software Engineer',
    bio: bioFor(0, 'Software Engineer'),
    phone: phoneFor(0)
  },
  ...CAST.map(([first, last], idx) => {
    const n = idx + 1
    const role: AdminRole = n <= 2 ? 'admin' : n <= 4 ? 'support' : n === 50 ? 'owner' : 'employee'
    const email = `${first}.${last}@wolffi.sh`.toLowerCase()
    const status: AdminUserStatus = n === 49 ? 'invited' : n === 48 ? 'suspended' : 'active'
    const position = positionFor(n, role, email)
    return {
      n,
      id: `usr_demo_${String(n).padStart(3, '0')}`,
      email,
      name: `${first} ${last}`,
      role,
      status,
      position,
      bio: bioFor(n, position),
      phone: phoneFor(n)
    }
  })
]

export function personById(id: string): Person | undefined {
  return ROSTER.find((p) => p.id === id)
}
