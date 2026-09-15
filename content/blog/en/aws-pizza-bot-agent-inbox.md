---
title: "AWS Pizza Bot: An Inbox for Background AI Agents"
description: "AWS open-sourced Pizza Bot, an email-style inbox where long-running agents park finished work and approval requests. Here's how agent supervision works."
date: 2026-09-15
categories: [product]
keywords: [AWS Pizza Bot, AI agent inbox, background AI agents, AI agent supervision, AI agent approvals, long-running agents, human in the loop agent, open source AI agent, agent inbox pattern]
image: https://cdn.wolffi.sh/blog/aws-pizza-bot-agent-inbox/og.png
---

AWS has open-sourced [Pizza Bot](https://aws.amazon.com/blogs/opensource/introducing-pizza-bot-an-open-source-inbox-for-ai-agents-that-work-in-the-background/), a self-hosted inbox where agents that run in the background drop their finished work and their requests for your approval. It is not a chatbot and it is not a dashboard: it is an email-shaped client for reading what your agent did while you were doing something else. The project surfaced on September 13 and the code is Apache 2.0 on GitHub.

If you have ever lost track of what an always-on agent was up to, this is the interface problem worth understanding — whether or not you ever install it.

## What Pizza Bot actually is

Per the [AWS Open Source Blog](https://aws.amazon.com/blogs/opensource/introducing-pizza-bot-an-open-source-inbox-for-ai-agents-that-work-in-the-background/) and [The New Stack's write-up](https://thenewstack.io/aws-pizza-bot-agent-inbox/), Pizza Bot is a local-first application built on DeepAgents — LangChain's harness for long-running agent tasks — running on LangGraph, LangChain's stateful execution runtime. It ships desktop builds for macOS, Windows and Linux, plus browser and terminal clients.

Two things about it are worth stating plainly:

- **It is a community project, not an AWS service.** There is no support contract and no service-level agreement. Keeping it running, backed up and updated is yours. That's the tradeoff of self-hosting, stated up front by the people who built it.
- **The unit of work is an email, not a chat turn.** Tasks are triggered manually, on a cron schedule, or by webhook, and they keep running when you close the window.

## Why an inbox is the right metaphor

Chat interfaces assume a person is present. Background agents break that assumption: the work starts when you ask, finishes when it finishes, and the interesting moment is usually *after* you stopped watching.

Email solved this problem decades ago, so Pizza Bot borrows the solution. Your inbox separates three states that a chat window smears together — things that arrived, things you've seen, and things that need you. A background agent has exactly the same three states, and a chat log represents none of them well.

## The three views, and what each is for

Pizza Bot organizes its task history into three buckets, and the split is the design:

| View | What's in it | What you do there |
| --- | --- | --- |
| **All** | Every task the agent has run | Audit and search — the record of what happened |
| **Unread** | Work that finished since you last looked | Skim results, catch up in one pass |
| **Action** | Requests for approval, input or a decision | Answer, unblock, or reject |

The middle one is what makes the design work. A completed task is not a notification — it's something to review when you have time. Only the third bucket is genuinely urgent, and keeping it separate means an agent that ran 40 successful tasks doesn't generate 40 interruptions.

That separation is the same principle behind [keeping approvals on for anything with an external effect](https://wolffi.sh/blog/get-your-ai-agent-to-ask-before-acting): the goal isn't to slow the agent down, it's to make sure the moment it needs you is distinguishable from the moments it doesn't.

## What it gets right, and what it leaves to you

**Right:** it treats agent output as a queue rather than a stream, it makes approval a first-class object instead of a modal dialog, and it keeps the whole thing self-hosted so the record of your agent's work lives on your hardware.

**Left to you:** everything operational. Authentication, backups, role-based access, retention, and what happens when the agent's task queue isn't the only thing you run. Pizza Bot is a pattern you can borrow and a project you can fork — not a managed product.

There's also the honest friction that AWS itself names: give a background agent a task genuinely worth delegating and you'll be waiting a while. Background work is only a win when the task is long enough to matter and bounded enough to finish.

## Using the idea without installing anything

You can adopt the shape of Pizza Bot with whatever you already run. Three habits do most of the work:

1. **Give agent work a durable home.** If the only record of a run is the chat you had with it, the run is gone the moment you compact or restart. Scheduled jobs, nightly digests and recurring reports all deserve a place that survives a closed window. [Setting up automations](https://wolffi.sh/blog/schedule-ai-agent-automations) covers the scheduling half; a [log you can actually read](https://wolffi.sh/blog/ai-agent-audit-trail) covers the other.
2. **Split "done" from "needs you".** Before you turn an agent loose, decide which outcomes it may complete silently and which must arrive as a question. If everything is an interruption, you'll start ignoring all of them.
3. **Pick the right run mode.** Some jobs want an always-on watcher; most want a one-shot run you trigger. Mixing them up is why agent setups feel noisy — [the always-on vs one-shot breakdown](https://wolffi.sh/blog/always-on-vs-one-shot-agents) is the short version.

A morning-briefing style digest is the easiest first test of the pattern: one scheduled run, one place the result lands, nothing else. [The morning-briefing setup](https://wolffi.sh/start#morning-briefing) walks through it end to end.

## Takeaway

Pizza Bot's contribution isn't the inbox UI — it's the argument that a background agent needs a *supervision surface*, and that the surface should look like email because email already solved triage. If you run anything on a schedule, you already have this problem in miniature. Separate finished work from work that needs a decision, put the finished work somewhere durable, and the agent stops feeling like something you have to keep an eye on.

![The background-agent inbox pattern and a task brief template](https://cdn.wolffi.sh/blog/aws-pizza-bot-agent-inbox/agent-task-briefs.zip)
