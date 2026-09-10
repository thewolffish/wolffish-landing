import { at } from '../clock'
import { PROJECT_PLATFORM } from '../projects'
import { conversation, send, text, tool } from './dsl'

const CRON_SH = `#!/usr/bin/env bash
# Nightly: move conversations idle for 90+ days out of D1 and into R2.
# Installed on ops-01 as:  0 2 * * *  /opt/wolffish/ops/cron/archive-idle.sh
set -euo pipefail

CUTOFF_DAYS="\${CUTOFF_DAYS:-90}"
BATCH="\${BATCH:-500}"
LOG=/var/log/wolffish/archive-idle.log

export CLOUDFLARE_API_TOKEN="$(cat /etc/wolffish/cf-token)"
export CLOUDFLARE_ACCOUNT_ID="$(cat /etc/wolffish/cf-account)"

exec >>"$LOG" 2>&1
echo "=== $(date -Is) archive-idle start (cutoff=\${CUTOFF_DAYS}d batch=\${BATCH})"

cutoff=$(date -u -d "-\${CUTOFF_DAYS} days" +%Y-%m-%dT%H:%M:%SZ)

ids=$(npx wrangler d1 execute wolffish-prod --remote --json \\
  --command "SELECT id FROM conversations WHERE archived_at IS NULL AND updated_at < '\${cutoff}' LIMIT \${BATCH};" \\
  | jq -r '.[0].results[].id')

if [ -z "$ids" ]; then
  echo "nothing to archive"
  exit 0
fi

for id in $ids; do
  npx wrangler d1 execute wolffish-prod --remote --json \\
    --command "SELECT * FROM messages WHERE conversation_id = '$id' ORDER BY created_at;" > "/tmp/$id.json"
  npx wrangler r2 object put "wolffish-archive/conversations/$id.json" \\
    --file "/tmp/$id.json" --content-type application/json
  npx wrangler d1 execute wolffish-prod --remote \\
    --command "UPDATE conversations SET archived_at = datetime('now') WHERE id = '$id';"
done

echo "=== $(date -Is) archive-idle done: $(echo "$ids" | wc -l) archived"
`

const WORKFLOW_YML = `name: Archive idle conversations

on:
  schedule:
    # 23:00 UTC is 02:00 Asia/Riyadh — the same hour the ops-01 cron used.
    - cron: '0 23 * * *'
  workflow_dispatch:
    inputs:
      cutoff_days:
        description: Days of inactivity before a conversation is archived
        default: '90'
      batch:
        description: Maximum conversations to move in one run
        default: '500'
      dry_run:
        description: Count what would move and write nothing
        type: boolean
        default: false

concurrency:
  group: archive-idle
  cancel-in-progress: false

permissions:
  contents: read

jobs:
  archive:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    env:
      CLOUDFLARE_API_TOKEN: \${{ secrets.CLOUDFLARE_API_TOKEN }}
      CLOUDFLARE_ACCOUNT_ID: \${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      CUTOFF_DAYS: \${{ inputs.cutoff_days || '90' }}
      BATCH: \${{ inputs.batch || '500' }}
      DRY_RUN: \${{ inputs.dry_run || 'false' }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: npm

      - name: Install
        run: npm ci --workspace apps/api

      - name: Check D1 is reachable and count the backlog
        run: |
          npx wrangler d1 execute wolffish-prod --remote --json \\
            --command "SELECT COUNT(*) AS pending FROM conversations WHERE archived_at IS NULL AND updated_at < datetime('now', '-\${CUTOFF_DAYS} days');"

      - name: Archive
        run: npx tsx scripts/archive-idle.ts

      - name: Upload the run log
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: archive-idle-\${{ github.run_id }}
          path: archive-idle.log
          retention-days: 30
`

