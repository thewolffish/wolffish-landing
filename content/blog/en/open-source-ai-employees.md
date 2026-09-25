---
title: "Open Source AI Employees: What You Actually Get"
description: "Eight MIT-licensed AI employee packs, 60 scheduled routines, running on your own machine. What the repo really ships, and the guardrails to check first."
date: 2026-09-25
categories: [guides, community]
keywords: [open source AI employees, AI employee routines, self-hosted AI agent, scheduled AI agent routines, AI agent for small business, Claude Code AI employee plugin, local-first AI agent, AI agent guardrails]
image: https://cdn.wolffi.sh/blog/open-source-ai-employees/og.png
---

An "AI employee" is a folder of scheduled routines that covers one business role: it runs on your own machine, on the agent you already use, drives your browser the way you do, and leaves you a brief every morning. On September 19, Reinventing.AI released eight of them — GTM, SEO/AEO, web dev, social, ads, sales, customer support and a chief of staff — as MIT-licensed packages covering 60 routines in total. That means you can read every routine before it runs, and you are not paying per seat for the privilege.

The interesting part is not the idea. It is what the repo reveals about how these things have to be built to be safe enough to leave running.

## What the repo actually ships

Eight roles, each a self-contained folder with a fixed file structure:

```text
gtm-engineer/
  INSTALL-PROMPT.md        what your agent reads to set itself up, once
  ROLE.md                  who this employee is and how it thinks
  SCHEDULE.md              when each routine runs
  RELEASES.md              yours: which channels you have released, ships empty
  routines/<id>/SKILL.md   one folder per routine
```

Install is two steps: download the kit and extract it to a folder, then open your agent in that folder and tell it to install the employee. The agent researches your business from your website, builds a dashboard, schedules its own routines and pauses once to show you its first drafts. There is an `npx` path and a Claude Code plugin path, and the [repository](https://github.com/markfulton/ai-employees) documents running the same kits on OpenClaw, Hermes, OpenCode, Grok Bot, Codex, Antigravity, Pi, Cline, Qwen Code and DeepSeek — eleven harnesses, no routine rewritten per platform.

Here is the shape of the eight roles by routine count:

<figure>

![Routines per role in the open-source AI Employees repository: 60 scheduled routines across eight business roles](https://cdn.wolffi.sh/blog/open-source-ai-employees/roles-chart.html)

</figure>

The chief of staff is the tell. Its seven routines do not do any of the work — they read every other employee's run log, name what quietly stopped, and bring you three moves. Anyone who has run scheduled jobs knows the real failure is not a job that errors loudly; it is the job that stopped three weeks ago and nobody noticed.

## The four design decisions worth stealing

Even if you never install these, the patterns generalize:

**1. Draft by default, release by exception.** Every send, post, submit, publish and spend is held for your click, and a file called `RELEASES.md` is where you hand a channel over — one line per channel, shipped empty. That is a much better model than a global "autonomous mode" toggle, because trust is per-channel and earned at different speeds.

**2. Time windows, not exact times.** Each routine runs inside a window. If the machine was asleep and the job fires late, or fires twice, the routine notices the work is already done and does nothing. Idempotency is what makes a laptop a legitimate runtime.

**3. Self-updating instructions.** When a page changes, the routine fixes its own instructions and tells you in the next brief. Paired with an upgrade path that explicitly leaves every file you edited alone, that is the difference between a kit you adopt and a kit that fights you.

**4. The brief is the interface.** One morning brief, and a push to your phone only when *you* are the blocker. Not a notification per routine — a notification when a human is the missing piece.

## The guardrails you should still add yourself

The repo is honest about the boundaries, and they are worth restating because they are the same boundaries every scheduled-agent setup needs:

| Risk | What these packs do | What you should check |
| --- | --- | --- |
| Accounts and logins | Never creates an account, enters a password, completes a captcha or accepts terms | Keep it that way; [what is safe to schedule](https://docs.wolffi.sh/configuration/what-to-schedule) is a good checklist |
| Money | Spend is held for approval on every run | Set a hard ceiling anyway; the model is not the control |
| Publishing | Drafts staged, last click yours | Release one low-stakes channel first and watch a week of runs |
| Cost | On a Claude Pro/Max plan it spends plan usage, not dollars — the author measured the GTM engineer's scheduled runs at about 6% of his Max seat | Meter it from day one; a loop with a large context burns usage fast |
| Blast radius | Bounded to the employee's own folder and the accounts you release | Keep the folder outside cloud-sync directories, as the install guide says |

Two things to note before you get excited. First, these are business roles — if you want the personal-life version, start smaller with [what to automate first](https://wolffi.sh/blog/what-to-automate-first-ai-agent) rather than hiring eight employees on day one. Second, "runs on your machine" still means *on the agent you already use*, so the model, the account and the browser session belong to whatever harness you picked. The files are yours; the intelligence is rented. The [scheduling mechanics](https://wolffi.sh/blog/schedule-ai-agent-automations) are the same either way.

## Why this matters beyond one repo

For two years, "AI employee" meant a cloud product that charged per seat and kept your workflows on someone else's servers. What shipped here is the opposite: plain text files, a schedule, an agent you already pay for, and published guardrails you can read in an afternoon — the same local-first shape Wolffish is built on, where the automations live as [files you can read and edit](https://wolffi.sh/start#guide) rather than settings behind a login.

That is the direction the category is moving. Not because open source always wins, but because the constraint that decides whether you actually delegate real work is not capability — it is whether you can see what the thing did and stop it when it is wrong. Files and a run log answer that. A dashboard you cannot open does not.

## The takeaway

Eight MIT-licensed role packs, 60 scheduled routines, one morning brief, and a design that assumes a human should be the last click. Even if you do not install a single one, the four patterns — draft-then-release, time windows, self-updating instructions, and a brief as the interface — are the difference between automations that survive a month and automations you switch off in week two. Read the routine before you schedule it. Every time.
