---
title: "Jev: The 70ms Decision Model Inside Your Agent"
description: "TypeSafe's Jev returns typed decisions in 70–500ms instead of text. Here's where a fast decision layer beats a frontier model inside your agent."
date: 2026-09-22
categories: [product]
keywords: [jev ai model, typesafe ai jev, system one models, ai agent decision layer, fast model for ai agents, structured output model, jev vs llm, smart if statements ai, decision model for agents]
image: https://cdn.wolffi.sh/blog/ai-agent-decision-model-jev/og.png
---

Jev is a new kind of model that returns a typed decision instead of text: you give it unstructured state — a support ticket, a log line, an order record — and it gives back a choice, a score or a probability in 70 to 500 milliseconds. It comes from [TypeSafe AI](https://typesafe.ai/blog/introducing-system-one-models-and-jev), founded by Diogo Almeida, who worked at OpenAI on the methods behind ChatGPT, and it launched in early access on September 15, 2026 after two years in stealth.

The reason this matters for anyone running an agent isn't the model itself. It's the argument underneath it: most of what an agent does is not reasoning, it's branching — and we've been paying frontier-model prices to do arithmetic.

## The mismatch nobody talks about

TypeSafe's own comparison table lays out the problem starkly. Existing LLMs, in their framing, take 3 to 329 seconds end to end. Jev takes 70 to 500 milliseconds. The company says that's a 40x to 200x improvement for the same level of intelligence on "System One" shaped queries — their term for the fast, intuitive counterpart to the slow, deliberate reasoning frontier models chase.

Treat the multipliers as a vendor claim. The structure of the problem is real regardless of who's measuring it: when an agent calls a model to decide *which* of four tools to use, you are paying a reasoning model to make a decision that has a small, closed set of answers. That's a lot of machinery for a branch.

TypeSafe's own name for the category is refreshingly unglamorous. They call the use case "smart if-statements": classify, route, score, extract, or branch where hand-written logic is too brittle.

## What makes a decision model different

Three design choices distinguish this from an LLM with a structured-output schema bolted on.

| | Existing LLMs | System One (Jev) |
| --- | --- | --- |
| Optimised by | Human preference / verifiable rewards | Calibrated decisions (RLCD) |
| Output | Strings, usually needing parse + validate | Type-safe structured values |
| Sampling | Sequential, one token at a time | Parallel — all outputs in one query |
| Confidence | Often overconfident, inconsistent | Calibrated probability on every answer |
| Input price | $0.20–$10 / MTok | $0.042 / MTok |
| Output price | ~5x input | Free |

Two of these matter more than the rest.

**Parallel sampling.** Generating all outputs in a single query instead of one token at a time is where most of the speed comes from. It's an architectural bet that only pays off if you've given up free-form text — which is exactly what Jev does.

**Calibrated confidence.** This is the one that should change how you build. TypeSafe's framing is precise: if a model can do a task 95% of the time but doesn't tell you which 5% it's wrong on, you can't automate that task. A confidence score on every output turns an agent's decision into something your code can route on — act above 0.9, ask a human between 0.6 and 0.9, and escalate below that.

## Where it breaks down

The limits are as important as the pitch, and TypeSafe is candid about one of them: Jev gives up string generation entirely. It cannot write your summary, draft your email or explain itself. A model that returns a decision has nothing to say about *why*.

That has real consequences:

- **You still need a frontier model.** The decision layer decides; something else does the work. This is a two-model architecture, not a replacement.
- **The schema is now your interface.** Define the decision space badly and you've built a fast wrong answer. The type safety prevents type errors, not bad design.
- **"Can't hallucinate" means something narrower than it sounds.** A model that must return one of your declared values can't invent a fifth option — but it can return a confidently wrong one. Calibration is a claim about its confidence, not its correctness.
- **Early access.** This shipped a week ago from a company that's been public for eight days. Betting a production system on it today is a bet on a vendor, not a product.

## How to add a decision layer to your agent

If you want to try the pattern — with Jev or with a small local model and a constrained schema — the shape is:

1. **Find your branches.** Grep your agent's logs for the places where code decides between options based on model output. That's your candidate list.
2. **Define the decision space explicitly.** For each one, write down the exact set of outcomes and what each means. If you can't enumerate them, it's not a decision-layer job.
3. **Collect the state.** What does the decision actually need to see? Usually far less than the full transcript — which is another reason these calls are cheap.
4. **Route on confidence, not just the answer.** Pick three thresholds: auto-act, confirm, escalate. This is the step that turns a classifier into a control system.
5. **Compare against your current path.** Run both on the same real inputs, and score *decisions*, not answers. The [evaluation approach for agents](/blog/how-to-evaluate-ai-agents) applies directly here.

This is a specialised case of a pattern most agent builders already know: [routing different tasks to different models](/blog/ai-agent-model-routing) instead of sending everything to the most expensive one. What's new is that the cheap model isn't a worse version of the big one — it's built for a different job.

## The takeaway

Jev is a bet that a large share of what agents do is branching, and that branching deserves its own model: typed output, calibrated confidence, free output tokens, single-digit-cent input. The vendor's speed and price multipliers are claims, not audits. But the architectural point stands on its own — if your agent pauses for seconds to pick between four options it already knows, that's a decision layer waiting to happen, and the confidence score is the part worth stealing first.

![Latency and cost of a decision layer versus a frontier model — vendor-published figures](https://cdn.wolffi.sh/blog/ai-agent-decision-model-jev/decision-layer-vs-frontier.html)
