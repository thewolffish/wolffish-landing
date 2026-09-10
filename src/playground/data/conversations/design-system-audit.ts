import { VISION } from '../catalog'
import { at } from '../clock'
import { PROJECT_DOCS } from '../projects'
import { conversation, send, text, tool } from './dsl'

const AUDIT_MD = `# Settings panel — design audit

**Screenshot:** \`uploads/conv-design/settings-screenshot.png\` (1440 × 900, desktop, light theme)
**Compared against:** the house tokens — \`#1b365d\` ink, \`#00d4ff\` accent, \`#f0f4f8\` surface — and the docs style guide
**Also checked:** the same panel as it renders on the staging docs page, \`files/issues/2026-09/docs-settings-page.png\`

## Findings

| # | Element | Finding | Severity | Fix |
| ---: | --- | --- | --- | --- |
| 1 | Toggle track, "Stream responses" | Track \`#c8d2de\` on the card \`#f0f4f8\` measures 1.38:1. WCAG 1.4.11 wants 3:1 for a control boundary, so the off state is invisible to anyone who is not looking for it. | Blocker | Track \`#748aa0\` — 3.23:1 on the same surface, no other change. |
| 2 | Primary button, "Save changes" | White label on \`#00d4ff\` measures 1.77:1. The accent is a background colour, not a button fill. | Major | \`#1b365d\` label on \`#00d4ff\` — 6.85:1. Or keep white and fill with \`#1b365d\`. |
| 3 | Model select | No focus ring. Tabbing through the panel loses the caret entirely at this control. | Major | The house 2px \`#00d4ff\` outline at 2px offset, same as every other select. |
| 4 | Section labels | Labels render at 13px against 14px body text. One pixel is not a step — it reads as a rendering bug, not a hierarchy. | Major | Both at 14px/1.5, label at weight 600. |
| 5 | Row rhythm | Vertical gaps between the four rows are 12, 16, 12 and 20 px. | Major | One 16px rhythm for all four. |
| 6 | Card padding | 20px top, 16px left and right, 24px bottom. | Minor | 20px on all four sides. |
| 7 | Dividers | A 1px \`#e4e9f0\` rule sits above the last row only. Either every row is separated or none is. | Minor | Drop it; the 16px rhythm carries the separation. |
| 8 | Helper text | \`#7b8794\` on white is 3.66:1. That passes at 14px and above; this text is 13px, so it does not. | Minor | \`#5c6b7a\` — 5.47:1 — or take the text to 14px. |
| 9 | Wording | The label says "Model"; the docs page and the API both say "Default model". | Nit | Use "Default model". |
| 10 | Chevrons | 16px in the model row, 14px in the language row. | Nit | 16px everywhere. |

## Counts

| Severity | Count |
| --- | ---: |
| Blocker | 1 |
| Major | 4 |
| Minor | 3 |
| Nit | 2 |
| **Total** | **10** |

## Note on the staging page

The docs screenshot shows the same panel one release behind: the toggle there is still the old \`#1b365d\` track, which passes contrast. Findings 1 and 2 arrived with the current build, so the docs screenshots have to be retaken after the fix regardless of what else changes.
`

const SEVERITY_CHART = JSON.stringify(
  {
    type: 'bar',
    title: 'Settings panel audit — findings by severity',
    subtitle: '10 findings against the house tokens and the docs style guide',
    categories: ['Blocker', 'Major', 'Minor', 'Nit'],
    series: [{ name: 'Findings', data: [1, 4, 3, 2], color: 2 }],
    unit: { suffix: ' findings' },
    legend: false,
    footnote:
      'Blocker: toggle track at 1.38:1 against the card. Major: button label 1.77:1, missing focus ring, 13px/14px label scale, uneven row rhythm. Source: files/reports/2026-09/design-audit-settings.md.'
  },
  null,
  2
)

