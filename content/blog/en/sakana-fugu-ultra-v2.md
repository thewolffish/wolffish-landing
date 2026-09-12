---
title: "Sakana Fugu Ultra v2: A Model That Runs Other Models"
description: "Sakana AI's Fugu Ultra v2 and Fugu Max orchestrate other models instead of replacing them. What the split means for agent cost, quality, and lock-in."
date: 2026-09-12
categories: [news, market]
keywords: [Sakana Fugu Ultra v2, Fugu Max, Fugu orchestration model, multi-agent orchestration, AI model routing, agent cost per token, Sakana AI 2026, orchestrator model, frontier model alternative]
image: https://cdn.wolffi.sh/blog/sakana-fugu-ultra-v2/og.png
---

Sakana AI released **Fugu Max** and **Fugu Ultra v2** on 10 September 2026 — two versions of a single orchestrator, a system that answers a request by hiring other models to do the work. The split is simple: Fugu Max chases the best output per dollar, Fugu Ultra v2 chases the highest capability, and neither needs a single frontier model in its pool to get there.

That makes it more than one lab's release notes. Orchestration is the layer your personal agent actually lives in — it is the part that decides which model burns your money on a task a cheaper one could have finished.

## What shipped

- Both models went live on 10 September 2026 through Sakana's OpenAI-compatible API, and existing Fugu users switch with a one-line parameter change, according to [Sakana's release post](https://sakana.ai/fugu-max-release/).
- **Fugu Max** is priced at $2 per million input tokens and $6 per million output tokens.
- **Fugu Ultra v2** runs $5 input and $30 output per million, with $0.50 cached input, and higher rates above a 272K context window.
- There are **no open weights to self-host**, and Sakana does not offer the service in the EU/EEA, as [MarkTechPost's write-up](https://www.marktechpost.com/2026/09/10/sakana-ai-launches-fugu-max-and-fugu-ultra-v2-for-cheaper-stronger-multi-agent-orchestration/) notes.

The pricing line is where this stops being abstract. Fugu Max's output price is reported 40–60% below Sonnet 5, GPT 5.6 Terra and Kimi K3.

## The idea: a model that is really a team

Fugu is not a foundation model with a bigger brain. It is a *learned orchestrator*: it reads a request, builds an agentic scaffold for that specific task, and routes each step to the model best suited to it. Sakana trains it with a mix of large-scale fine-tuning, evolutionary methods and reinforcement learning, building on two ICLR 2026 papers — one where an evolved coordinator assigns Thinker, Worker and Verifier roles across turns, and one where a conductor learns coordination strategies in natural language.

The practical consequence is that the model pool is swappable. Fugu Max deliberately widened its pool to include more open-weights and specialised models, including NVIDIA's Nemotron family through Sakana's collaboration with NVIDIA. That is the difference between an architecture and a product: if one model in the pool disappears, the orchestration continues.

## Where each model is meant to be pointed

| | Fugu Max | Fugu Ultra v2 |
| --- | --- | --- |
| Optimised for | Best output per dollar | Highest capability |
| Published output price | $6 per 1M tokens | $30 per 1M tokens |
| Benchmark claim | Best overall on six benchmarks | Best or joint-best on five of eight |
| Model pool | Largest to date, including NVIDIA Nemotron | No Fable 5, Fable 5.1 or GPT-6 Astra |
| Point it at | High-volume, repeatable agent work | Multi-step reasoning, research, full-stack code |

The numbers behind those claims: Fugu Ultra v2 scores **48.3 on Chartography** (visual reasoning and data interpretation) against 29.5 for Fable 5 and 27.3 for Opus 5, and **74.3 on DeepSWE** for real-world software engineering — ahead of models priced three to five times higher per token, per Sakana. Fugu Max takes the best overall score on six benchmarks including Terminal Bench 2.1 and AutomationBench.

![Where each Fugu model wins — benchmark gap and the token bill at 5M output tokens](https://cdn.wolffi.sh/blog/sakana-fugu-ultra-v2/fugu-explainer.html)

## What it means for your agent's bill

An agent that runs on a schedule — the [morning briefing](https://wolffi.sh/start#morning-briefing), a price watch, a mailbox triage — is a token meter running in the background whether or not the answer needed a frontier model. A one-line summary of three emails does not deserve the same model as a multi-step research task, and most agents have no mechanism for telling the two apart.

That is exactly the problem orchestration solves, and it is why [model routing](https://wolffi.sh/blog/ai-agent-model-routing) is one of the most consequential settings in any agent setup: it decides whether [your monthly bill](https://wolffi.sh/blog/ai-agent-cost) tracks your usefulness or your curiosity. A system like Fugu is a routing decision you delegate rather than write — and if you run your own agent, the routing and cost controls are documented at [docs.wolffi.sh](https://docs.wolffi.sh).

## The honest caveats

- **These are vendor benchmarks.** SWEFish is Sakana's own internal benchmark suite, and "best overall on six benchmarks" is a claim by the company selling the tokens. Treat the direction as real and the exact margins as marketing until independent runs appear.
- **Your workload is not a benchmark.** A 48.3 on visual reasoning says nothing about whether the orchestrated answer to *your* request is better than a cheap model's. Route one real task each way and compare the output, not the score.
- **Lock-in moved, it did not vanish.** Sakana's stated advantage is not depending on Fable 5, Fable 5.1 or GPT-6 Astra. But Fugu itself is a hosted API with no open weights and no EU/EEA availability — you have traded one dependency for another, with a different failure mode.
- **The training cutoff is 28 August 2026.** Orchestration decisions about which model is "leanest" can only be as current as that.

## The takeaway

Fugu Ultra v2 and Fugu Max are the clearest statement yet that the useful unit of an AI system is no longer a single model — it is the layer that chooses between them. For anyone running a personal agent, the lesson is portable even if you never call Sakana's API: decide per task how much model you need, write that rule down, and let the boring work stay cheap. The agents that survive contact with a monthly bill are the ones that were never expensive by default.
