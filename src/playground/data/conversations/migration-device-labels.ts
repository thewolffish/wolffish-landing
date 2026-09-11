import { PRO } from '../catalog'
import { at } from '../clock'
import { PROJECT_PLATFORM } from '../projects'
import { ask, conversation, edit, reasoning, run, send, text, todo, tool } from './dsl'

const API = '~/dev/wolffish-cloud/apps/api'

const MIGRATION_SQL = `-- 0018_device_labels.sql
--
-- A person's own name for a paired phone ("work iPhone"), shown on the
-- device row in admin and in the phone's own settings.
--
-- Nullable on purpose: NULL means "never named", which the UI renders as the
-- model string. An empty string would mean "named it nothing" and the two
-- are different states — the second one should not be reachable, hence the
-- length check.

alter table devices add column label text;

alter table devices add constraint devices_label_len
  check (label is null or (length(label) between 1 and 40));

-- Admin lists devices for one org, newest first. The existing index is on
-- (user_id, created_at); the org join goes through users, so nothing new is
-- needed for the label itself.

update devices
   set label = null
 where label = '';
`

export const migrationDeviceLabels = conversation({
  id: 'conv-migration-device-labels',
  title: 'Draft the device-labels migration',
  channel: 'electron',
  projectId: PROJECT_PLATFORM,
  model: PRO,
  workingFolder: [API],
  files: {
    'files/drafts/0018_device_labels.sql': MIGRATION_SQL
  },
  turns: [
    {
      user: 'People want to name their phones — "work iPhone", "the old 13". Draft the migration and the API side. Migration stays a draft, I apply it.',
      at: at(2, 13, 20),
      steps: [
        reasoning(`Project rule, and it is the right one: a migration is drafted and handed back,
never applied from a conversation. So the deliverable is a file plus the exact
command, not a result.

One design decision I should not make alone, because it is visible in the
product rather than internal: what an unnamed device shows. NULL and empty
string are different states, and picking the wrong one means either a device
that displays nothing or a UI that has to treat two values as the same. Ask.

Before asking, read the table — the answer changes if there is already a
label-ish column or a NOT NULL habit on this table.`),
        tool(
          'd1_schema',
          { table: 'devices' },
          `CREATE TABLE devices (
  id           text primary key,
  user_id      text not null references users(id) on delete cascade,
  platform     text not null,          -- 'ios' | 'android'
  model        text,                   -- 'iPhone 17 Pro', 'Pixel 9'
  os_version   text,
  pair_method  text not null,          -- 'qr' | 'code'
  push_token   text,
  created_at   text not null,
  last_seen_at text
);
CREATE INDEX devices_user_created ON devices (user_id, created_at DESC);

Rows: 41. Columns model/os_version were added by 0016 and are nullable; 6 rows have model NULL (paired before 0016).`,
          { ms: 820 }
        ),
        ask(
          [
            {
              question: 'What should a device with no label show?',
              details:
                'The column can be nullable (NULL = never named) or NOT NULL DEFAULT \'\' (every row has a value). It decides what admin and the phone render, and whether "unnamed" is one state or two.',
              options: [
                {
                  label: 'Nullable — fall back to the model string',
                  description:
                    'NULL means never named; the UI shows "iPhone 17 Pro". Matches model/os_version, which 0016 made nullable for the same reason.'
                },
                {
                  label: "NOT NULL DEFAULT '' — show the model when empty",
                  description:
                    'Every row has a value. Simpler reads, but "" and "never named" become indistinguishable and the UI has to treat both as empty anyway.'
                },
                {
                  label: 'Nullable, and seed the label from the model on migrate',
                  description:
                    'Every existing device gets "iPhone 17 Pro" as its label. No fallback logic anywhere — but a rename of the model string no longer follows the device.'
                }
              ]
            }
          ],
          [{ option: 0 }],
          46_000
        ),
        todo([
          { content: 'Migration 0018: nullable label with a length check', status: 'in_progress', priority: 'high' },
          { content: 'PATCH /v1/devices/:id accepts a label', status: 'pending' },
          { content: 'Admin device row and the phone settings read it', status: 'pending' },
          { content: 'Seam test: rename, clear, and a 41-character refusal', status: 'pending', priority: 'high' },
          { content: 'Hand the apply command back — do not run it', status: 'pending', priority: 'high' }
        ]),
        tool(
          'file_write',
          { path: 'files/drafts/0018_device_labels.sql', content: MIGRATION_SQL },
          'Wrote files/drafts/0018_device_labels.sql (712 B, 26 lines). Draft only — this is not in apps/api/migrations, so nothing picks it up on deploy.',
          { ms: 150 }
        ),
        send('files/drafts/0018_device_labels.sql'),
        edit(
          `${API}/src/routes/devices.ts`,
          `--- a/src/routes/devices.ts
+++ b/src/routes/devices.ts
@@ -88,6 +88,34 @@ devices.get('/', async (c) => {
+
+const MAX_LABEL = 40
+
+devices.patch('/:id', async (c) => {
+  const user = c.get('user')
+  const id = c.req.param('id')
+  const body = await c.req.json<{ label?: string | null }>()
+
+  // Trimmed first, so "   " is a clear, not a one-space name. Clearing is
+  // an explicit null or an empty string; both land as NULL in the column.
+  const raw = typeof body.label === 'string' ? body.label.trim() : null
+  const label = raw && raw.length > 0 ? raw : null
+
+  if (label !== null && label.length > MAX_LABEL) {
+    return c.json(errors.badRequest(\`label must be \${MAX_LABEL} characters or fewer\`), 400)
+  }
+
+  const res = await c.env.DB.prepare(
+    'update devices set label = ? where id = ? and user_id = ? returning id, label'
+  )
+    .bind(label, id, user.id)
+    .first<{ id: string; label: string | null }>()
+
+  // Scoped to the caller's own devices: a wrong id and someone else's id are
+  // the same answer on purpose.
+  if (!res) return c.json(errors.notFound('device'), 404)
+  return c.json({ device: res })
+})`,
          { label: 'Edit', ms: 340 }
        ),
        edit(
          `${API}/test/seams/devices.test.ts`,
          `--- a/test/seams/devices.test.ts
+++ b/test/seams/devices.test.ts
@@ -44,4 +44,31 @@ describe('devices', () => {
+
+  it('names a device and clears the name again', async () => {
+    const named = await patchDevice(seamEnv, DEVICE_A, { label: 'work iPhone' })
+    expect(named.device.label).toBe('work iPhone')
+
+    const cleared = await patchDevice(seamEnv, DEVICE_A, { label: '  ' })
+    expect(cleared.device.label).toBeNull()
+  })
+
+  it('refuses a label over 40 characters', async () => {
+    const res = await patchDevice(seamEnv, DEVICE_A, { label: 'x'.repeat(41) }, { raw: true })
+    expect(res.status).toBe(400)
+  })
+
+  it("will not rename another user's device", async () => {
+    const res = await patchDevice(seamEnv, DEVICE_B_OTHER_USER, { label: 'mine now' }, { raw: true })
+    expect(res.status).toBe(404)
+  })`,
          { label: 'Edit', ms: 300 }
        ),
        run(
          'npm run test:seams -- devices',
          ` ✓ test/seams/devices.test.ts (7 tests) 402ms

 Test Files  1 passed (1)
      Tests  7 passed (7)
   Duration  1.44s

Note: run against the local D1 with 0018 applied to the LOCAL database only (--local). The remote is untouched.`,
          { label: 'Run tests', ms: 2_180 }
        ),
        todo([
          { content: 'Migration 0018: nullable label with a length check', status: 'completed', priority: 'high' },
          { content: 'PATCH /v1/devices/:id accepts a label', status: 'completed' },
          { content: 'Admin device row and the phone settings read it', status: 'pending' },
          { content: 'Seam test: rename, clear, and a 41-character refusal', status: 'completed', priority: 'high' },
          { content: 'Hand the apply command back — do not run it', status: 'in_progress', priority: 'high' }
        ]),
        text(`Draft is above, API side is written and its seam tests pass against a local D1 with 0018 applied locally. The remote has not been touched.

**Nullable it is** — NULL means never named, and the device row falls back to the model string, the same shape 0016 used for \`model\` and \`os_version\`.

Two details worth a look before you apply it:

- **Clearing.** \`PATCH\` with \`""\`, \`"   "\` or \`null\` all land as NULL. One state for "unnamed", which was the point of choosing nullable.
- **The length check is in two places** — the column constraint at 40 and the route at 40. The route's exists so the caller gets a 400 with a sentence instead of a D1 constraint error; the column's exists so a future writer that forgets the route cannot get past it.

To apply it yourself:

\`\`\`bash
npx wrangler d1 execute wolffish-prod --remote --file=files/drafts/0018_device_labels.sql
\`\`\`

The phone and admin UI read \`device.label\` once the column is there; I have not written those yet, since they are dead until it exists.`)
      ]
    },
    {
      user: 'Actually go ahead and run it on staging so I can click through it.',
      at: at(2, 14, 5),
      steps: [
        tool(
          'shell_exec',
          {
            command:
              'npx wrangler d1 execute wolffish-staging --remote --file=files/drafts/0018_device_labels.sql',
            cwd: API
          },
          'Denied by the user. Nothing ran; the staging database is unchanged.',
          {
            status: 'denied',
            ms: 31_000,
            approval: {
              reason: 'Runs a schema migration against a remote database.',
              level: 'destructive',
              title: 'Apply 0018 to wolffish-staging (remote)',
              description:
                'Adds a column and a check constraint to devices on the STAGING database, and rewrites any empty labels to NULL. D1 has no transactional DDL rollback — undoing this means writing 0019.',
              command: 'npx wrangler d1 execute wolffish-staging --remote --file=files/drafts/0018_device_labels.sql',
              impact: 'ALTER TABLE devices + 1 UPDATE, 41 rows in scope',
              risk: 'high',
              decision: 'denied'
            }
          }
        ),
        text(`Held — nothing ran, staging is untouched.

You were right to stop me: this one carries a \`check\` constraint, and D1 has no transactional DDL, so a bad ALTER is undone by writing 0019, not by rolling back. Staging is also what the phone demo points at.

When you want it, the same command with your own hands:

\`\`\`bash
npx wrangler d1 execute wolffish-staging --remote --file=files/drafts/0018_device_labels.sql
\`\`\`

\`\`\`bash
npx wrangler d1 execute wolffish-staging --remote --command "select count(*) named from devices where label is not null"
\`\`\`

The second one is the check afterwards — it should say 0, since nothing has been named yet.`)
      ]
    }
  ]
})
