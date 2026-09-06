---
title: "How Agents Pick Which Model to Use: A Routing Guide"
description: "Your agent doesn't need one big model for everything. Model routing sends each task to the best, cheapest LLM. Here's how it works and how to set it up."
date: 2026-09-06
categories: [guides]
keywords: [AI agent model routing, how AI agents choose model, multi-model agent, LLM routing guide, NVIDIA NeMo Switchyard, pick model for agent, cheapest model for task, model selection AI agent, AI agent cost optimization, multi-model AI agent 2026]
image: https://cdn.wolffi.sh/blog/ai-agent-model-routing/og.png
---

**Model routing is the practice of sending each step of an agent's work to the model that handles it best — not whatever single model you configured at the start.** Done well it cuts cost and latency while keeping quality, and in 2026 it's the difference between an agent that's expensive to run and one that's worth it. Here's how to think about it and set it up.

## The problem: one model, every task

The default approach is easy: pick a strong model and route everything to it. It works, but it's wasteful. An agent's work isn't uniform — within a single task it may need to:

- **Classify** an incoming email as urgent or not.
- **Reason** through a complex, multi-step decision.
- **Extract** structured data from a messy input.
- **Summarize** a long document into a few lines.
- **Reply** with a polished, customer-ready paragraph.

A frontier model handles all of those well, but for the classification and extraction steps you're paying frontier prices for work a much cheaper model does just as well. Send everything to the big model and you bleed money on routine steps; send everything to the small model and quality collapses on the reasoning steps. Routing is the middle path: match the task to the model.

## How routing actually works

An agent that routes work across models has one extra piece compared to a single-model agent: a **model selection layer**. That layer sits between the agent's plan and the model call, and it decides which model handles each step.

The NVIDIA [NeMo Switchyard](https://developer.nvidia.com/blog/route-ai-agent-workloads-across-models-with-nvidia-nemo-switchyard) project is the clearest reference implementation of this idea. It's an open-source orchestration layer that **separates the routing logic from provider endpoints**, so you can change which model a task goes to without rebuilding your application around each vendor. It ships several router types:

- **LLM classifier router** — a cheap model reads the task and labels what kind of work it is.
- **Stage router** — hardcodes which model handles each phase of a multi-step flow.
- **Escalation router** — starts cheap, and escalates to a stronger model if the first attempt is weak.
- **Tunable prefill router** — learns from your workload data to predict which model will succeed on a given request.

The escalation router is the one most people think of as "routing," and the published benchmark numbers are striking. In a [LangChain benchmark](https://developer.nvidia.com/blog/route-ai-agent-workloads-across-models-with-nvidia-nemo-switchyard), using the escalation router between a smaller Nemotron model and Claude Opus 4.8 produced a **74% cost reduction** compared to always calling the big model. Cognition's Devin Desktop achieved near-frontier coding performance a **28% lower cost** with staged routing.

| Routing approach | What it does | Best for | Cost vs. always-frontier |
| --- | --- | --- | --- |
| Single model | One model does everything | Simplicity, small workloads | Baseline (high) |
| LLM classifier | Classifies task, picks a model | Mixed workloads, varied inputs | Medium |
| Escalation router | Starts cheap, escalates on failure | Cost-sensitive, quality matters | ~74% lower |
| Stage router | Fixed model per phase | Predictable pipelines | Medium-high |

![Relative cost of model-routing strategies](https://cdn.wolffi.sh/blog/ai-agent-model-routing/chart.html)

## When to bother routing

Routing is a real engineering addition, so only add it when it pays. Three signals that you should:

1. **Your agent does mixed work.** If it only ever does one kind of task, a single well-chosen model is fine.
2. **Your bill is the problem.** If cost is the pain, routing is the highest-leverage fix — you'll cut the routine steps first.
3. **Your quality varies by step.** If some steps fail but others fly, an escalation router catches the failing ones without paying for the easy ones.

If all you want is to run a personal agent more cheaply, you don't necessarily need a framework. The same principle works in miniature: use a strong model for the one or two genuinely hard steps, and a cheap fast model for the rest. Many agents surfaced in the 2026 [personal-agent roundup](/blog/best-personal-ai-agent-2026) already do this internally or let you set per-task models.

## The trade-offs to know

Routing isn't free. The extra layer adds a decision point in the middle of your agent's loop, and a bad router sends work to the wrong model and costs you quality even as it saves money. You also introduce a second thing to monitor: not just "did the task succeed," but "did the right model run it." Some people find that running [a local model for the cheap steps](/blog/run-ai-agent-locally) and a frontier model for the hard ones is an easier start than a full routing framework.

To see cost and routing handled for you out of the box, Wolffish lets you set per-task models — start at [wolffi.sh/start#key](https://wolffi.sh/start#key).

## The takeaway

You don't need one model for everything — you need the *right* model for each task. Start with the escalation idea: cheap first, escalate on weakness. If your agent is expensive to run, routing is the single highest-value change you can make, and it's a change you can make gradually.
