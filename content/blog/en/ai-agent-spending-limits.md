---
title: "How to Set Spending Limits on Your AI Agent"
description: "Your AI agent can burn money two ways: model usage and real purchases. Here is how to set caps, approvals, and alerts that actually hold in 2026."
date: 2026-09-23
categories: [guides]
keywords: [AI agent spending limits, cap AI agent spending, AI agent budget, AI agent spend controls, agentic payments limits, virtual card for AI agent, AI agent guardrails, agent cost control]
image: https://cdn.wolffi.sh/blog/ai-agent-spending-limits/og.png
---

An AI agent can spend your money in two completely separate ways, and almost everyone protects only one of them: the tokens it burns thinking, and the purchases it makes on your behalf. Setting a monthly plan limit covers the first. It does nothing about the second. You need a cap on each, placed where the model cannot talk its way around it.

Here is the part most guides skip: a spending limit written into a prompt is not a limit. It is a suggestion to a very agreeable system.

## Two budgets, not one

Run a consumer agent for a month and you will see two line items, not one.

| Budget | What it covers | Where the money goes | Who controls it |
| --- | --- | --- | --- |
| Inference | Tokens used per run — thinking, tool calls, retries | Your model provider, per API call | You, in the provider console |
| Spending | Purchases, bookings, subscriptions the agent executes | Your card or payment rail | You, at the card or wallet |

Subscription plans hide the first one by bundling it. The moment your agent runs on an API key — which is the normal setup for anything self-hosted — inference becomes a meter running in the background, and a retry loop at 3am is a real invoice.

## A limit only holds where the model can't argue

This is the single most valuable idea in agent cost control, and it comes up in every serious write-up of the problem: enforce the ceiling in the layer that dispatches the work, never in the prompt. A model asked to "keep spending under $50" will comply until a task appears to require $51, and then it will comply with the task instead.

Concretely, that means a cap must live in one of these places:

- **The orchestration harness.** The thing that starts the run counts what the run has cost and refuses to start another when the budget is gone. This is outside the model entirely.
- **The credential.** A capped key, per task or per service, instead of one shared key with your whole balance behind it. If the key cannot spend more than $5, no amount of creative reasoning changes that.
- **The card or wallet.** A virtual card with a hard transaction limit, or an agent-specific wallet with a rolling cap. [Mastercard's Agent Pay](https://www.mastercard.com/us/en/news-and-trends/press/2026/june/mastercard-launches-agent-pay-for-machines.html) is built on exactly this: authorization rules and spending limits that are *programmatically enforced* rather than requested, with [Visa Intelligent Commerce](https://www.visa.com/en-us/solutions/intelligent-commerce) embedding the same controls into the credentials themselves.
- **The downstream system.** The merchant's own account-level rule. Useful as a backstop, useless as your only control.

## The five-layer setup

You do not need all five on day one. You do need to know which gap each one closes.

1. **A monthly ceiling per provider.** Set it in the provider's own console, not in your agent's config. This is the wall that stops a runaway loop from becoming a story.
2. **A per-task cost estimate.** Before the agent starts anything long, have it state roughly what the run will cost. A number in the transcript is easier to catch than a trend on a dashboard.
3. **A velocity alert, not just a total.** Alert on spend *rate* — dollars per hour — not only on the monthly sum. A cap that trips on the 30th is a month of damage.
4. **A per-transaction cap on any card the agent holds.** Small enough that a bad purchase is annoying, not painful.
5. **An approval gate above a threshold.** Anything over your limit pauses and waits for you. This is the same pattern as [approvals in general](https://wolffi.sh/start#control), and it is what makes the other four layers survivable in practice.

## Watch the multiplier

The number that surprises people is not the per-call price — it is the count.

An agent doing one task is cheap. An agent that retries five times on failure, spawns a helper per item in a list, and re-reads a long context on every step is not doing one task; it is doing forty. If your setup supports sub-agents or parallel runs, the cost of a single instruction multiplies by the fan-out, and every sub-agent needs to draw from the *same* budget rather than getting its own copy of it.

That is the failure mode worth designing against: not one expensive action, but a hundred cheap ones with no shared ceiling between them.

## Setting the numbers

Work backwards from a real week rather than picking a round figure.

- Sum what the agent actually cost over seven days of normal use.
- Multiply by four, then add 50% headroom. That is a first monthly ceiling — generous enough not to block real work, tight enough to catch an anomaly.
- Set the per-task estimate at roughly one day of normal spend. If a single run wants more than that, it deserves a look before it starts.
- Set the per-transaction card cap at the largest purchase you would be relaxed about disputing.

Then leave it alone for two weeks and compare the two numbers. The gap between estimate and actual is your margin of error, and after a month you can tighten by half.

## When the cap hits

Decide this in advance, because the wrong default is to fail silently.

The good behaviour is: stop, keep the work, explain what it was doing and what it cost, and offer to continue. The bad behaviour is to keep going on a cheaper model without telling you, or to abandon a half-finished task with side effects already committed.

Write it into the agent's instructions as a rule: **on reaching a limit, stop and report — never downgrade or improvise to finish.**

## Where this sits next to subscription math

If you are still deciding what to pay for in the first place, the subscription side of the equation is covered in [what an agent actually costs](https://wolffi.sh/blog/ai-agent-cost) — the sprawl of overlapping plans is usually a bigger number than any API bill. And if your agent is already buying things for you, [how agentic commerce works](https://wolffi.sh/blog/ai-agents-buy-things-for-you) explains which protections live at the network level and which you have to build yourself.

## Takeaway

Cap inference at the provider, cap spending at the credential, and put both behind approvals you control — because a limit the model can reason about is not a limit. Set the numbers from a measured week rather than a guess, alert on spend rate rather than totals, and make "stop and report" the agent's only permitted response to a ceiling it has hit.

![Interactive: work out your own agent budget and where to place the caps](https://cdn.wolffi.sh/blog/ai-agent-spending-limits/spend-planner.html)
