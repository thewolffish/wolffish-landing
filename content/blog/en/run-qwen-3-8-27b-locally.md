---
title: "Run Qwen3.8-27B Locally: A Capable Agent on One GPU"
description: "Alibaba's Qwen3.8-27B open-weight model runs an agentic workflow on a single GPU. Here's what you need, how much RAM it takes, and how to set it up."
date: 2026-09-05
categories: [guides, product]
keywords: [Qwen3.8-27B local, run Qwen3.8 locally, Qwen 3.8 27B hardware, open weight agent model, local AI agent GPU, Qwen3.8 GGUF, run open model one GPU, Qwen3.8-27B setup]
image: https://cdn.wolffi.sh/blog/run-qwen-3-8-27b-locally/og.png
---

You can run a genuinely capable agentic model on one GPU today, and **Qwen3.8-27B** is the strongest current example. It's a dense 27-billion-parameter open-weight model released under Apache 2.0, with native vision, a 262,000-token context, and published benchmark results — all small enough to fit on a single rented or owned accelerator.

The 2.4-trillion-parameter Qwen 3.8-Max got the headlines. The 27B is the one most people will actually deploy, and it's the reason a personal agent no longer has to live in someone else's cloud. Here's what you need to know before you run it.

## What Qwen3.8-27B is

Qwen3.8-27B is a **dense** 27B model — meaning the full model sits in VRAM, unlike a Mixture-of-Experts model that activates only part of it per token. That makes the memory math predictable, and it's what lets a 27B behave like a real agent on hardware you can actually buy.

Confirmed specifications from the release:

- **Parameters:** 27B dense, with hybrid attention.
- **Vision:** yes — the release includes a vision encoder, taking both image and video input. Nobody promised that.
- **Context:** 262,000 tokens native, extensible to 1M.
- **License:** Apache 2.0 — commercial use, modification, and redistribution all permitted.
- **Benchmarks:** the model card publishes results including **61.7 on SWE-bench Pro**.

It's the successor to Qwen3.6-27B, a model that became a community favorite for local coding and agent work, so 3.8 brings the generation's training improvements down to self-hostable scale.

## Hardware requirements

Because the model is dense, the memory math in the table below is the real thing. These are weights-only figures; KV cache comes on top and scales with your context length and concurrency.

| Precision | Weights in VRAM | Realistic single-GPU fit |
| --- | --- | --- |
| BF16 | ~56 GB | 80GB class (H100, H200, RTX Pro 6000) |
| FP8 | ~28 GB | 48GB class (L40S, RTX Pro 6000) |
| 4-bit (GGUF / AWQ) | ~14–16 GB | 24GB class (RTX 4090) |

The practical sweet spot for testing is the **4-bit path**: a GGUF quantized build runs in roughly 17 GB and Ollama's own build is an **18 GB download**. That's the difference between "loads on my GPU" and "serves my workload" — at 4-bit you can try it on a 24GB card, but a long-context multi-user workload will push it past that.

For serious serving, FP8 on a 48GB card is the likely balance; BF16 on an 80GB card when quality headroom matters.

## How to run it

The serving playbook for a 27B-class Qwen is well established, because the ecosystem has been running its predecessor for months.

**Production serving.** Use vLLM or SGLang. Both ship with day-one support for Qwen releases and give you an OpenAI-compatible endpoint out of the box, so the model slots into existing client code with no rewrite.

**Local testing.** Ollama, LM Studio, Jan, and llama.cpp all support the GGUF quantized builds. If you have Apple Silicon, an MLX build is available too — the 18 GB package is the one to start with. This is the fastest path to a local agent: `ollama run` and you're talking to a model that can take your files and your number-crunching.

**The GPU decision.** If you're between renting and buying, start on the 4-bit path to measure quality on your actual workload, then scale precision up only if the task needs it. A 24GB-class card (RTX 4090 or 5090) is the floor; you don't need a rack.

## What it means for running an agent

The reason a 27B matters is that "open weights" now buys you something real. Kimi K3, the largest open model, needs cluster-scale orchestration and starts around 1.56 TB of weights. Qwen3.8-27B runs on one GPU. That closes the gap between "I want an agent" and "I can afford to run my own agent" for a solo developer or small team.

This is the same [local vs. cloud trade-off](https://wolffi.sh/blog/local-first-vs-cloud-ai-assistant) in a concrete form: a local 27B keeps your data on your machine and is free to run, while a frontier cloud model gives you more reasoning for the hardest tasks. Many people run both — a [cloud model](https://wolffi.sh/blog/run-ai-agent-locally) for peak reasoning and a local 27B for the volume.

For a local-first assistant like Wolffish, having a model like Qwen3.8-27B in reach is what makes "your agent lives on your machine" a practical option rather than a compromise.

## Caveats worth knowing

- **Independent replication is pending.** The model card publishes the SWE-bench Pro number, but no independent benchmark confirms it as of early September 2026. Run your own eval before switching production work to it.
- **Weights are the floor, not the total.** Long-context, multi-user serving can double the memory footprint. The gap between "loads on my GPU" and "serves my workload" is significant at 27B scale.
- **A 27B won't match a 2.4T flagship.** The practical split is to keep the frontier model on the API for the hardest reasoning and the small model self-hosted for volume work.

## The takeaway

Qwen3.8-27B is the release that makes a capable, open, agentic model genuinely affordable to run yourself. Apache 2.0 weights, a vision encoder, 262k context, and published benchmarks — all downloadable today and all run on one GPU. If you've wanted an agent that stays on your machine, this is the model that makes it easy.

![Memory requirements by precision](https://cdn.wolffi.sh/blog/run-qwen-3-8-27b-locally/chart.html)
