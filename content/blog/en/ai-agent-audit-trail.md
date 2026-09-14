---
title: "AI Agent Audit Trail: See Everything Your Agent Did"
description: "An agent's log is the only record of what it actually did. What to capture, where each platform hides it, and a ten-minute setup that proves the work happened."
date: 2026-09-14
categories: [guides]
keywords: [AI agent audit trail, AI agent logs, what did my AI agent do, agent activity log, AI agent accountability, agent logging checklist, AI agent transparency, EU AI Act record keeping]
image: https://cdn.wolffi.sh/blog/ai-agent-audit-trail/og.png
---

An AI agent audit trail is a timestamped record of every action the agent took — what it read, what it changed, which tool it called, and who approved the consequence. Without one you cannot tell a finished task from a plausible one, which is the single most expensive way agents fail.

Conversation history is not an audit trail. A chat transcript shows you what the agent *said* it did. An audit trail shows the file it actually wrote, the request it actually sent, and the row it actually changed. When something goes wrong, only the second one helps.

## What belongs in an audit trail

Six fields cover almost every question you will ever ask about an agent run. Capture all six at the point of the action, not afterward from memory:

1. **Timestamp** — when the action fired, in a timezone you can reason about.
2. **Trigger** — you asking, a schedule, a webhook, or another agent. This is where cascades start.
3. **Tool and arguments** — which capability was called and with what inputs, verbatim.
4. **Target** — the exact file path, URL, record ID, or recipient. "Sent an email" is not a target; "sent to the address on row 14" is.
5. **Result** — success, failure, or an output you can inspect later.
6. **Approval** — whether a human signed off, and which human.

If your agent can write to something you care about without leaving those six behind, you have an agent with no memory of its own consequences.

## Where each platform actually keeps the record

Almost every major vendor logs its own activity and nothing else. The gaps show up the moment an agent touches a third-party system.

| Platform | What you get out of the box | The gap |
| --- | --- | --- |
| ChatGPT | Full conversation history, exportable; action history for connected apps | Doesn't record which third-party record was read or written |
| Claude | Per-organization audit logs for account and security events on enterprise tiers, with a limited export window | Conversation-level reasoning isn't a structured action log |
| Gemini / Grok | Activity history tied to the account, per-product | Each product sees only its own activity |
| Local-first agents | Every tool call written to disk as plain files you can grep | You have to decide what to keep and for how long |
| Enterprise agent platforms | Execution traces, tool activity, and approval records as a first-class feature | Usually priced and scoped for teams, not individuals |

The pattern is worth naming: **the vendors log well inside their own walls and poorly across them.** If your agent's job spans your inbox, your bank, and a booking portal, no single vendor's log is a complete record of the run.

## Why this stopped being optional

Regulators now treat record-keeping as a technical requirement rather than a documentation habit. Article 12 of the EU AI Act requires high-risk AI systems to *technically allow* automatic event logging over the system's lifetime — the log has to be built into the architecture, not summarized afterward in a report. The European Commission began enforcing AI Act rules and new transparency requirements on 2 August 2026, with the record-keeping duties for high-risk systems phasing in alongside them.

You are probably not running a high-risk system. The reason it matters anyway is that compliance pressure shapes defaults: expect log retention, tamper-evidence, and provenance to arrive in consumer agent tools over the next year, and expect the ones without them to look cheap in comparison.

## A ten-minute setup you can do today

This is the whole exercise. It requires no integration work.

1. **Pick a folder.** One directory the agent writes to for every run — `agent-log/` is fine.
2. **Append, never overwrite.** One line per action, newline-delimited JSON if you can, so a later write can't erase an earlier one.
3. **Log the six fields above.** If a field doesn't apply, write `null` rather than dropping it — an absent field and an empty field look identical six months later.
4. **Log approvals explicitly.** When you say yes to a spend or a send, that decision belongs in the record next to the action it authorized.
5. **Review weekly, not daily.** Read the last week and ask one question: is there any action here I can't explain? That's the whole audit.
6. **Nothing destructive runs without a logged approval.** This is the rule the log exists to enforce.

A worked checklist, a log schema you can copy, and a weekly review template are packaged below — drop the schema into your agent's instructions and it starts recording from the next run.

![Agent logging schema and weekly review checklist](https://cdn.wolffi.sh/blog/ai-agent-audit-trail/audit-checklist.zip)

## When the log is thin, ask for receipts

If your agent runs somewhere that doesn't give you an action log, you can still verify a run by demanding evidence instead of summary. Three questions do most of the work:

- **"Show me the file path."** An agent that read something can name where it lives.
- **"What was the ID?"** Order numbers, message IDs, row references. Fabricated detail is harder to sustain than fabricated prose.
- **"What did you change, and what did you leave alone?"** The second half is the part that catches accidental edits.

An agent that can't answer these has told you something useful about how much of its work you should trust.

## Takeaway

An audit trail is the cheapest reliability feature your agent can have, because it converts "I think it worked" into something you can check. Turn on the folder, log the six fields, review the week. It is the difference between an agent you supervise and an agent you hope for.

![How each platform logs agent actions](https://cdn.wolffi.sh/blog/ai-agent-audit-trail/platform-logs.html)
