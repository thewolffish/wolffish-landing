import { at } from '../clock'
import { PROJECT_DOCS } from '../projects'
import { conversation, send, text, tool } from './dsl'

const SOURCE_MD = `# Token and search quotas

After this page you can read your own quota, see what happens when you reach the cap, and — if you are an org admin — raise it for one person or for the whole org.

## What gets counted

Wolffish Cloud counts two things per employee, per day, in \`Asia/Riyadh\`:

- **Tokens** — input, output and cached input across every model in the org catalog. Cached input is counted too, at its own price.
- **Searches** — every call to \`/v1/search\`, including the ones an agent makes on its own inside a procedure.

Employee counters reset at \`00:00 Asia/Riyadh\`. The org counter resets on the first day of the billing month.

## Default caps

| Scope | Cap | Window | Changed by |
| --- | ---: | --- | --- |
| Employee tokens | 2,000,000 | day | Org admin |
| Employee searches | 300 | day | Org admin |
| Org tokens | 900,000,000 | billing month | Owner |
| Org searches | 120,000 | billing month | Owner |
| Burst, any employee | 40 requests | 60 seconds | Fixed |

## Reading your own usage

\`\`\`bash
curl -s https://api.wolffi.sh/v1/usage/me -H "Authorization: Bearer $WOLFFISH_TOKEN"
\`\`\`

The response carries the day counters beside the caps they are measured against: \`tokens.used\` and \`tokens.cap\`, \`searches.used\` and \`searches.cap\`, and an \`org_month\` block with the two org counters.

## What happens at the cap

- At 80% the desktop shows a warning chip, and the admin gets one mail a day — not one per request.
- At 100% of tokens: new turns are refused with \`quota_exceeded\`, and the turn already running finishes. Half-done work is never cut off.
- At 100% of searches: \`/v1/search\` returns 429 with \`retry_after\` in seconds until midnight, and the agent falls back to \`web_fetch\` on pages you name yourself.
- At the org cap everything stops for everyone and the owner is mailed. The \`support\` role is exempt.

## Admin overrides

\`\`\`bash
curl -X POST https://api.wolffi.sh/v1/admin/quota -H "Authorization: Bearer $WOLFFISH_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"user_id":"usr_8f21","tokens_per_day":5000000,"searches_per_day":600,"expires_at":"2026-10-01"}'
\`\`\`

- An override without \`expires_at\` never expires. Prefer a date.
- Every override is written to \`/v1/admin/audit\` with who created it and why.
- Lowering a cap below current usage does not claw anything back; it applies from the next request.

## Notes

- Cached input counts against your quota at its own price. It is cheaper, not free.
- The quota is per employee, not per device: the desktop and the phone share one counter.
- The date range in the admin grid is 1-31 days.
`

