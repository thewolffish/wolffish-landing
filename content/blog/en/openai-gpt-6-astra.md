---
title: "GPT-6 Astra: OpenAI's New Agent Model, Explained"
description: "OpenAI's GPT-6 Astra launched Sep 3, 2026 with a 1M-token context and native computer use. Here's what the new model changes for your AI agent."
date: 2026-09-05
categories: [news, product]
keywords: [GPT-6 Astra, OpenAI GPT-6, GPT-6 Astra release, OpenAI Astra agent, GPT-6 computer use, GPT-6 API pricing, ChatGPT 6, GPT-6 context window, OpenAI agent model]
image: https://cdn.wolffi.sh/blog/openai-gpt-6-astra/og.png
---

OpenAI released **GPT-6 Astra** on September 3, 2026, and it is built to do work rather than answer questions. The headline numbers — a 1.05-million-token context window, native computer use, and the strongest agent-tool scores OpenAI has published — are the part that changes what a personal agent can actually accomplish.

Astra is the first OpenAI model to reach the company's own "Critical" cybersecurity capability threshold, so the rollout is deliberately gated and safety is as much of the story as the benchmarks. In this guide we cover what GPT-6 Astra is, what it costs, and what the release means for anyone running a personal or work agent.

## What GPT-6 Astra actually is

Astra is the model that carries the GPT-6 name after months of speculation about whether the internal project would ever ship as the flagship. It is not just a better chatbot. OpenAI designed it to use a computer: open websites, click interfaces, fill forms, edit files, run code, and continue long, multi-step tasks with far less human guidance than earlier generations.

A few confirmed specifications set it apart:

- **Context window:** 1,050,000 tokens — enough to hold an entire codebase, a research corpus, or months of agent task history in one working context.
- **Maximum output:** 128,000 tokens.
- **Knowledge cutoff:** April 30, 2026.
- **Tools:** web search, image input, file search, code execution, computer use, and agent tools.
- **Reasoning levels:** Low, Medium, High, XHigh, Max.
- **Fine-tuning:** not supported at launch.

For a personal agent, the useful shift is that a model this size no longer needs a separate rewrite of everything you paste in. You can hand it a large body of material and let it reason over it once.

## How much GPT-6 Astra costs

Pricing splits into two stories: what you pay inside ChatGPT, and what developers pay through the API.

For regular ChatGPT users, OpenAI has not introduced a separate "GPT-6 subscription." Astra is being added to eligible paid plans — Plus, Pro, Business, and Enterprise — subject to each plan's usage limits. Access to the free tier has not been announced.

For developers, API pricing is:

| Usage | Price per million tokens |
| --- | --- |
| API input | $10 |
| Cached input | $1 |
| Cache writes | $12.50 |
| API output | $50 |

Astra also applies different pricing to very large prompts above 272,000 input tokens, so million-token workflows should not assume every request is at the base rate. The economics matter for agents: long reasoning and repeated tool use burn tokens fast, which is the same reason [agent costs](https://wolffi.sh/blog/ai-agent-cost) are worth planning around.

## The benchmarks that matter for agents

Astra posts some of OpenAI's largest gains to date, and the computer-use results are the ones you'll notice:

| Benchmark | GPT-6 Astra | GPT-5.6 Sol |
| --- | --- | --- |
| ARC-AGI-3 | 99.9% | 7.8% |
| FrontierMath Tier 4 | 97.6% | 83.0% |
| Terminal-Bench 4.0 | 57.9% | 37.3% |
| OSWorld 2.0 | 72.6% | 65.7% |
| ScreenSpot-Pro | 92.7% | 76.9% |
| AutomationBench | 41.4% | 18.1% |

The eye-catching number is 99.9% on ARC-AGI-3, but OSWorld 2.0 and ScreenSpot-Pro are more relevant to everyday use — both test interacting with interfaces and completing actions rather than producing text.

It is not the best model on everything. OpenAI's own comparisons show Claude Fable 5.1 ahead on some broad reasoning and coding evaluations, and on the Artificial Analysis Intelligence Index. Frontier models are increasingly specialized, so "best" is a matter of the job.

## The safety story behind the rollout

Astra is the first OpenAI model assessed at the company's highest cybersecurity capability threshold — capable of discovering and chaining zero-days in testing — so access is tightly controlled. OpenAI began with a limited group of organizations, including its application-based cybersecurity program Daybreak, and is expanding from there.

That gating is a clear signal for anyone running an agent: frontier models that get strong computer-use tools are treated as active attack surface, not just as products. The same reasoning drives the [permissions](https://wolffi.sh/blog/ai-agent-permissions-guide) you give your own agent — capability scales, and so does the need for boundaries.

## What it means for your personal agent

The practical takeaway is that the "agent" in AI agent is becoming the point. Astra is designed to execute a goal — research, organize, build, report — instead of describing how you should do it.

If you run a local-first assistant, this also clarifies the trade-off. Cloud models like Astra offer more raw capability and a bigger context, while a local model keeps your data on your machine. That split is the core of the [local vs. cloud decision](https://wolffi.sh/blog/local-first-vs-cloud-ai-assistant), and it's why many people run a hybrid: a frontier model for the hardest reasoning, a [local model](https://wolffi.sh/blog/run-ai-agent-locally) for volume work.

Wolffish's whole premise is that you should own the agent you give your data to — which doesn't mean ignoring frontier models, it means using them with clear rules about what they can touch.

## The takeaway

GPT-6 Astra is not the best model at everything, but it is the clearest sign yet that the frontier has moved from answering to acting. If you run an agent, plan for bigger context, account for the token cost of long workflows, and set tight permissions — because a model this capable is worth using only when you've decided what it may do.

![GPT-6 Astra benchmark comparison](https://cdn.wolffi.sh/blog/openai-gpt-6-astra/chart.html)