const MOCKUP_HTML = `<!-- Settings panel, house tokens applied. Every number here is the fix from the audit. -->
<style>
  :root {
    --ink: #1b365d;
    --accent: #00d4ff;
    --surface: #f0f4f8;
    --card: #ffffff;
    --muted: #5c6b7a;
    --track-off: #748aa0;
    --radius: 10px;
    --rhythm: 16px;
  }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 32px; background: var(--surface); color: var(--ink);
         font: 14px/1.5 "IBM Plex Sans", system-ui, -apple-system, sans-serif; }
  .card { max-width: 520px; margin: 0 auto; background: var(--card); border-radius: var(--radius);
          padding: 20px; box-shadow: 0 1px 2px rgba(27, 54, 93, .08), 0 8px 24px rgba(27, 54, 93, .06); }
  h1 { margin: 0 0 var(--rhythm); font-size: 18px; font-weight: 600; letter-spacing: -.01em; }
  .row { display: flex; align-items: center; justify-content: space-between; gap: 24px;
         padding: 0 0 var(--rhythm); }
  .row:last-of-type { padding-bottom: 0; }
  .label { font-size: 14px; font-weight: 600; }
  .help { margin-top: 2px; font-size: 14px; font-weight: 400; color: var(--muted); }
  select { appearance: none; min-width: 190px; padding: 8px 34px 8px 12px; border-radius: 8px;
           border: 1px solid #d4dde8; background-color: var(--card); background-repeat: no-repeat;
           background-position: right 10px center;
           background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none' stroke='%231b365d' stroke-width='1.6'><path d='M4 6.5 8 10.5 12 6.5'/></svg>");
           color: var(--ink); font: inherit; }
  select:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-color: var(--ink); }
  .toggle { position: relative; width: 44px; height: 24px; flex: none; }
  .toggle input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
  .track { display: block; width: 100%; height: 100%; border-radius: 999px;
           background: var(--track-off); transition: background .15s ease; }
  .knob { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%;
          background: var(--card); box-shadow: 0 1px 2px rgba(27, 54, 93, .35); transition: transform .15s ease; }
  .toggle input:checked ~ .track { background: var(--ink); }
  .toggle input:checked ~ .knob { transform: translateX(20px); }
  .toggle input:focus-visible ~ .track { outline: 2px solid var(--accent); outline-offset: 2px; }
  .actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
  button { font: inherit; font-weight: 600; border-radius: 8px; padding: 9px 18px; cursor: pointer; }
  .primary { background: var(--accent); color: var(--ink); border: 1px solid transparent; }
  .primary:hover { background: #17c4ec; }
  .primary:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
  .ghost { background: transparent; color: var(--ink); border: 1px solid #d4dde8; }
</style>

<div class="card">
  <h1>Settings</h1>

  <div class="row">
    <div>
      <div class="label">Default model</div>
      <div class="help">Used for every new conversation.</div>
    </div>
    <select aria-label="Default model">
      <option>DeepSeek V4 Flash</option>
      <option>DeepSeek V4 Pro</option>
      <option>DeepSeek V4 Flash Vision</option>
    </select>
  </div>

  <div class="row">
    <div>
      <div class="label">Language</div>
      <div class="help">Interface and agent replies.</div>
    </div>
    <select aria-label="Language">
      <option>English</option>
      <option>العربية</option>
    </select>
  </div>

  <div class="row">
    <div>
      <div class="label">Stream responses</div>
      <div class="help">Show tokens as they arrive instead of waiting for the turn.</div>
    </div>
    <span class="toggle">
      <input type="checkbox" aria-label="Stream responses" />
      <span class="track"></span>
      <span class="knob"></span>
    </span>
  </div>

  <div class="row">
    <div>
      <div class="label">Send crash reports</div>
      <div class="help">Device model and stack trace only. No conversation content.</div>
    </div>
    <span class="toggle">
      <input type="checkbox" aria-label="Send crash reports" checked />
      <span class="track"></span>
      <span class="knob"></span>
    </span>
  </div>

  <div class="actions">
    <button class="ghost" type="button">Cancel</button>
    <button class="primary" type="button">Save changes</button>
  </div>
</div>
`

