---
title: "Claude Fable 5.1 & Mythos 5.1: What's New for Agents"
description: "Anthropic's Claude Fable 5.1 adds a 1M-token context window and cuts cache-read costs 75% for agents. What changed and whether it's worth switching."
date: 2026-09-03
categories: [news, product]
keywords: [Claude Fable 5.1, Mythos 5.1, Anthropic Fable 5.1, Claude agent model, Anthropic cache pricing, 1M context window agent, Fable 5.1 benchmark, best AI agent model, Anthropic new model 2026, Claude for agents]
image: https://cdn.wolffi.sh/blog/claude-fable-5-1-mythos-5-1/og.png
---

Claude Fable 5.1 is Anthropic's new general-purpose agent model, and its headline change is cost: cache reads dropped 75% to $0.25 per million tokens, with a 1M-token context window unchanged at $10 per million input and $50 per million output. Mythos 5.1 is the same model with more permissive safeguards, gated to vetted defenders and researchers.

The two releases matter less for what they do to raw benchmarks and more for what they do to the economics of long-running agents. Most personal and production agents don't do one big inference — they run long sessions that reread the same instructions, memory, and tool definitions over and over. That's exactly the workload cache pricing rewards.

## The number that actually changed

The release is quiet on the capability front and loud on pricing. Anthropic cut the Fable cache-read price from $1.00 to $0.25 per million tokens — a 75% reduction — while leaving the base input and output prices alone. A cache read is now just 2.5% of the normal input-token price instead of the 10% multiplier other Claude models use.

Why that matters: an agent that holds a system prompt, a memory file, and a tool list is rereading the same tokens on every single turn. That repetition is precisely what the cache serves. At the new rate, a long agent session costs a fraction of what it did a week ago, with no prompt-engineering changes required.

| Metric | Claude Fable 5 | Claude Fable 5.1 | Claude Opus 5 |
| --- | --- | --- | --- |
| Input (per 1M tokens) | $10.00 | $10.00 | $5.00 |
| Output (per 1M tokens) | $50.00 | $50.00 | $25.00 |
| Cache read (per 1M tokens) | $1.00 | $0.25 | $0.25 |
| Context window | 1M | 1M | 1M |
| Terminal-Bench-Science 0.1 | 24.7% | 52.6% | 29.0% |

![Claude Fable 5.1 vs Fable 5 vs Opus 5 — cache cost and Terminal-Bench-Science compared](https://cdn.wolffi.sh/blog/claude-fable-5-1-mythos-5-1/fable-5-1-comparison-chart.html)

The one capability number Anthropic leads with is Terminal-Bench-Science 0.1, where Fable 5.1 scores 52.6% against 24.7% for Fable 5 and 29.0% for Opus 5. That's a real jump on a benchmark that measures the kind of multi-step, tool-using behavior agents rely on — though the same caveat applies to it as to every public benchmark: it's a proxy, not a guarantee. [VentureBeat](https://venturebeat.com/technology/anthropics-claude-fable-5-1-and-mythos-5-1-arrive-with-a-75-cost-reduction-for-fable-cache-reads) and [MarkTechPost](https://www.marktechpost.com/2026/09/01/anthropic-releases-claude-fable-5-1-and-claude-mythos-5-1-52-6-on-terminal-bench-science-and-75-cheaper-cache-reads/) both break down the release.

## What Fable 5.1 vs Mythos 5.1 actually means

The split is about who can touch the model, not what it can do.

- **Fable 5.1** is generally available. It's the safe, broadly shipped version you'd put behind a customer-facing or personal agent.
- **Mythos 5.1** is the same model with more permissive safeguards, restricted to a vetted set of defenders and researchers who apply for access.

That gating pattern is worth internalizing because it's becoming the norm. Anthropic's approach to a model that's more capable — and therefore more risky — is to ship the safe variant to everyone and keep the higher-freedom variant behind a vetting wall. For anyone evaluating a personal agent, the practical takeaway is to know which tier the model behind it sits in, because "Claude" in a product description no longer names one thing.

## What it changes for your agent

Three concrete effects flow from this release:

1. **Cheaper long sessions.** Stateful, memory-heavy agents — the kind that keep a running to-do list and your preferences in context — are the biggest winners. Their constant rereading is now 75% cheaper on the cache.
2. **A better agent model, not a bigger one.** Fable 5.1 keeps the same price and window as Fable 5 and invests the gains in reasoning and tool use instead. That's a meaningful signal about where Anthropic thinks agent performance comes from.
3. **Gated capability is a feature of the ecosystem now.** Expect more "safe for everyone, powerful for vetted few" splits across labs, and design your agent choices around it.

If you're building or choosing a personal agent, the release is a reason to revisit your model selection — not because Fable 5.1 is a revolution, but because the cost curve for the exact workloads agents run just bent sharply downward. For a sense of how model and memory choices shape what a personal agent can do, see our [guide to AI agent memory](https://wolffi.sh/blog/ai-agent-memory-guide) and the [cost breakdown of running an agent](https://wolffi.sh/blog/ai-agent-cost).

## The takeaway

Fable 5.1 is a cost and reasoning update disguised as a quiet release. The headline isn't a new ceiling — it's that the floor for running a persistent, memory-holding agent got 75% cheaper on the part agents touch most. If your agent rereads its own context constantly, this release quietly saves you real money, starting now.
