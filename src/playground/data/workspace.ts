import type { ViewerTreeNode } from './types'
import { HEARTBEAT_MD } from './automations'
import { AGENTS_MD, SOUL_MD, USER_MD } from './identityDocs'
import { PROJECT_FILES } from './projects'
import { PROCEDURE_FILES } from './procedures'

/**
 * ~/.wfc/workspace as the viewer page walks it. Text files carry real
 * content (below and on each conversation); binary files resolve to the
 * published sample for their type.
 */
export const WORKSPACE_FILES: Record<string, string> = {
  'brain/identity/soul.md': SOUL_MD,
  'brain/identity/user.md': USER_MD,
  'brain/prefrontal/agents.md': AGENTS_MD,
  'brain/brainstem/heartbeat.md': HEARTBEAT_MD,
  'brain/hippocampus/knowledge/people.md': `# People

- **Nawaf Alotaibi** — engineering manager. Wants release dates in writing, prefers a table over a paragraph. Loop in on anything that moves a date.
- **Sara Almutairi** — frontend lead. Reviews every UI PR; asks for a screenshot in the PR body.
- **Bandar Alanazi** — DevOps. Owns the Cloudflare account and the cost dashboards. Runs reconciliations at night.
- **Reem Alyami** — QA. Keeps the flaky-test list; quarantine rule agreed at the sprint 42 retro.
- **Dana Alturki** — finance partner. Wants riyal figures with VAT shown separately, PDF over spreadsheet.
- **Majed Alsudairi** — hiring manager for the platform role. Debrief within 24 hours of the last interview.
`,
  'brain/hippocampus/knowledge/projects.md': `# Projects

## Platform API
- Release 2.14 is cut from \`release/2.14\`; notes drafted, waiting on Sara's review of the UI section.
- The slow-query audit found three missing indexes on staging; migration drafted, not applied.
- ModelGate cooldown on 429 raised from 20 s to 45 s after the August spike.

## Mobile App Release
- 1.0.52 in TestFlight; crash-free rate 99.62% over 7 days.
- Top crash cluster: Samsung Galaxy A56 on the attachments sheet (fixed in 1.0.53).

## Infra & Cost
- August Cloudflare bill anomaly: R2 Class A operations from manifest rewrites, not egress. Fix shipped in sync 1.7.3.
- Q4 forecast assumes 260 seats by December.
`,
  'brain/hippocampus/knowledge/technical.md': `# Technical

- \`pg_stat_statements\` is enabled on the staging replica; reset after each audit so week-over-week numbers compare.
- The seam tests (\`npm run test:seams\`) take 4m 10s on the M4 Pro; run them before the simulator pass, never after.
- \`wrangler d1 execute --remote\` needs the account id in \`CLOUDFLARE_ACCOUNT_ID\`; the token alone 403s.
- EAS fingerprint drift shows up as a spurious native rebuild; \`npm run fix:fingerprint\` clears it.
- ffmpeg 7.1 is the version the media tests expect; Homebrew's default is fine.
`,
  'brain/hippocampus/knowledge/preferences.md': `# Preferences

- Tables before paragraphs, charts before tables.
- Spreadsheets: .xlsx, header row, frozen panes, one sheet per section.
- Reports: PDF. Anything to be edited: Markdown.
- Weekly digest Thursday 17:00.
- Nothing scheduled before 09:00; nothing to the phone after 23:00 unless a deploy failed.
`,
  'brain/hippocampus/knowledge/decisions.md': `# Decisions

- Flaky tests get quarantined behind \`@flaky\` for one sprint, then deleted if nobody fixes them (Reem, sprint 42 retro).
- Staging is read-only for the agent; production is off limits (agents.md, 2026-07).
- Release notes ship with the release, not after (Nawaf, 2.12 retro).
- Force-push to a shared branch is always an approval, even in workflow mode.
`,
  'files/README.md': `# files/

Deliverables the agent produced, grouped by kind:

- \`reports/<yyyy-mm>/\` — PDFs and Markdown reports
- \`sheets/\` — workbooks and CSV exports
- \`charts/\` — .chart.json specs beside the report that uses them
- \`drafts/\` — release notes, emails, tickets
- \`issues/\` — screenshots for bug reports, dated folders
`,
  ...PROJECT_FILES,
  ...PROCEDURE_FILES
}

function dir(name: string, relativePath: string, children: ViewerTreeNode[]): ViewerTreeNode {
  return { type: 'dir', name, relativePath, children }
}

function file(relativePath: string): ViewerTreeNode {
  return { type: 'file', name: relativePath.split('/').pop() ?? relativePath, relativePath }
}

const WORKSPACE_ROOTS = new Set(['brain', 'files', 'uploads', 'screenshots', 'speech', 'voice', 'extension'])

/**
 * Only paths that live in ~/.wfc/workspace belong in the tree. A conversation
 * also names repo files it patched (apps/…, .github/…) — those are on the
 * machine, not in the workspace, and send_file's copy of them lands in files/.
 */
function isWorkspacePath(p: string): boolean {
  const top = p.split('/')[0]
  return p === 'config.json' || WORKSPACE_ROOTS.has(top)
}

/** Builds the tree from every registered path plus the static skeleton. */
export function buildWorkspaceTree(extraPaths: string[]): ViewerTreeNode[] {
  const paths = new Set<string>([
    ...Object.keys(WORKSPACE_FILES),
    'brain/hippocampus/episodes/.gitkeep',
    'brain/hippocampus/consolidated/.gitkeep',
    'brain/corpus/.gitkeep',
    'brain/motor/tasks/.gitkeep',
    'config.json',
    ...extraPaths.filter(isWorkspacePath)
  ])
  type Node = { dirs: Map<string, Node>; files: Set<string> }
  const root: Node = { dirs: new Map(), files: new Set() }
  for (const p of paths) {
    const parts = p.split('/')
    let node = root
    for (let i = 0; i < parts.length - 1; i++) {
      let next = node.dirs.get(parts[i])
      if (!next) {
        next = { dirs: new Map(), files: new Set() }
        node.dirs.set(parts[i], next)
      }
      node = next
    }
    node.files.add(parts[parts.length - 1])
  }
  const emit = (node: Node, prefix: string): ViewerTreeNode[] => {
    const dirs = [...node.dirs.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, child]) => dir(name, prefix ? `${prefix}/${name}` : name, emit(child, prefix ? `${prefix}/${name}` : name)))
    const files = [...node.files]
      .filter((f) => f !== '.gitkeep')
      .sort((a, b) => a.localeCompare(b))
      .map((name) => file(prefix ? `${prefix}/${name}` : name))
    return [...dirs, ...files]
  }
  return emit(root, '')
}
