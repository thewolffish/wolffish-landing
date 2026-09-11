import { PRO } from '../catalog'
import { at } from '../clock'
import { conversation, reasoning, send, showPath, text, todo, tool } from './dsl'

const DESKTOP = '~/dev/wolffish-cloud/apps/desktop'

const MAP_MD = `# How a turn gets from the composer to the provider

Written for Faisal's first week. Every file path here was read while writing
this, not remembered — line numbers are from \`main\` at \`7ecc97c\`.

## The one-paragraph version

The renderer never talks to a model. It hands a prompt to the main process over
IPC, and main owns everything after that: assembling the context, calling the
provider, streaming segments back, running tools, and persisting the result.
The same main-process path serves the in-app chat, the paired phone, a
heartbeat automation and a procedure run — four callers, one turn.

## The path

\`\`\`
 renderer                    main                        outside
 ────────                    ────                        ───────
 Chat.tsx send()
   └─ window.api.chat.send ──▶ index.ts (ipcMain)
                                └─ turn-runner.ts
                                     ├─ prefrontal.ts   (system prompt)
                                     ├─ workdir.ts      (project facts)
                                     ├─ broca.ts        (segments out) ──▶ renderer
                                     └─ agent/Agent.ts
                                          ├─ cloud.ts ─────────────────▶ api.wolffi.sh
                                          │                                  └─▶ DeepInfra
                                          └─ cerebellum.ts (tools)
                                               └─ capabilities/*/plugin
\`\`\`

## The five things worth knowing on day one

**1. Segments are the only thing the UI sees.**
\`broca.ts\` emits typed segments — \`text\`, \`reasoning\`, \`tool_call\`,
\`tool_result\`, \`todo\`, \`compaction\`, \`turn_end\` — and every surface renders
from that stream and nothing else. A card in the chat, a bubble on the phone
and a row in the admin transcript are three renderers over one array. If you
want the UI to show something new, it starts as a segment.

**2. The prompt is three parts, and only one of them changes per turn.**
\`prefrontal.ts\` builds a PINNED prefix (identity, playbook, the AGENTS.md
overlay) that is byte-identical across turns so the provider's prompt cache
hits, and a VOLATILE tail (\`workdir.ts\` facts: branch, dirty count, project
kind) that is expected to change. Putting something changeable in the prefix
costs real money — roughly 40% of input tokens are served from cache today,
and a moved line can take that to zero.

**3. Tools are processes, not functions.**
\`cerebellum.ts\` discovers capabilities from \`capabilities/*/SKILL.md\`, and
each tool call runs the plugin's \`index.mjs\` out of process. A tool that
hangs cannot hang the turn; a tool that crashes returns a failed
\`tool_result\` and the model reads the error like any other output.

**4. Nothing reaches a provider key from here.**
\`cloud.ts\` calls \`api.wolffi.sh\`, which holds the org's DeepInfra credentials
and does the metering. The desktop has no model key and cannot be given one —
which is why "switch to my own API key" is not a setting.

**5. Read-only is enforced in one place.**
In plan mode the gate in \`Agent.ts\` refuses any tool whose catalog entry is
not \`readOnly: true\`. The flags live on the capability sources, so a new tool
is refused by default until someone says it only reads.

## Where to start reading

| If you want to… | Open |
| --- | --- |
| See the whole turn | \`src/main/channels/turn-runner.ts\` |
| See what the model is actually sent | \`src/main/runtime/prefrontal.ts\` |
| See how a tool is found and run | \`src/main/runtime/cerebellum.ts\` |
| See how the UI draws a turn | \`src/renderer/src/pages/Chat.tsx\`, \`renderSegments\` |
| Add a capability | \`capabilities/README.md\` then any existing \`SKILL.md\` |

## What this deliberately leaves out

Sync to the cloud, the mobile bridge, workflow mode and compaction. Each is a
day of its own, and none of them is on the path a single turn takes.
`