const ARABIC_MD = `# حصص التوكن والبحث

بعد قراءة هذه الصفحة يمكنك الاطلاع على حصتك، ومعرفة ما يحدث عند بلوغ الحد الأقصى، ورفعه — إن كنت مشرف مؤسسة — لموظف واحد أو للمؤسسة كلها.

## ما الذي يُحتسب

يحتسب Wolffish Cloud شيئين لكل موظف في اليوم بتوقيت \`Asia/Riyadh\`:

- **التوكن** — الإدخال والإخراج والإدخال المخزَّن مؤقتًا عبر كل نموذج في كتالوج المؤسسة. الإدخال المخزَّن يُحتسب أيضًا، بسعره الخاص.
- **عمليات البحث** — كل نداء إلى \`/v1/search\`، بما في ذلك النداءات التي ينفّذها الوكيل من تلقاء نفسه داخل إجراء.

تُصفَّر عدادات الموظف عند \`00:00 Asia/Riyadh\`. أما عداد المؤسسة فيُصفَّر في أول يوم من شهر الفوترة.

## الحدود القصوى الافتراضية

| النطاق | الحد الأقصى | النافذة | يغيّره |
| --- | ---: | --- | --- |
| توكن الموظف | 2,000,000 | يوم | مشرف المؤسسة |
| عمليات بحث الموظف | 300 | يوم | مشرف المؤسسة |
| توكن المؤسسة | 900,000,000 | شهر الفوترة | المالك |
| عمليات بحث المؤسسة | 120,000 | شهر الفوترة | المالك |
| الدفقة، لأي موظف | 40 طلبًا | 60 ثانية | ثابت |

## قراءة استهلاكك

\`\`\`bash
curl -s https://api.wolffi.sh/v1/usage/me -H "Authorization: Bearer $WOLFFISH_TOKEN"
\`\`\`

يعيد الطلب عدادات اليوم إلى جانب الحدود القصوى المقيسة عليها: \`tokens.used\` و\`tokens.cap\`، و\`searches.used\` و\`searches.cap\`، وكتلة \`org_month\` التي تحمل عدّادَي المؤسسة.

## ماذا يحدث عند بلوغ الحد الأقصى

- عند 80% يظهر شريط تنبيه في تطبيق سطح المكتب، ويصل بريد واحد في اليوم إلى المشرف — لا بريد مع كل طلب.
- عند 100% من التوكن: تُرفض الأدوار الجديدة بالرمز \`quota_exceeded\`، ويكمل الدور الجاري حتى نهايته. لا يُقطع عمل نصف منجز.
- عند 100% من عمليات البحث: يعيد \`/v1/search\` الرمز 429 مع \`retry_after\` بالثواني حتى منتصف الليل، ويتحول الوكيل إلى \`web_fetch\` على الصفحات التي تسمّيها بنفسك.
- عند بلوغ حد المؤسسة يتوقف كل شيء للجميع ويصل بريد إلى المالك. دور \`support\` مستثنى.

## استثناءات المشرف

\`\`\`bash
curl -X POST https://api.wolffi.sh/v1/admin/quota -H "Authorization: Bearer $WOLFFISH_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"user_id":"usr_8f21","tokens_per_day":5000000,"searches_per_day":600,"expires_at":"2026-10-01"}'
\`\`\`

- الاستثناء بلا \`expires_at\` لا ينتهي أبدًا. الأفضل وضع تاريخ.
- كل استثناء يُكتب في \`/v1/admin/audit\` باسم من أنشأه وسببه.
- خفض الحد الأقصى دون الاستهلاك الحالي لا يسترجع ما استُهلك؛ يسري ابتداءً من الطلب التالي.

## ملاحظات

- الإدخال المخزَّن مؤقتًا يُحتسب ضمن حصتك بسعره الخاص. هو أرخص، وليس مجانيًا.
- الحصة لكل موظف لا لكل جهاز: سطح المكتب والهاتف يتقاسمان العدّاد نفسه.
- نطاق التواريخ في شبكة المشرف بين 1-31 يومًا.
`