const SCRIPT_TS = `/**
 * Nightly archive: move conversations idle for CUTOFF_DAYS out of D1 and into
 * R2, one bounded batch per run. Replaces ops/cron/archive-idle.sh.
 *
 * Env: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, CUTOFF_DAYS, BATCH, DRY_RUN.
 */
import { execFileSync } from 'node:child_process'
import { appendFileSync, writeFileSync } from 'node:fs'

const DB = 'wolffish-prod'
const BUCKET = 'wolffish-archive'
const CUTOFF_DAYS = Number(process.env.CUTOFF_DAYS ?? '90')
const BATCH = Number(process.env.BATCH ?? '500')
const DRY_RUN = process.env.DRY_RUN === 'true'
const LOG = 'archive-idle.log'

type Row = { id: string }

function log(line: string): void {
  const stamped = new Date().toISOString() + ' ' + line
  console.log(stamped)
  appendFileSync(LOG, stamped + '\\n')
}

function wrangler(args: string[]): string {
  return execFileSync('npx', ['wrangler', ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'inherit']
  })
}

function d1<T>(sql: string): T[] {
  const raw = wrangler(['d1', 'execute', DB, '--remote', '--json', '--command', sql])
  const parsed = JSON.parse(raw) as Array<{ results?: T[] }>
  return parsed[0]?.results ?? []
}

function archive(id: string): void {
  const messages = d1<Record<string, unknown>>(
    "SELECT * FROM messages WHERE conversation_id = '" + id + "' ORDER BY created_at;"
  )
  const file = '/tmp/' + id + '.json'
  writeFileSync(file, JSON.stringify({ id, archivedAt: new Date().toISOString(), messages }))
  wrangler([
    'r2', 'object', 'put', BUCKET + '/conversations/' + id + '.json',
    '--file', file, '--content-type', 'application/json'
  ])
  // Only after the object exists. A crash between the two leaves the row
  // unarchived and the next run rewrites the same object — idempotent.
  d1("UPDATE conversations SET archived_at = datetime('now') WHERE id = '" + id + "';")
}

function main(): void {
  const cutoff = new Date(Date.now() - CUTOFF_DAYS * 86_400_000).toISOString()
  const rows = d1<Row>(
    "SELECT id FROM conversations WHERE archived_at IS NULL AND updated_at < '" +
      cutoff + "' ORDER BY updated_at LIMIT " + BATCH + ';'
  )
  log('cutoff=' + cutoff + ' candidates=' + rows.length + ' dry_run=' + DRY_RUN)
  if (rows.length === 0) return log('nothing to archive')
  if (DRY_RUN) return log('dry run — wrote nothing')

  const failed: string[] = []
  let done = 0
  for (const row of rows) {
    try {
      archive(row.id)
      done += 1
    } catch (err) {
      failed.push(row.id)
      log('FAILED ' + row.id + ': ' + (err as Error).message)
    }
  }
  log('archived=' + done + ' failed=' + failed.length)
  if (failed.length * 10 > rows.length) {
    log('over 10% of the batch failed — exiting non-zero so the run is visible')
    process.exit(1)
  }
}

main()
`

