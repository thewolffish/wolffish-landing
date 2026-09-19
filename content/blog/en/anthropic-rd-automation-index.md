---
title: "Anthropic R&D Index: Claude Leads 26% of AI Research"
description: "Anthropic's new R&D Automation Index shows Claude leads 26% of its own AI research, up from under 1% in February. What the numbers really mean."
date: 2026-09-19
categories: [news, market]
keywords: [Anthropic R&D Automation Index, Claude leads AI research, AI automating AI research, recursive self-improvement, Epoch AI automation levels, AI agent oversight, AL4 automation level, pace of AI development]
image: https://cdn.wolffi.sh/blog/anthropic-rd-automation-index/og.png
---

**Claude now leads 26% of Anthropic's own AI research and development work — completing most of a task end to end from a high-level prompt while a human supervises — up from under 1% in February 2026.** Anthropic published that number on September 17 in the first results from a prototype R&D Automation Index, and the figure underneath it matters more than the headline: more than **90%** of the company's AI R&D now happens at a level where the model is at least a collaborator.

That is the recursive-self-improvement story everyone has been theorising about, published by a lab with a named external measurement scale attached. Here is what the numbers actually say — and the parts you should not take at face value.

## What "leads" means on the scale Anthropic used

Anthropic catalogued the kinds of AI R&D work it does — roughly 15,000 granular tasks, sampled across 20% of staff and organised into a 542-node hierarchy — and rated each against Epoch AI's Automation Level scale.

| Level | Label | What it means in practice |
| --- | --- | --- |
| AL0 | No AI | Humans do the work; the model is not involved |
| AL1–AL2 | Assists | The model helps with parts of a task under close direction |
| AL3 | Collaborates | Large chunks of work done under close human direction |
| AL4 | Leads | Most of the task is completed end to end from a high-level prompt; a human supervises |
| AL5 | Fully autonomous | No human in the loop |

As of August 2026, on Anthropic's own measurement:

- Claude reached **AL5 for no measured subset** of AI R&D work.
- Claude **"leads" (AL4) 26%** of that work.
- **Over 90%** sits at "AI collaborates" (AL3) or above.

Anthropic is explicit that the AL5 zero is the line it wants read carefully. Fully autonomous AI-driven research is the level its own CEO's pacing essay warned about, and the company is reporting that it has not been reached in any category it measures.

## The oversight numbers nobody is quoting

The same post disclosed how Anthropic supervises the agents doing that work, and this section is the more useful one for anyone running agents of their own.

- Roughly **30,000 agents** do research and engineering work on Anthropic's most-used internal platform at any one time.
- **100% of their actions** pass through an online monitor *before* execution, usually within seconds.
- Across **over a billion agent decisions** analysed in August 2026, **0.002% were blocked** — about one in 47,000.
- Offline monitors flag roughly **one to two transcripts in every thousand**, around 100,000 a week. Classifiers resolve most; about **50 a week escalate to a human**.

Anthropic's own framing of the block rate is the honest one: individual agents rarely misbehave, but when millions of agents run in an economy, rare events happen regularly. One in 47,000 is a rounding error per agent and a certainty per fleet.

## Why this matters if you have never worked at a lab

Read the oversight section as a specification, because it is the one every organisation running agents will eventually be asked to fill in. Four numbers: what share of the work agents lead, how many run concurrently, what share of actions get blocked or flagged, and what latencies sit between an action and its review.

That is not a lab-only scorecard. If you run a personal agent that reads your mail, moves money, or books things, you already have versions of all four — you just have not written them down. Blocking before execution rather than auditing after it is the design choice that separates a guardrail from a log file, and it is worth stealing whether your fleet is 30,000 agents or one.

![How much of Anthropic's AI R&D work runs at each automation level, August 2026 — Claude leads 26%, collaborator or above is more than 90%, fully autonomous is zero](https://cdn.wolffi.sh/blog/anthropic-rd-automation-index/automation-levels.html)

## What to be sceptical about

- **Claude judges Claude.** The index was scored by a Claude model rating its own contribution. Human-to-model agreement on exact labels was 59% — while humans agreed with each other 35% of the time. That beats human consistency, but it is a self-assessment with a number attached, not a verification.
- **The task basket is frozen at July 2026.** Work the model invented for itself after that date is not counted, which biases the figure downward.
- **One week of compute data.** The 6% of AI R&D compute going to safety work is a single week's snapshot (July 13–20), and Anthropic calls the figure deliberately conservative. A snapshot is not a trend.
- **No third party yet.** Anthropic says it intends to embed independent evaluators with access comparable to internal risk teams. Until that happens, this is a company grading its own homework, publish the rubric as it may.

None of that makes the disclosure worthless — the opposite. A lab that publishes a number it could be attacked for is doing something the rest of the industry has not, and the methodology appendix is the part that makes the headline auditable rather than rhetorical.

## The bigger picture

The index landed in the same week OpenAI's policy chief confirmed the three largest labs have been working for weeks on a **FINRA-style standards body** to test models before release. The two stories are one story: a metric that a regulator would want, and an institution being built to verify it. We broke that second half down in [the AI standards body explained](https://wolffi.sh/blog/ai-standards-body-explained).

If you want the operational version of this — approvals, blocking, and what your agent is allowed to do without asking — that is [getting your agent to ask before acting](https://wolffi.sh/blog/get-your-ai-agent-to-ask-before-acting) and the [control](https://wolffi.sh/start#control) section of the setup guide.

## The takeaway

Anthropic put a number on something that has been argued about in essays for a year: 26% of its research is now led by its own model, 90% involves it, and none of it runs without a human. The oversight metrics — 100% coverage, one action in 47,000 blocked, 50 human escalations a week — are the part you can actually copy onto your own agent setup today.

Sources: [Anthropic's measurement post](https://www.anthropic.com/institute/measuring-pace-of-ai-development) and [Bloomberg's report](https://www.bloomberg.com/news/articles/2026-09-17/anthropic-says-claude-drives-26-of-its-research-and-development).
