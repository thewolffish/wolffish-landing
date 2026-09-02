---
title: "Cisco Gave 90,000 Employees a Personal AI Agent"
description: "Cisco rolled MyAgent out to all 90,000 employees — 800 subagents and open-weight cost routing. What it teaches anyone scaling a personal agent."
date: 2026-09-02
categories: [news, market]
keywords: [Cisco MyAgent, 90000 employees AI agent, personal AI agent at work, Cisco AI agent rollout, subagents, open-weight models cost, enterprise AI agent 2026, every employee AI agent]
image: https://cdn.wolffi.sh/blog/cisco-myagent-90000-employees/og.png
---

Cisco just gave all 90,000 of its employees a personal AI agent. The rollout, called MyAgent, sits on Cisco's own multi-model platform and gives every worker a personalized assistant that remembers their preferences, routes tasks across Outlook, Webex, Jira, and SharePoint, and runs supervised autonomous workflows while they work.

The number that makes this worth studying isn't the scale — it's the cost-control blueprint. Per Cisco's own reporting, **roughly 50–60% of requests are handled by open-weight models** hosted in-house on Cisco-owned GPU servers, **20–30% are handled by software automation**, and only a small remainder makes it to a frontier model. That's the budget discipline most people skip when they set up their own agent.

## What MyAgent actually is

Cisco built it on a secure, governed, multi-model-agnostic platform called Circuit. It's not a single chatbot — it's a personal agent backed by more than 800 subagents.

Three things define it:

- **It's personalized.** MyAgent remembers your preferences, past interactions, and context over time, so it gets more useful the longer you use it.
- **It acts across systems.** It runs supervised autonomous workflows across Outlook, Webex, Jira, SharePoint, and other apps — delegate a task by defining the objective and let it coordinate the steps.
- **It's always available.** It stays connected to your applications and data, ready to assist without interruption.

The "supervised autonomous" part is the key phrase. It doesn't just answer — it *does*, under supervision. That's the same line between a chatbot and an agent that matters for a personal setup.

## The cost blueprint most people miss

The reason this rollout is a case study is the routing split. Cisco treats different requests as different costs:

| Request type | Share of traffic | Where it runs |
| --- | --- | --- |
| Everyday, high-volume | ~50–60% | Open-weight models, in-house GPUs |
| Routine, repeatable | ~20–30% | Software automation, not a model |
| Hard, high-judgment | Small remainder | A frontier model |

When you read that, notice what it's really saying: **don't pay frontier-model prices for work that doesn't need them.** The vast majority of what an agent does is routine. Cisco routes that to cheap, private, in-house models and reserves the expensive ones for tasks where a top model actually changes the outcome.

That's the same principle as [the price-drop economics](https://wolffi.sh/blog/ai-agent-price-drop) and the reason [cheaper models can now run agents](https://wolffi.sh/blog/deepseek-v4-open-source-agents) — but it's the operational version. Most people pay one flat frontier price for everything their agent touches. Cisco's split is the smarter model.

## What it teaches you about running your own agent

You don't need 90,000 employees or 800 subagents to apply the lesson. Three things transfer directly:

1. **Route by difficulty, not by habit.** Your daily briefing, reminders, and inbox triage don't need a frontier model. Save the expensive calls for the hard problems.
2. **Automate the boring parts.** If a step is deterministic — a rule, a format, a lookup — a workflow handles it cheaper than a model ever will.
3. **Give the agent a job, not a prompt.** MyAgent works by you defining an objective and letting it coordinate the steps. That's the difference between delegating and just asking.

The "800 subagents" detail is worth a second look too. A single agent is simpler; a set of narrow specialists can each be cheap and good at one thing. That's the logic behind [one agent vs. a team of agents](https://wolffi.sh/blog/one-agent-vs-multi-agent) — at enterprise scale, narrow wins.

## The trust question

Here's the honest part. Giving an agent access to your inbox, calendar, and internal systems means deciding how much you trust it — and Cisco's "supervised autonomous" framing is the right instinct. MyAgent acts, but it acts under supervision, on a governed platform with its own access rules.

For a personal setup, that's the [permissions question](https://wolffi.sh/blog/ai-agent-permissions-guide) again. How much access, and what must it ask before doing? The safest pattern is the one everyone eventually lands on: give the agent its own [email, phone, and wallet](https://wolffi.sh/blog/give-ai-agent-its-own-identity), rather than handing it your personal accounts.

None of that makes a personal agent hard — but it does mean you should decide the boundaries before you automate the work. Starting from a single [recurring task](https://wolffi.sh/blog/what-to-automate-first-ai-agent) and expanding from there is the sane path.

## The takeaway

Cisco's rollout is the clearest signal yet that personal agents are becoming a normal part of work — and the most useful thing in it isn't the scale, it's the cost discipline. Route routine work to cheap models, automate what's deterministic, and keep the frontier model for the problems that genuinely need it. Scale that down to one person and one inbox, and you have a good personal agent.

![How Cisco routes MyAgent requests](https://cdn.wolffi.sh/blog/cisco-myagent-90000-employees/routing-chart.html)