export const githubActionsMigration = conversation({
  id: 'conv-github-actions-migration',
  title: 'Nightly archive cron moved to GitHub Actions',
  channel: 'electron',
  projectId: PROJECT_PLATFORM,
  files: {
    'ops/cron/archive-idle.sh': CRON_SH,
    '.github/workflows/archive-idle.yml': WORKFLOW_YML,
    'scripts/archive-idle.ts': SCRIPT_TS
  },
  turns: [
    {
      user: 'The nightly archive still runs off ops-01 as a cron. Move it to a GitHub Actions workflow — nobody should have to ssh into a box to find out whether last night ran.',
      at: at(7, 12, 30),
      steps: [
        text('Reading the current script first so the workflow keeps the same behaviour, then porting the loop to TypeScript so it can fail loudly.'),
        tool(
          'file_read',
          { path: 'ops/cron/archive-idle.sh' },
          `36 lines, bash, set -euo pipefail.

What it does: reads the Cloudflare token from /etc/wolffish/cf-token, selects up
to BATCH conversations with archived_at IS NULL and updated_at older than
CUTOFF_DAYS, dumps each one's messages to /tmp, puts the JSON in R2, then stamps
archived_at. Appends to /var/log/wolffish/archive-idle.log.

Four things do not survive a move as-is:
  - the token comes from a file on the box (-> repository secrets)
  - date -u -d is GNU date; runners have it, macOS does not (-> compute in TS)
  - no concurrency guard: a slow run and the next night's run overlap
  - a failed R2 put kills the whole run at that item, and nobody sees the log`,
          { ms: 240 }
        ),
        tool(
          'shell_exec',
          { command: 'ssh ops-01 "crontab -l | grep archive"', cwd: '~/dev/wolffish-cloud' },
          `0 2 * * * /opt/wolffish/ops/cron/archive-idle.sh

Last four runs, from /var/log/wolffish/archive-idle.log:
  2026-08-29T02:00:04+03:00 done: 500 archived
  2026-08-30T02:00:03+03:00 done: 500 archived
  2026-08-31T02:00:05+03:00 done: 341 archived
  2026-09-01T02:00:04+03:00 done: 0 archived  (nothing to archive)`,
          { ms: 2_180 }
        ),
        text('Backlog is drained — the last two nights moved 341 and 0. That means the first scheduled run on Actions should be small, which is the right time to switch. Writing the workflow and the script.'),
        tool(
          'file_write',
          { path: '.github/workflows/archive-idle.yml', content: WORKFLOW_YML },
          'Wrote .github/workflows/archive-idle.yml (1.8 KB)',
          { ms: 180 }
        ),
        tool(
          'file_write',
          { path: 'scripts/archive-idle.ts', content: SCRIPT_TS },
          'Wrote scripts/archive-idle.ts (2.6 KB)',
          { ms: 210 }
        ),
        send('.github/workflows/archive-idle.yml'),
        send('scripts/archive-idle.ts'),
        text(`Four differences from the cron, all deliberate:

- **\`concurrency: { group: archive-idle, cancel-in-progress: false }\`** — a run that overruns queues the next one instead of racing it. The cron had nothing.
- **One item failing no longer kills the run.** Each conversation is tried, failures are collected, and the job exits non-zero only if more than 10% of the batch failed. That keeps a single bad blob from stalling the backlog.
- **R2 put happens before the D1 stamp.** A crash between them leaves the row unarchived and the next run rewrites the same object — replaying is a no-op, which is the convention in the project file.
- **The log is an artifact**, kept 30 days, so "did last night run" is a link rather than an ssh session.

Type-checking and dry-running it now.`),
        tool(
          'shell_exec',
          { command: 'npx tsc --noEmit -p tsconfig.json', cwd: '~/dev/wolffish-cloud' },
          'Done in 4.8s. 0 errors.',
          { ms: 4_920 }
        ),
        tool(
          'shell_exec',
          { command: 'act -j archive --dryrun', cwd: '~/dev/wolffish-cloud' },
          `Error: Could not find any stages to run. View the valid jobs with 'act --list'.

Note: the default event is 'push'. archive-idle.yml is triggered by schedule and
workflow_dispatch only.`,
          { ms: 1_240, status: 'failed', error: 'no stages to run for event push' }
        ),
        tool(
          'shell_exec',
          { command: 'act schedule -j archive --dryrun', cwd: '~/dev/wolffish-cloud' },
          `[Archive idle conversations/archive] 🚀  Start image=catthehacker/ubuntu:act-latest
[Archive idle conversations/archive]   🐳  docker pull image=catthehacker/ubuntu:act-latest platform= username= forcePull=false
*DRYRUN* [Archive idle conversations/archive] ⭐ Run Main actions/checkout@v4
*DRYRUN* [Archive idle conversations/archive] ⭐ Run Main actions/setup-node@v4
*DRYRUN* [Archive idle conversations/archive] ⭐ Run Main Install
*DRYRUN* [Archive idle conversations/archive]   🐳  docker exec cmd=[npm ci --workspace apps/api]
*DRYRUN* [Archive idle conversations/archive] ⭐ Run Main Check D1 is reachable and count the backlog
*DRYRUN* [Archive idle conversations/archive] ⭐ Run Main Archive
*DRYRUN* [Archive idle conversations/archive]   🐳  docker exec cmd=[npx tsx scripts/archive-idle.ts]
*DRYRUN* [Archive idle conversations/archive] ⭐ Run Post Upload the run log
[Archive idle conversations/archive]   ✅  Success - Main archive

Warning: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are empty locally. Both
resolve from repository secrets on the runner; act does not read them.`,
          { ms: 6_410 }
        ),
        tool(
          'shell_exec',
          {
            command:
              'git checkout -b chore/archive-idle-action && git add .github/workflows/archive-idle.yml scripts/archive-idle.ts && git commit -m "chore(ops): run the nightly archive on GitHub Actions"',
            cwd: '~/dev/wolffish-cloud'
          },
          `Switched to a new branch 'chore/archive-idle-action'
[chore/archive-idle-action 3f9c1de] chore(ops): run the nightly archive on GitHub Actions
 2 files changed, 144 insertions(+)
 create mode 100644 .github/workflows/archive-idle.yml
 create mode 100644 scripts/archive-idle.ts`,
          { ms: 880 }
        ),
        tool(
          'shell_exec',
          { command: 'git push -u origin chore/archive-idle-action', cwd: '~/dev/wolffish-cloud' },
          `Enumerating objects: 12, done.
Counting objects: 100% (12/12), done.
Writing objects: 100% (7/7), 3.41 KiB | 3.41 MiB/s, done.
remote: Resolving deltas: 100% (3/3), completed with 3 local objects.
remote:
remote: Create a pull request for 'chore/archive-idle-action' on GitHub by visiting:
remote:      https://github.com/wolffish-inc/wolffish-cloud/pull/new/chore/archive-idle-action
remote:
To github.com:wolffish-inc/wolffish-cloud.git
 * [new branch]      chore/archive-idle-action -> chore/archive-idle-action
branch 'chore/archive-idle-action' set up to track 'origin/chore/archive-idle-action'.`,
          {
            ms: 2_640,
            approval: {
              reason: 'Pushing publishes a branch to the shared remote.',
              level: 'confirm',
              title: 'Push chore/archive-idle-action to origin',
              description:
                'One commit, 3f9c1de: .github/workflows/archive-idle.yml and scripts/archive-idle.ts, 144 lines added, nothing deleted. tsc clean, act dry-run clean.',
              command: 'git push -u origin chore/archive-idle-action',
              impact: 'Creates the branch on GitHub. The schedule does not start until the workflow is on the default branch, so pushing this branch runs nothing.',
              risk: 'low',
              decision: 'approved'
            }
          }
        ),
        tool(
          'create_pull_request',
          {
            owner: 'wolffish-inc',
            repo: 'wolffish-cloud',
            title: 'chore(ops): run the nightly archive on GitHub Actions',
            head: 'chore/archive-idle-action',
            base: 'main',
            draft: false,
            body: 'Replaces the ops-01 cron with a scheduled workflow. Same 02:00 Riyadh hour, same cutoff and batch, plus a concurrency group, per-item failure handling and the run log as an artifact. Secrets needed before merge: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID.'
          },
          `{
  "number": 1829,
  "html_url": "https://github.com/wolffish-inc/wolffish-cloud/pull/1829",
  "state": "open",
  "draft": false,
  "head": { "ref": "chore/archive-idle-action", "sha": "3f9c1de" },
  "base": { "ref": "main" },
  "additions": 144,
  "deletions": 0,
  "changed_files": 2,
  "mergeable_state": "blocked",
  "requested_reviewers": []
}

mergeable_state is "blocked" until a review is added — branch protection on main.`,
          { ms: 2_310 }
        ),
        text(`Up as [#1829](https://github.com/wolffish-inc/wolffish-cloud/pull/1829), blocked on review only.

| | ops-01 cron | GitHub Actions |
| --- | --- | --- |
| Schedule | \`0 2 * * *\` local | \`0 23 * * *\` UTC — the same 02:00 Riyadh |
| Credentials | \`/etc/wolffish/cf-token\` on the box | repository secrets |
| Overlapping runs | possible | \`concurrency: archive-idle\`, queued not cancelled |
| One item fails | run dies there | logged, counted, run continues |
| "Did it run?" | ssh + tail a log | the run page, log kept 30 days |
| Manual run | ssh and execute | \`workflow_dispatch\` with cutoff, batch, dry-run |

Three things to watch on the first scheduled run:

- **Add the two secrets before merging.** \`CLOUDFLARE_API_TOKEN\` and \`CLOUDFLARE_ACCOUNT_ID\` are not in the repo yet — Bandar owns that account. Without them the job fails at the D1 count step, which is the cheapest place to fail.
- **A scheduled workflow only starts once it is on \`main\`,** and GitHub queues schedule events under load, so 23:00 UTC means "at or after". Run it once with \`workflow_dispatch\` and \`dry_run: true\` after merge rather than waiting a night to learn something.
- **I have not touched ops-01.** The crontab entry is still there and will run tonight. Two runs on the same table are safe — the second finds nothing to archive — but the line should come out on the day this merges, and removing it from a box is yours, not mine.`)
      ]
    }
  ]
})
