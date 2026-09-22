---
title: "Grok 4.7: What SpaceXAI's New Agent Model Changes"
description: "SpaceXAI's Grok 4.7 lands a 500K context window at $2/$6 per million tokens. Here's what the new agent model really changes for long-running agents."
date: 2026-09-22
categories: [news]
keywords: [grok 4.7, grok 4.7 pricing, grok 4.7 context window, spacexai grok 4.7, best model for ai agents 2026, grok 4.7 agentic coding, xai grok agent model, long running ai agents 2026]
image: https://cdn.wolffi.sh/blog/grok-4-7-agent-model/og.png
---

Grok 4.7 is SpaceXAI's new frontier model for coding, agentic tasks and knowledge work, released on September 21, 2026 at the same price as the model it replaces: $2 per million input tokens and $6 per million output tokens. For anyone running agents, the headline isn't a benchmark score — it's a 500,000-token context window, a reasoning-effort dial that goes up to `xhigh`, and encrypted reasoning that survives a multi-turn tool loop without any configuration on your side.

That's the short version. The longer version is what those three things change in practice, because two of them only start to matter when your agent is forty tool calls deep and the bill arrives.

## What actually shipped

Per [SpaceXAI's own model documentation](https://docs.x.ai/developers/grok-4-7), here's the spec sheet:

| Property | Grok 4.7 |
| --- | --- |
| Context window | 500,000 tokens |
| Knowledge cutoff | May 2026 |
| Modalities | Text and image input, text output |
| Input price | $2.00 / 1M tokens |
| Output price | $6.00 / 1M tokens |
| Reasoning effort | low, medium, high (default), `xhigh` |
| Built-in tools | Function calling, web search, X search, code execution |
| Where it runs | xAI API, Grok Build, Cursor, OpenRouter, Vercel, Cloudflare |

SpaceXAI frames it as a larger base model with a longer reinforcement-learning run, which is the same recipe every lab has converged on this year. [MarkTechPost's write-up](https://www.marktechpost.com/2026/09/21/spacexai-releases-grok-4-7/) and [DataCamp's](https://www.datacamp.com/blog/grok-4-7) both land on the same practical conclusion: the interesting change isn't raw capability, it's the economics for long agent loops.

The company's own positioning is blunt about that. In [the launch post on X](https://x.com/elonmusk/status/2102082011233931762), the claim is that Grok 4.7 puts SpaceXAI third behind Anthropic and OpenAI on agentic coding — and that being significantly faster and cheaper is what makes it a daily workhorse. Treat that as a vendor claim, not a measured result. The verifiable part is the price, which didn't move.

## Why the context window is the real story

A 500K window is not about pasting a giant document. It's about how many turns an agent can take before something has to be thrown away.

Every tool call an agent makes adds to the transcript: the request, the response, the file it read, the page it fetched, the error it hit. A web agent doing real work burns through context fast — a single fetched page can be several thousand tokens of markup. At 200K you start making hard choices about what to summarize away. At 500K those choices get postponed, and the agent keeps the actual evidence instead of your summary of it.

That matters more than it sounds. When an agent forgets the middle of a task, it doesn't usually announce it — it confidently contradicts something it did ten steps ago. Longer context is the cheapest fix for that failure mode, which is why [context windows are the spec people actually compare](/blog/ai-agent-context-window) rather than parameter counts.

## Reasoning effort is now a cost dial

Grok 4.7 lets you set reasoning effort to low, medium (the default), high, or `xhigh`. If you've been paying attention to how agents are built this year, this is the same idea as [model routing](/blog/ai-agent-model-routing), just inside one model instead of across several.

The practical pattern for an agent:

- **low** — classify, route, extract a field, decide whether a message needs a human. Cheap and fast, and usually right.
- **medium** — the default. Ordinary tool use.
- **high / xhigh** — the one hard step: a debugging session, a multi-source analysis, a plan you'll execute without review.

Agents spend most of their tokens on easy steps. Being able to tell the model "this one is easy" without switching providers is worth more than a few points on a leaderboard.

## The two details most write-ups skipped

Hidden in the docs are two settings that decide what you actually pay for a long agent run.

**Set a `prompt_cache_key`.** On the Responses API (or the `x-grok-conv-id` header on Chat Completions), it routes a conversation's requests to the same server, which makes cache hits reliable. Skip it and the docs are explicit: you often pay full input price on a cache-cold server. For an agent that resends a growing transcript every turn, that's the difference between a predictable bill and a surprising one.

**Encrypted reasoning comes back whether you ask for it or not.** Responses from Grok 4.7 include `reasoning.encrypted_content` even when you don't list it in `include`. Pass those reasoning items back unchanged in the next request and the model keeps its earlier thinking across turns. For a multi-step agent this is the difference between a model that remembers why it chose a path and one that re-derives it every turn — and re-derives it slightly differently.

## The Fast variant, and where it runs

Grok 4.7 Fast is the same model on faster infrastructure, billed at twice the standard token rates. It's available only in Cursor and Grok Build, and it is not on the public xAI API. There's also a US regional endpoint at `https://us.api.x.ai/v1`, which keeps inference in the United States for a 10% premium.

So the same model has four price points depending on where you call it from — which is worth knowing before you assume "$2 per million" is your number.

## What this means if you're running a personal agent

Three takeaways, in order of how much they'll change your setup:

1. **Your model bill is now mostly a function of context discipline, not model choice.** Half a million tokens of room doesn't mean you should use half a million tokens. Summarize completed steps, drop raw page dumps once they're digested, and keep the transcript lean.
2. **Price parity across the frontier is real.** Grok 4.7 held its predecessor's price while getting a bigger base model. Switching providers to save money is becoming a worse reason to switch than switching to get a capability you need.
3. **Check the cache story for whatever you run.** If your agent framework resends the full transcript each turn and you're not setting a cache key, you may be paying several times more than the model's sticker price suggests.

None of this is specific to Grok. Any agent you run locally — [the setup Wolffish uses](https://wolffi.sh/start#how) included — benefits from the same three habits, because they're about the loop, not the model.

## The takeaway

Grok 4.7 is a price-holding upgrade with a bigger window and a reasoning dial, and the interesting part is the boring part: 500K context, `xhigh` when you need it, and a cache key you have to remember to set. If you run long agent loops, set the cache key and budget your context before you switch models over a leaderboard number.

![What a long agent run costs on Grok 4.7, by token volume and endpoint](https://cdn.wolffi.sh/blog/grok-4-7-agent-model/grok-run-cost.html)
