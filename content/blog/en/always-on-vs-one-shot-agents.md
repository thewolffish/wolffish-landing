---
title: "Always-On vs One-Shot AI Agents: Which Do You Need?"
description: "Always-on agents watch and act on their own; one-shot agents only work when you ask. Here's how to pick the right run-mode for each task, and the risks."
date: 2026-09-09
categories: [guides]
keywords: [always-on AI agent, one-shot AI agent, AI agent run modes, continuous AI agent, on-demand AI agent, personal AI agent automation, background AI agent, AI agent monitoring, AI agent schedule]
image: https://cdn.wolffi.sh/blog/always-on-vs-one-shot-agents/og.png
---

**A one-shot agent runs when you ask it to and stops when it's done; an always-on agent runs continuously in the background and acts on its own.** The single most common mistake people make with agents is picking the wrong run-mode for a task — usually forcing a one-shot agent into a job that needs to happen every day, then wondering why automation never sticks.

It's an under-discussed distinction, and people who do use agents notice it immediately. As one r/automation [thread on AI agents in 2026](https://www.reddit.com/r/automation/comments/1s73adp/my_favorite_ai_agents_in_2026_sorted_by_use_case/) put it: the always-on vs one-shot split of is *more* important than most people give it credit for, because with a one-shot agent "you'd get the result once but then have to manually re-trigger everything, which kind of defeats the whole point of automation."

## The two run-modes

**One-shot (on-demand).** You ask, it runs once, it returns. Everything is triggered by your message. Think of a ChatGPT answer, a single Claude task, or a job-search agent you ask to draft a cover letter for one role. Predictable, cheap, and safe — but it never repeats on its own.

**Always-on (continuous).** The agent runs in the background, watches context — your inbox, calendar, files, devices — and acts when it sees something it should handle, without a fresh prompt each time. Think [Microsoft Scout](https://learn.microsoft.com/en-us/microsoft-scout/overview) watching Outlook and prepping meetings, Instinct booking a flight from a text thread, or a local-first agent like [Wolffish](https://wolffi.sh/start) that lives on your machine and fires on a schedule.

## Why the distinction actually matters

The choice isn't about quality — both can be smart. It's about **fit**:

- **Recurring tasks (a weekly report, nightly backup, daily inbox triage) are always-on jobs.** Run them one-shot and you wake up every morning to re-trigger the same thing by hand. That's not automation, that's a reminder with extra steps.
- **Discrete tasks (summarize this PDF, draft one email, compare two options) are one-shot jobs.** Run them always-on and you've given a background process license to make a one-off call for you — and added cost and surface area for nothing.

The failure pattern that gets most people is the middle: they automate a recurring thing, but only up to the point where it runs once, then manually re-trigger it forever. The agent was working; the run-mode was wrong.

## The trade-offs

| | One-shot | Always-on |
| --- | --- | --- |
| Trigger | Your message | Background context or schedule |
| Cost | Low — only when you run it | Ongoing tokens, even between tasks |
| Risk | Low — nothing acts without you | Higher — it can act before you see it |
| Output | A result, then silence | A stream of actions over time |
| Best for | Discrete, one-off, high-stakes | Recurring, ongoing, need-it-done |

## How to choose for each task

Use the run-mode as part of [what you automate first](/blog/what-to-automate-first-ai-agent), and match it deliberately:

1. **Ask: does this need to happen more than once?** If yes, it's an always-on candidate; if no, keep it one-shot.
2. **Ask: can I accept the agent acting without my eyes on it?** If the action is high-stakes (money, sending to a client, deleting), keep it one-shot or gate it behind approval.
3. **Start one-shot, promote to always-on once it's reliable.** Get the prompt right manually first, then [schedule it](/blog/schedule-ai-agent-automations) and let it run.
4. **Scope the always-on agent hard.** Background autonomy is where [permissions](/blog/ai-agent-permissions-guide) actually matter — grant only the resources and actions it genuinely needs.
5. **Watch it, then trust it.** Look at the action log for the first week before you stop checking.

## A middle path worth knowing

The best setup isn't either/or — it's both, scoped by task. Run your recurring work as always-on but with a tight approval gate and a log you can review; run everything surprising and one-off as a one-shot you trigger by hand. A [local-first agent](https://wolffi.sh/blog/run-ai-agent-locally) makes the always-on half cheaper and more private, because the background watching stays on your machine instead of in someone's cloud.

## The takeaway

Pick the run-mode to fit the task, not the agent to fit your enthusiasm. If a task recurs, run it always-on; if it's a one-off, run it on demand. The agents that actually help people aren't the cleverest ones — they're the ones running in the mode that matches the job.

![Always-on vs one-shot agent checklist and prompts](https://cdn.wolffi.sh/blog/always-on-vs-one-shot-agents/checklist.zip)