export const designSystemAudit = conversation({
  id: 'conv-design-system-audit',
  title: 'Settings panel audit against the house style',
  channel: 'electron',
  projectId: PROJECT_DOCS,
  model: VISION,
  files: {
    'files/reports/2026-09/design-audit-settings.md': AUDIT_MD,
    'files/charts/design-audit-severity.chart.json': SEVERITY_CHART,
    'files/drafts/settings-panel-mockup.html': MOCKUP_HTML
  },
  turns: [
    {
      user: 'Docs screenshots get taken this week and the settings panel looks off. Audit it against our tokens — 1b365d, 00d4ff, f0f4f8 — and tell me what actually has to change before Sara sees it.',
      attachments: ['uploads/conv-design/settings-screenshot.png'],
      at: at(14, 14, 40),
      steps: [
        text('Reading the screenshot first, then the same panel on staging so I can tell a new regression from something that always looked like that.'),
        tool(
          'image_view',
          { path: 'uploads/conv-design/settings-screenshot.png' },
          `1440 × 900 PNG, light theme, one card centred on the page.

Layout: a "Settings" heading, then four rows — Model (select), Language (select), Stream responses (toggle), Send crash reports (toggle) — then Cancel and "Save changes".

Measured off the pixels:
· Row gaps: 12 px, 16 px, 12 px, 20 px. No consistent rhythm.
· Card padding: 20 px top, 16 px left and right, 24 px bottom.
· Section labels render at 13 px; body and helper text at 14 px and 13 px respectively.
· Toggle track (off state) samples #c8d2de on a card of #f0f4f8 — 1.38:1.
· "Save changes" is white on #00d4ff — 1.77:1.
· Helper text samples #7b8794 on white — 3.66:1, at 13 px.
· A 1 px #e4e9f0 rule appears above the last row only.
· Chevrons: 16 px in the model row, 14 px in the language row.
· No focus ring visible on the model select; the screenshot was taken mid-tab, and the caret is not drawn on it.`,
          { ms: 5_840 }
        ),
        tool(
          'ext_navigate',
          { url: 'https://staging.docs.wolffi.sh/en/desktop/settings' },
          'Navigated to https://staging.docs.wolffi.sh/en/desktop/settings — 200, loaded in 640 ms. The page embeds a live render of the settings panel under the "Choosing a default model" heading.',
          { ms: 1_920 }
        ),
        tool(
          'ext_screenshot',
          { path: 'files/issues/2026-09/docs-settings-page.png', selector: '.settings-preview', scale: 2 },
          'Captured files/issues/2026-09/docs-settings-page.png — 1280 × 742 at 2x, 214 KB. Element `.settings-preview`, light theme.',
          { ms: 2_460 }
        ),
        send('files/issues/2026-09/docs-settings-page.png'),
        text(
          'The staging page is one release behind, and that turns out to matter: its toggle track is still `#1b365d`, which passes. Findings 1 and 2 are new in the current build, so the docs screenshots have to be retaken after the fix either way.'
        ),
        tool(
          'file_write',
          { path: 'files/reports/2026-09/design-audit-settings.md', content: AUDIT_MD },
          'Wrote files/reports/2026-09/design-audit-settings.md (2.5 KB, 34 lines). 10 findings, each with the measured value and the replacement value.',
          { ms: 210 }
        ),
        tool(
          'file_write',
          { path: 'files/charts/design-audit-severity.chart.json', content: SEVERITY_CHART },
          'Wrote files/charts/design-audit-severity.chart.json (0.6 KB)',
          { ms: 110 }
        ),
        tool(
          'file_write',
          { path: 'files/drafts/settings-panel-mockup.html', content: MOCKUP_HTML },
          'Wrote files/drafts/settings-panel-mockup.html (4.4 KB, 101 lines). Self-contained: house tokens as CSS variables, no external stylesheet, no script.',
          { ms: 240 }
        ),
        tool(
          'shell_exec',
          {
            command:
              "python3 -c \"import itertools;f=lambda h:[int(h[i:i+2],16)/255 for i in (1,3,5)];L=lambda c:sum(w*(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4) for w,v in zip((.2126,.7152,.0722),f(c)));r=lambda a,b:round((max(L(a),L(b))+.05)/(min(L(a),L(b))+.05),2);print('track',r('#748aa0','#f0f4f8'),'btn',r('#1b365d','#00d4ff'),'help',r('#5c6b7a','#ffffff'))\"",
            cwd: '~/.wfc/workspace'
          },
          `track 3.23 btn 6.85 help 5.47

All three replacements clear their threshold: the track needs 3:1 (non-text), the button label and the 13 px helper text need 4.5:1.`,
          { ms: 560 }
        ),
        send('files/reports/2026-09/design-audit-settings.md'),
        send('files/charts/design-audit-severity.chart.json'),
        send('files/drafts/settings-panel-mockup.html'),
        text(`Ten findings: one blocker, four major, three minor, two nits. The HTML above is the panel with every fix applied — it opens in the viewer, so Sara can diff it against the screenshot rather than read a list.

Three worth shipping before the screenshots, in this order:

1. **Toggle track \`#c8d2de\` → \`#748aa0\`.** 1.38:1 today, 3.23:1 after. The off state is currently invisible on the card, and this is the only finding that is an accessibility failure rather than a taste argument. One token.
2. **"Save changes" label \`#ffffff\` → \`#1b365d\`.** 1.77:1 → 6.85:1. \`#00d4ff\` is a surface accent; it was never meant to sit under white text.
3. **Focus ring on the model select.** Every other select in the app has the 2px \`#00d4ff\` outline. This one lost it, so keyboard focus disappears mid-panel.

The row rhythm and the 13px/14px label scale are the two that make it "look off" — worth fixing, but they will not fail a review, and they touch more than one component. I would hand those to Sara with the mockup rather than land them myself.

One thing I could not check: the dark theme. The screenshot is light only, and the token swap on the track has to be verified there too before it ships.`)
      ]
    }
  ]
})