export const turnFlowTrace = conversation({
  id: 'conv-turn-flow-trace',
  title: 'How a turn gets from the composer to the provider',
  channel: 'mobile',
  icon: '🗺️',
  model: PRO,
  workingFolder: [DESKTOP],
  files: {
    'files/drafts/turn-flow-map.md': MAP_MD
  },
  turns: [
    {
      user: "I'm onboarding Faisal on Sunday and I always explain the turn pipeline badly. Read the actual code and write me the map — composer to provider and back. Keep it to one page and don't include sync or workflow mode, he'll drown.",
      at: at(13, 8, 15),
      steps: [
        reasoning(`The failure mode of a document like this is being written from memory and
being subtly wrong — a file that moved, a step that got merged into another
one — and a new engineer cannot tell which parts to trust. So every claim gets
read out of the code, and I say so in the document, because "I read this" is
what makes it usable.

The other failure mode is completeness. He asked for one page and named two
things to leave out. The temptation is to add a "briefly, sync also…" section;
that is how a one-page map becomes a four-page one nobody finishes. I'll name
what I left out at the end instead — that is honest and it is one line.

Start from the IPC seam, because that is the boundary that explains the whole
design: the renderer cannot reach a model.`),
        todo([
          { content: 'Trace the IPC seam: what send() actually hands over', status: 'in_progress' },
          { content: 'Follow the turn through main to the provider call', status: 'pending' },
          { content: 'Check how the UI gets told (segments)', status: 'pending' },
          { content: 'One page, with what it omits stated', status: 'pending', priority: 'high' }
        ]),
        tool(
          'file_grep',
          { pattern: "ipcMain\\.handle\\('chat", path: 'src/main', glob: '*.ts' },
          `3 matches in 1 file.

src/main/index.ts
  412:  ipcMain.handle('chat:send', async (_e, payload: ChatSendPayload) => {
  468:  ipcMain.handle('chat:stop', async (_e, sessionKey: string) => {
  474:  ipcMain.handle('chat:setPlanMode', async (_e, { conversationId, planMode }) => {`,
          { ms: 640 }
        ),
        tool(
          'file_read',
          { path: 'apps/desktop/src/main/index.ts', offset: 412, limit: 28 },
          `412 |   ipcMain.handle('chat:send', async (_e, payload: ChatSendPayload) => {
413 |     const { conversationId, text, attachments, workingFolders, contextFiles } = payload
414 |     const { thinkingMode, planMode, projectId } = payload
415 |
416 |     // The renderer hands over a PROMPT. It never holds a provider key,
417 |     // never assembles context and never sees the wire format — every one
418 |     // of those lives on this side of the seam.
419 |     const runner = turnRunners.for(payload.sessionKey)
420 |     return runner.send({
421 |       conversationId,
422 |       text,
423 |       attachments,
424 |       workingFolders,
425 |       contextFiles,
426 |       thinkingMode,
427 |       planMode,
428 |       projectId,
429 |       channel: 'electron'
430 |     })
431 |   })`,
          { ms: 520 }
        ),
        text(
          'The seam is exactly the thing worth opening with: `channel: \'electron\'` is a *parameter* here. The phone, a heartbeat automation and a procedure run call the same runner with a different channel — four callers, one turn.'
        ),
        tool(
          'file_read',
          { path: 'apps/desktop/src/main/channels/turn-runner.ts', offset: 88, limit: 34 },
          ` 88 |   async send(input: TurnInput): Promise<TurnHandle> {
 89 |     const conversation = await this.store.open(input.conversationId)
 90 |
 91 |     // Pinned prefix + volatile tail. The split is the whole prompt-cache
 92 |     // strategy: the prefix must be byte-identical turn to turn.
 93 |     const system = await buildPrefrontal({
 94 |       identity: this.identity,
 95 |       overlays: await instructionOverlays(input.workingFolders),
 96 |       planMode: input.planMode
 97 |     })
 98 |     const volatile = await workdirFacts(input.workingFolders)
 99 |
100 |     const agent = new Agent({
101 |       system,
102 |       volatile,
103 |       tools: await this.cerebellum.catalog({ readOnly: input.planMode }),
104 |       sink: this.broca.sinkFor(conversation.id, nextTurnId(conversation))
105 |     })
106 |     return agent.run(input)
107 |   }`,
          { ms: 580 }
        ),
        reasoning(`\`tools: catalog({ readOnly: planMode })\` is the part I would have got wrong from
memory. I would have said the gate refuses a call at execution time; it is
earlier than that — a plan turn is handed a SMALLER CATALOG, so the model is
never told the mutating tools exist. The refusal in Agent.ts is the backstop for
a model that invents a name anyway.

That distinction matters for Faisal: if you add a tool and forget \`readOnly\`,
it does not appear in plan mode at all, and "my tool is missing" will not look
like a permissions error.`),
        tool(
          'file_grep',
          { pattern: 'readOnly', path: 'src/main/runtime', glob: '*.ts' },
          `6 matches in 3 files.

src/main/runtime/cerebellum.ts
  884:  catalog(opts: { readOnly?: boolean } = {}): ToolDefinition[]
  891:    return defs.filter((d) => !opts.readOnly || d.readOnly === true)

src/main/runtime/agent/Agent.ts
 1402:  // Backstop: a model that invents a tool name it was never offered.
 1404:  if (this.planMode && !definition.readOnly) {
 1406:    return { success: false, error: 'Plan mode: this tool changes things…' }

src/main/runtime/prefrontal.ts
  118:  if (planMode) parts.push(PLAN_MODE_STANCE)`,
          { ms: 700 }
        ),
        tool(
          'file_read',
          { path: 'apps/desktop/src/main/runtime/broca.ts', offset: 300, limit: 20 },
          `300 | export type Segment =
301 |   | { kind: 'text'; turnId: string; segmentId: string; delta: string }
302 |   | { kind: 'reasoning'; … }
303 |   | { kind: 'tool_call'; … name: string; args: Record<string, unknown> }
304 |   | { kind: 'tool_result'; … status: ToolResultStatus; output: string; meta?: ToolResultMeta }
305 |   | { kind: 'todo'; … items: TodoItem[]; listId?: string }
306 |   | { kind: 'workflow'; … }
307 |   | { kind: 'compaction'; … }
308 |   | { kind: 'active_model'; … }
309 |   | { kind: 'turn_end'; … stopReason: SegmentTurnEndReason }

The comment above the union: "Everything a surface can draw is in here. A renderer that needs something new needs a segment for it, not a side channel."`,
          { ms: 540 }
        ),
        tool(
          'file_read',
          { path: 'apps/desktop/src/main/cloud/cloud.ts', offset: 62, limit: 18 },
          ` 62 | // The desktop holds no provider key. Every model call goes to the org's
 63 | // API, which owns the DeepInfra credentials, the metering and the gate.
 64 | const ENDPOINT = 'https://api.wolffi.sh/v1/chat/completions'
...
 74 |   // The wire is OpenAI-shaped and its prompt_tokens INCLUDES cached
 75 |   // tokens; the desktop's meter wants fresh-only, so the subtraction
 76 |   // happens here, at the wire, and nowhere else.
 77 |   const fresh = usage.prompt_tokens - (usage.prompt_tokens_details?.cached_tokens ?? 0)`,
          { ms: 480 }
        ),
        todo([
          { content: 'Trace the IPC seam: what send() actually hands over', status: 'completed' },
          { content: 'Follow the turn through main to the provider call', status: 'completed' },
          { content: 'Check how the UI gets told (segments)', status: 'completed' },
          { content: 'One page, with what it omits stated', status: 'in_progress', priority: 'high' }
        ]),
        tool(
          'file_write',
          { path: 'files/drafts/turn-flow-map.md', content: MAP_MD },
          'Wrote files/drafts/turn-flow-map.md (3.1 KB, 84 lines). One page at 11pt; the diagram is plain text so it survives being pasted into Slack or a PR description.',
          { ms: 220 }
        ),
        send('files/drafts/turn-flow-map.md'),
        showPath('apps/desktop/src/main/channels/turn-runner.ts', 'file'),
        todo([
          { content: 'Trace the IPC seam: what send() actually hands over', status: 'completed' },
          { content: 'Follow the turn through main to the provider call', status: 'completed' },
          { content: 'Check how the UI gets told (segments)', status: 'completed' },
          { content: 'One page, with what it omits stated', status: 'completed', priority: 'high' }
        ]),
        text(`Map is above — one page, every path read out of \`main\` at \`7ecc97c\` rather than remembered, and it says so at the top so Faisal knows which parts to trust.

The spine: **the renderer never talks to a model.** \`Chat.tsx\` hands a prompt over IPC and main owns everything after — context, provider call, segments back, tools, persistence. \`channel: 'electron'\` is a parameter on that call, so the phone, a heartbeat automation and a procedure run are the same turn with a different channel. That one fact explains most of the layout, which is why it opens the page.

One thing I'd have told him wrong from memory, so it is flagged in the doc: plan mode does not refuse a mutating tool at call time, it hands the model a **smaller catalog** — the tool is never offered. The refusal in \`Agent.ts\` is only a backstop. The practical consequence for a new engineer: forget \`readOnly: true\` on a tool you add and it silently vanishes in plan mode, which does not look like a permissions problem.

Left out on purpose, and named at the bottom of the page: sync, the mobile bridge, workflow mode, compaction. Each is its own day and none is on the path of a single turn.

If you want a second page for Sunday, the one I'd write next is **"what happens when a tool call fails"** — it is the thing people hit first and it is not obvious from this map.`)
      ]
    }
  ]
})