export const docsArabicTranslation = conversation({
  id: 'conv-docs-arabic-translation',
  title: 'Arabic translation of the quotas docs page',
  channel: 'electron',
  projectId: PROJECT_DOCS,
  workingFolder: ['~/dev/wolffish-cloud/apps/site/docs'],
  files: {
    'uploads/conv-docs-ar/quotas.md': SOURCE_MD,
    'apps/site/docs/ar/quotas.md': ARABIC_MD,
    'apps/site/docs/ar/_meta.json': `{
  "getting-started": "البداية",
  "models": "النماذج",
  "procedures": "الإجراءات",
  "billing": "الفوترة",
  "quotas": "الحصص"
}
`
  },
  turns: [
    {
      user: 'The quotas page ships with 2.14 and the Arabic side is empty. Translate it in full — the docs style guide rules apply. Send me a .docx too, Nawaf reviews on his iPad.',
      attachments: ['uploads/conv-docs-ar/quotas.md'],
      at: at(1, 10, 5),
      steps: [
        text('Full translation, code blocks and paths untouched, Western digits, hyphen-minus in ranges. Reading the source and the style guide first.'),
        tool(
          'file_read',
          { path: 'uploads/conv-docs-ar/quotas.md' },
          `54 lines, 2.5 KB. Structure: h1 + 6 sections (What gets counted, Default caps, Reading your own usage, What happens at the cap, Admin overrides, Notes).
2 fenced blocks (bash), 1 table (5 rows × 4 columns), 15 inline code spans, 1 numeric range ("1-31 days").`,
          { ms: 180 }
        ),
        tool(
          'file_read',
          { path: 'uploads/project-docs/style-guide.md' },
          `Docs style guide — the four rules that bind this page:
· Arabic pages are full translations, never summaries.
· Numbers use Western digits; ranges use a hyphen-minus.
· Paths, flags, env vars and endpoints stay in code font and in English, in both languages.
· Sentence case headings, no trailing periods.`,
          { ms: 140 }
        ),
        tool(
          'shell_exec',
          { command: 'ls -1 apps/site/docs/ar/ && cat apps/site/docs/ar/_meta.json', cwd: '~/dev/wolffish-cloud' },
          `billing.md
getting-started.md
models.md
procedures.md
{
  "getting-started": "البداية",
  "models": "النماذج",
  "procedures": "الإجراءات",
  "billing": "الفوترة"
}

quotas.md is absent from both the folder and the nav.`,
          { ms: 320 }
        ),
        tool(
          'shell_exec',
          {
            command: "grep -rhoE '(الحصة|الحصص|السقف|التوكن|الدفقة)' apps/site/docs/ar/ | sort | uniq -c | sort -rn",
            cwd: '~/dev/wolffish-cloud'
          },
          `  14 الحصة
   9 التوكن
   6 الحصص
   2 السقف

"الدفقة" does not appear yet — billing.md uses "الاندفاع" once, in a sentence about rate limits.`,
          { ms: 410 }
        ),
        text(
          'The existing Arabic pages already settled four of the six terms, so I am following them rather than inventing. The two that are genuinely open are *burst* and *override* — I picked one each and listed the alternative below.'
        ),
        tool(
          'file_write',
          { path: 'apps/site/docs/ar/quotas.md', content: ARABIC_MD },
          'Wrote apps/site/docs/ar/quotas.md (3.7 KB, 54 lines). 2 fenced blocks and 15 code spans copied byte-for-byte from the source; 1 table; digits Western; the range written 1-31.',
          { ms: 260 }
        ),
        tool(
          'file_patch',
          {
            path: 'apps/site/docs/ar/_meta.json',
            find: '  "billing": "الفوترة"',
            replace: '  "billing": "الفوترة",\n  "quotas": "الحصص"'
          },
          'Patched apps/site/docs/ar/_meta.json (1 replacement). Nav now carries the page; the English _meta.json already had it.',
          { ms: 90 }
        ),
        tool(
          'shell_exec',
          { command: 'npm run docs:check -- --lang ar --page quotas', cwd: '~/dev/wolffish-cloud' },
          `> docs:check
✔ front matter present
✔ heading levels contiguous (h1 → h2)
✔ 2 code fences, both tagged bash, both identical to the en source
✔ 15 inline code spans match the en source
✔ no Eastern Arabic-Indic digits
✔ ranges use U+002D
✔ dir="rtl" resolved from the ar/ folder
0 problems.`,
          { ms: 2_140 }
        ),
        send('apps/site/docs/ar/quotas.md'),
        tool(
          'document_create',
          {
            source: 'apps/site/docs/ar/quotas.md',
            output: 'files/reports/2026-09/quotas-ar-review.docx',
            direction: 'rtl',
            font: 'IBM Plex Sans Arabic',
            comments: true
          },
          'Created files/reports/2026-09/quotas-ar-review.docx — 4 pages, RTL flow, IBM Plex Sans Arabic 11 pt, code blocks kept LTR in a monospace run, tracked-changes enabled so review edits come back as suggestions. 74 KB.',
          { ms: 2_760 }
        ),
        send('files/reports/2026-09/quotas-ar-review.docx'),
        text(`Page is in \`apps/site/docs/ar/quotas.md\` and in the nav; the .docx above is the review copy for Nawaf, with tracked changes on so his edits come back as suggestions rather than a new file.

Six terms needed a decision. Four were already settled by the Arabic pages that shipped before this one, so I matched them:

| English | Arabic used | Alternative rejected | Why |
| --- | --- | --- | --- |
| quota | الحصة | الكوتة | Transliteration; الحصة already appears 14 times across the shipped Arabic pages. |
| cap | السقف | الحد الأقصى | One word, so the table header stays on one line. |
| token | توكن | رمز | رمز is already taken by the pairing code in the app's Arabic UI — reusing it here would read as an auth code. |
| burst | الدفقة | الاندفاع | \`billing.md\` uses الاندفاع once; الدفقة is the term the API's own error copy uses. Flagging the mismatch rather than silently keeping two. |
| override | استثناء | تجاوز | تجاوز also means *exceeding the limit* — the exact thing this section is about — so it reads as a violation. |
| reset | يُصفَّر | يُعاد ضبطه | Two words for a counter going to zero; يُصفَّر is what the admin grid says. |

Two things to look at:

- **\`billing.md\` says الاندفاع where this page says الدفقة.** One of them should change. My vote is this page's term, because the 429 body the user actually sees says الدفقة.
- **The 1-31 range** is written with a hyphen-minus, per the style guide. If the design ever switches to an en-dash the check in \`docs:check\` will fail, not the page.`)
      ]
    },
    {
      user: 'غيّر «السقف» إلى «الحد الأقصى» في كل مكان',
      at: at(1, 10, 31),
      steps: [
        text('تمام. الجمع يحتاج صيغة مختلفة، فهما تعديلان لا تعديل واحد.'),
        tool(
          'shell_exec',
          { command: "grep -n 'السقف\\|السقوف' apps/site/docs/ar/quotas.md", cwd: '~/dev/wolffish-cloud' },
`3:بعد قراءة هذه الصفحة يمكنك الاطلاع على حصتك، ومعرفة ما يحدث عند بلوغ السقف، ورفعه — إن كنت مشرف مؤسسة — لموظف واحد أو للمؤسسة كلها.
14:## السقوف الافتراضية
16:| النطاق | السقف | النافذة | يغيّره |
30:يعيد الطلب عدادات اليوم إلى جانب السقوف المقيسة عليها: \`tokens.used\` و\`tokens.cap\`، ...
32:## ماذا يحدث عند بلوغ السقف
47:- خفض السقف دون الاستهلاك الحالي لا يسترجع ما استُهلك؛ يسري ابتداءً من الطلب التالي.

6 occurrences, 2 of them plural (السقوف).`,
          { ms: 240 }
        ),
        tool(
          'file_patch',
          { path: 'apps/site/docs/ar/quotas.md', find: 'السقوف', replace: 'الحدود القصوى' },
          'Patched apps/site/docs/ar/quotas.md (2 replacements, lines 14 and 30). Plural form written out rather than mechanically substituted — a literal swap would have produced "الحدود الأقصى".',
          { ms: 90 }
        ),
        tool(
          'file_patch',
          { path: 'apps/site/docs/ar/quotas.md', find: 'السقف', replace: 'الحد الأقصى' },
          'Patched apps/site/docs/ar/quotas.md (4 replacements, lines 3, 16, 32, 47). No code span, path or fenced block touched — none contained the word.',
          { ms: 110 }
        ),
        tool(
          'shell_exec',
          { command: 'npm run docs:check -- --lang ar --page quotas', cwd: '~/dev/wolffish-cloud' },
          `> docs:check
✔ 2 code fences unchanged
✔ 15 inline code spans unchanged
✔ no Eastern Arabic-Indic digits
✔ ranges use U+002D
0 problems.

Table column 2 is now 3 characters wider; the Mintlify table still fits at 1280 px and wraps at 390 px.`,
          { ms: 1_980 }
        ),
        tool(
          'document_create',
          {
            source: 'apps/site/docs/ar/quotas.md',
            output: 'files/reports/2026-09/quotas-ar-review.docx',
            direction: 'rtl',
            font: 'IBM Plex Sans Arabic',
            comments: true
          },
          'Recreated files/reports/2026-09/quotas-ar-review.docx — 4 pages, 75 KB. Tracked changes still on.',
          { ms: 2_510 }
        ),
        send('apps/site/docs/ar/quotas.md'),
        send('files/reports/2026-09/quotas-ar-review.docx'),
        text(`تم. ستة مواضع: أربعة بصيغة المفرد «الحد الأقصى»، واثنان كانا جمعًا فصارا «الحدود القصوى» — الاستبدال الحرفي كان سيعطي «الحدود الأقصى».

| الموضع | قبل | بعد |
| --- | --- | --- |
| عنوان القسم (سطر 14) | السقوف الافتراضية | الحدود القصوى الافتراضية |
| شرح الاستجابة (سطر 30) | السقوف المقيسة عليها | الحدود القصوى المقيسة عليها |
| ترويسة الجدول (سطر 16) | السقف | الحد الأقصى |
| المقدمة والعنوان والملاحظة (3، 32، 47) | السقف | الحد الأقصى |

ملاحظة واحدة: عمود الجدول صار أعرض بثلاثة أحرف، وتحقّقتُ منه عند 1280 px و390 px — لا يزال يتّسع. الكتل البرمجية والمسارات لم تُمسّ.`)
      ]
    }
  ]
})
