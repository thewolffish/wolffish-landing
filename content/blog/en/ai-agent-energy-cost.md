---
title: "The Real Energy Cost of AI Agents in 2026"
description: "One tracked Claude Code run used about 600x the energy of a chat prompt. What agentic AI really costs in electricity, and where the power goes."
date: 2026-09-20
categories: [market, community]
keywords: [AI agent energy use, energy cost of AI agents, Claude Code energy consumption, AI data center electricity, agentic AI carbon footprint, AI agent electricity 2026, how much energy does AI use]
image: https://cdn.wolffi.sh/blog/ai-agent-energy-cost/og.png
---

**Measured against a real eight-week log, AI agents use roughly 600 times more electricity per human prompt than a chat question does — about 150 watt-hours against roughly 0.3.** The number matters because almost every reassuring statistic you have read about AI energy is a chat statistic, and almost nobody uses AI that way any more.

## The measurement that changed the story

Climate scientist Zeke Hausfather tracked his own Claude Code usage for eight weeks and published the breakdown on [The Climate Brink](https://www.theclimatebrink.com/p/the-real-energy-use-of-agentic-ai). The raw counts: **1,138 typed prompts**, which triggered **more than 14,000 model calls** and processed **3.2 billion tokens**. His central estimate is **around 170 kWh** of data-centre electricity, with an uncertainty range of roughly 70 to 330 kWh depending on methodology.

That works out to about 150 Wh per prompt he typed. For context, Google has published a median Gemini text prompt at 0.24 Wh, and Sam Altman put an average ChatGPT query near 0.34 Wh. Both of those figures are broadly consistent with Epoch AI's analysis — and both describe a world where one prompt equals one model call.

The gap is not a rounding error. It is the difference between counting trips and counting distance.

## Why agents are a different workload

An agent does not answer once. It plans, calls a tool, reads the result, revises, and repeats — and every one of those steps re-processes its accumulated context. Hausfather's log shows the ratio directly: 12 model calls per prompt, and an average of 2.9 million tokens consumed per prompt, where a plain web chat exchange uses roughly a thousand tokens.

The most striking number in the whole dataset is where that volume goes. Only about **0.4% of tokens processed are the text he actually saw as output.** Around **96% are cache reads**, where the agent re-reads its own working memory at each of those 14,000 steps. An agent is, from an energy standpoint, mostly a machine for re-reading itself.

That also explains why the per-prompt cost varies so wildly: a task needing 24 model calls and 592k tokens is a different animal from a multi-hour geospatial analysis running several sub-agents in parallel.

![Interactive chart: energy per AI task, from a chat prompt to an agentic workflow](https://cdn.wolffi.sh/blog/ai-agent-energy-cost/energy-per-task.html)

## What other researchers find

Hausfather's estimate is not an outlier, and that is what makes it worth planning around. Three independent lines of work land in the same region.

- A Watershed white paper (Bistline et al., 2026) finds that electricity per AI task spans **more than five orders of magnitude** — from thousandths of a watt-hour for text classification to **50–500 Wh for an agentic workflow making 5–50 frontier model calls**.
- Bai et al. (2026) measured coding agents on real software tasks and found they consume roughly **1,000 times the tokens** of an ordinary chatbot interaction.
- A KAIST team found agents can consume **up to 136.5 times more energy per query** than conventional generative AI, [according to TechXplore](https://techxplore.com/news/2026-07-hidden-energy-ai-agents.html).

The IEA's 2026 report, summarised by [Our World in Data](https://ourworldindata.org/how-much-energy-do-data-centers-and-artificial-intelligence-use), puts a standard agentic request around 1.1 Wh — still an order of magnitude above a chat prompt, and a useful reminder that the spread across agent designs is enormous.

## What it means in household terms

Abstract watt-hours hide the scale, so here is the translation from the same dataset:

| Measure | Electricity | Everyday equivalent |
| --- | --- | --- |
| Median Claude Code session | ~0.6 kWh | about 50x charging a phone |
| Average day of agent use | ~3.0 kWh | more than two refrigerators running |
| Heaviest single day | ~11 kWh | over a third of an average US home's daily use |
| A full year at this rate | ~1.1 MWh | ~370 kgCO2e — more than an electric clothes dryer |

The yearly figure is worth sitting with, because it is roughly a tenth of what an average US household consumes, produced by one person's coding assistant. It is also about 2% of the average American's total annual greenhouse gas footprint — large for a piece of software, small next to a car.

## How to cut it without giving up the agent

The levers are real, and most of them are good practice anyway.

1. **Shorten sessions, not tasks.** Context is re-read at every step, so a long-running session gets progressively more expensive per step. Start a fresh session for a new task.
2. **Give the agent less to re-read.** Cached tokens are cheap but not free. A bloated context — every file open, every log line — is billed at every step.
3. **Prefer targeted tools over broad browsing.** An agent that reads one page is not the same workload as one that reads forty.
4. **Stop agents that are looping.** An agent stuck repeating itself burns the same tokens repeatedly. The [kill switch drill](/blog/ai-agent-kill-switch) covers how to stop one properly.
5. **Use a smaller model for routine steps.** Routing mechanical work to a cheap model and reserving frontier reasoning for the hard decisions is the single biggest lever most people have; we covered the mechanics in [model routing](/blog/ai-agent-model-routing).

One structural point favours local-first agents here. When an agent runs on your own machine, the parts that do not need a frontier model — file reads, search, sorting, formatting — stay on your hardware at your own grid intensity, and only the reasoning steps go to a data centre. That is a smaller share of the same measurement, not a free pass.

## The takeaway

Agentic AI is not a slightly heavier chat session. It is a different order of magnitude: roughly 600x the electricity per prompt, mostly spent re-reading its own context. Measure your own usage before you estimate it, keep sessions short, and stop the ones that loop.
