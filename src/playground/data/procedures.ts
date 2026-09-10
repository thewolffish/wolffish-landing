import type { Procedure } from './types'
import { at } from './clock'
import {
  PROJECT_DOCS,
  PROJECT_HIRING,
  PROJECT_INFRA,
  PROJECT_MOBILE,
  PROJECT_PLATFORM
} from './projects'

/** Saved prompts Younes runs on demand — the recurring work of the job, one Play each. */
export const PROCEDURES: Procedure[] = [
  {
    id: 'prc_sprint_report',
    title: 'Sprint velocity report',
    prompt: `Build the sprint report from the Jira export I attach.

1. Velocity: committed vs completed story points, this sprint and the five before it, as a column chart.
2. Carry-over: every ticket that rolled, with how many sprints it has rolled.
3. A one-page PDF for the sprint review and the workbook behind it (one sheet per section, header row, frozen panes).

Ask me which teams to include before you build anything. Numbers come from the export, never from memory.`,
    mode: 'workflow',
    icon: '📊',
    projectId: PROJECT_PLATFORM,
    files: [{ path: 'uploads/procedure-sprint/velocity-template.md', name: 'velocity-template.md' }],
    createdAt: at(120, 10, 14),
    updatedAt: at(3, 9, 2)
  },
  {
    id: 'prc_slow_queries',
    title: 'Slow query audit',
    prompt: `Read-only audit of the staging Postgres through the replica.

Pull the top 20 statements by mean time from pg_stat_statements, paste the EXPLAIN ANALYZE for anything above 50 ms, and say which ones an index would fix. Draft the migration as a file and hand it back — never apply it.

Deliver: a CSV of the statements, a bar chart of mean time, the migration .sql, and a short runbook in Markdown.`,
    mode: 'single',
    icon: '🐘',
    projectId: PROJECT_PLATFORM,
    directories: ['~/dev/wolffish-cloud/apps/api'],
    createdAt: at(74, 15, 40),
    updatedAt: at(2, 11, 40)
  },
  {
    id: 'prc_release_notes',
    title: 'Release notes',
    prompt: `Draft the release notes for the branch I name.

Read the git log since the last tag, group by user-facing / admin / internal, and drop anything that is a refactor with no visible change. Twelve bullets maximum. One version in Markdown for the repo, one in Word for the customer email.

Ask me about audience and tone before writing.`,
    mode: 'single',
    icon: '🚢',
    projectId: PROJECT_PLATFORM,
    directories: ['~/dev/wolffish-cloud'],
    createdAt: at(98, 12, 0),
    updatedAt: at(1, 14, 5)
  },
  {
    id: 'prc_postmortem',
    title: 'Incident postmortem',
    prompt: `Write the postmortem for the incident whose logs I attach.

Build the timeline from the log timestamps, not from memory — first alert, detection, mitigation, resolution. Plot the error rate across the window. Name the root cause, the contributing factors, and three action items with an owner each.

Ask me the severity before you write the summary. Blameless, in the past tense, under two pages.`,
    mode: 'workflow',
    icon: '🚨',
    createdAt: at(66, 9, 30),
    updatedAt: at(5, 17, 10)
  },
  {
    id: 'prc_dependency_sweep',
    title: 'Dependency vulnerability sweep',
    prompt: `Run npm audit in every app of the monorepo and read the advisories.

Group by severity, say which ones are reachable from our code, and draft the upgrade plan as a workbook: package, current, target, breaking changes, owner. Install nothing without asking, and never push.`,
    mode: 'single',
    icon: '🛡️',
    directories: ['~/dev/wolffish-cloud'],
    createdAt: at(52, 10, 20),
    updatedAt: at(9, 13, 45)
  },
  {
    id: 'prc_crash_triage',
    title: 'Mobile crash triage',
    prompt: `Triage the crash export I attach.

Group by device and OS first, then by screen. Bar chart of crashes per device, a workbook with one sheet per top issue, and a draft Jira ticket for each cluster above 2% of sessions — title, steps, stack, affected versions.

Create nothing in Jira; hand the drafts back.`,
    mode: 'single',
    icon: '📱',
    projectId: PROJECT_MOBILE,
    createdAt: at(47, 11, 15),
    updatedAt: at(4, 16, 22)
  },
  {
    id: 'prc_cost_forecast',
    title: 'Infra cost forecast',
    prompt: `Forecast the next quarter's infrastructure spend from the invoices in the project files and the usage rollup.

Show the assumption beside every number. A line chart of actuals and forecast, a workbook with the model, and a two-page PDF memo for Dana. Riyal figures at 3.75, VAT shown separately.`,
    mode: 'workflow',
    icon: '💸',
    projectId: PROJECT_INFRA,
    createdAt: at(40, 14, 0),
    updatedAt: at(1, 9, 48)
  },
  {
    id: 'prc_takehome_review',
    title: 'Take-home review',
    prompt: `Score the take-home submission I attach against the rubric in the project files.

Read every file. Five criteria, 1 to 5 each, with the line or file that earned the score. A radar chart of the scores, then the candidate-facing feedback as a Word document: one thing to keep, one thing to change, no names in the file.`,
    mode: 'single',
    icon: '🧑‍💻',
    projectId: PROJECT_HIRING,
    createdAt: at(31, 16, 30),
    updatedAt: at(3, 15, 12)
  },
  {
    id: 'prc_docs_translate',
    title: 'Translate a docs page to Arabic',
    prompt: `Translate the Markdown page I attach into Arabic.

A full translation, not a summary. Keep every code block, path, flag and command in English. Western digits. Write the result as a .md next to the source and a .docx for review, and list any term you were unsure about with the choice you made.`,
    mode: 'single',
    icon: '🌐',
    projectId: PROJECT_DOCS,
    createdAt: at(28, 10, 45),
    updatedAt: at(6, 10, 5)
  },
  {
    id: 'prc_weekly_digest',
    title: 'Weekly engineering digest',
    prompt: `Write the week's engineering digest for Thursday 17:00.

What shipped, what slipped, what is now blocking something else — from the week's conversations, the merged PRs and the Jira board, not from memory. One chart of merged PRs per day. Close with the three things worth doing next week, ordered by what unblocks the most.

Deliver a PDF in the app and a five-line summary under it.`,
    mode: 'workflow',
    icon: '🗓️',
    createdAt: at(112, 9, 0),
    updatedAt: at(7, 17, 2)
  }
]

export const PROCEDURE_FILES: Record<string, string> = {
  'uploads/procedure-sprint/velocity-template.md': `# Sprint report template

## Velocity
Column chart: committed vs completed points, last six sprints.

## Carry-over
Table: ticket, points, sprints rolled, reason (from the ticket's last comment).

## Highlights
Three bullets, each naming a shipped ticket.

## Risks
Anything that will roll again next sprint unless something changes.
`
}
