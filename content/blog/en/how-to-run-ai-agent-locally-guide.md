---
title: How to Run an AI Agent Locally: Complete 2026 Guide
description: A complete walkthrough of running a personal AI agent on your own machine — hardware, models, setup, permissions, and the trade-offs against cloud agents.
date: 2026-09-17
categories: [guides]
keywords: [how to run ai agent locally, local ai agent setup, self-hosted ai agent, local ai agent hardware, private ai assistant guide]
image: https://cdn.wolffi.sh/blog/how-to-run-ai-agent-locally-guide/og.png
---

Running an AI agent locally means the model, the memory, and the tool calls all execute on hardware you control, so nothing about your email, files, or credentials leaves your machine. You can do it on a current laptop, you do not need a GPU cluster, and the setup takes an afternoon — but the trade-offs against cloud agents are real and worth understanding before you start.

This guide walks the whole path: what "local" actually means at each layer, what hardware you need, which models to pick, how to get permissions right, and where a local agent genuinely beats a cloud one.

## What "local" means at each layer

Most confusion about local agents comes from people using the word for different things. There are four layers, and you can be local at some and not others.

| Layer | Local means | Still cloud if |
|---|---|---|
| The agent loop | Runs on your machine as a process you own | A hosted service orchestrates your tool calls |
| The model | Weights run on your CPU/GPU | You call an API for inference |
| The memory | Files on your disk, readable and editable | A vendor stores your history server-side |
| The tools | Operates on your files, browser, and OS | Integrations run through a vendor's servers |

A fully local setup has all four. A mostly local setup — a local agent loop and local memory, calling a frontier model API for the hard steps — is a reasonable and extremely common middle ground. It is also the setup most people should start with.

If you want the broader framing before the how-to, [local-first versus cloud assistants](/blog/local-first-vs-cloud-ai-assistant) lays out the philosophical split, and [where to run an AI agent](/blog/where-to-run-ai-agent) covers the hosting choices.

## Hardware: what you actually need

The honest answer is that the constraints are memory bandwidth and unified memory, not raw compute.

| Tier | Typical hardware | What runs well | Realistic experience |
|---|---|---|---|
| Minimum | 16 GB RAM, Apple silicon or modern x86 | 7B–8B quantised models | Fine for tool routing and simple tasks, struggles with long reasoning |
| Comfortable | 32 GB unified memory | 14B–30B quantised models | Handles real multi-step work with acceptable speed |
| Strong | 64 GB+ unified memory | 30B–70B quantised, or larger MoE with offload | Approach local frontier-class for many everyday tasks |
| Enthusiast | Dedicated GPU with 24 GB+ VRAM | Larger models at higher precision | Fast, but power-hungry and no longer portable |

Two practical notes. Quantisation — running a model at reduced precision — is what makes the middle tiers viable, and it costs you less capability than the parameter count suggests. And for most personal-agent work, the bottleneck is not the model at all: it is the retrieval, the tool calls, and the number of round trips. A smaller model with good context handling will beat a larger one with bad context management every time.

There is also a hardware reality worth naming: an agent that lives on your laptop stops when the laptop sleeps. If you want automations firing at 7am, either the machine stays awake or you move the agent to a small always-on box.

## Choosing a model

Three families to know, and the right answer depends on your tolerance for API calls.

**Small local models** (roughly 7B–30B quantised) handle tool selection, summarisation, file reads, and routine drafting. They are fast, free to run, and private. They fall down on long-horizon reasoning and anything requiring broad world knowledge.

**Larger open-weight models** — including the 744B-class mixture-of-experts models that have shipped open weights this year — close much of the gap, but they need serious hardware and a willingness to run inference servers.

**Frontier APIs** are still the ceiling for hard reasoning. The pragmatic pattern used by most people running local agents is routing: small local model for routine steps, API for the hard ones, with your memory and tools staying local either way. [The model routing guide](/blog/ai-agent-model-routing) covers how to set up those rules.

If your priority is a model that runs entirely offline, [running an AI agent locally](/blog/run-ai-agent-locally) and [the Qwen local guide](/blog/run-qwen-3-8-27b-locally) both go deeper on the specific model choices.

## Setup: the sequence that works

Work in this order. Each step gives you something testable before the next one depends on it.

1. **Install a runtime.** Ollama or llama.cpp for local inference; check it responds to a prompt before going further.
2. **Pick your agent host.** Either something you install and configure, or an agent framework you configure yourself. If you want markdown-configured agent files rather than a config UI, [Wolffish](https://wolffi.sh/start#guide) is built exactly for that.
3. **Create the memory directory.** Decide where the agent's knowledge lives. Keep it in plain files you can read without tooling — that is the entire point of local.
4. **Connect exactly one tool.** Not five. Pick one — calendar or email — and verify it works before adding more.
5. **Write your permissions file.** This is the step people skip and regret. See below.
6. **Run one real task end to end.** Not a demo. Something you actually needed done.
7. **Add an automation.** One recurring job — a morning digest is the classic — and let it run for a week.

## Permissions: the part that decides whether this is safe

A local agent has more access than a cloud one, because it can reach your filesystem and your OS. That is the feature and the risk in the same sentence.

Set these rules before the agent does anything at all:

- **Irreversible actions require approval.** Sending messages, spending money, deleting files, and pushing to git. No exceptions, no "trusted mode".
- **Read is not the same as write.** An agent that can read your documents should not default to being able to modify them.
- **Scope tools narrowly.** Give calendar access for one calendar, not the whole account, if your provider allows it.
- **Log every action with its reasoning.** Local agents can write an audit trail to a file you can grep. Use that.
- **Test the kill switch.** Stop the agent mid-task deliberately and confirm it stops.

The failure mode to design against is not a malicious agent. It is a confused one that interpreted your instruction more broadly than you meant. [The permissions guide](/blog/ai-agent-permissions-guide) and [getting your agent to ask before acting](/blog/get-your-ai-agent-to-ask-before-acting) both cover this in depth.

## Where local wins, and where it does not

| | Local agent | Cloud agent |
|---|---|---|
| Privacy | Nothing leaves your machine | Content goes to a vendor |
| Auditability | Read every file and log | Opaque by design |
| Offline | Works | Requires a connection |
| Setup effort | Yours to do | Minutes |
| Frontier capability | Limited by your hardware | Always current |
| Always-on | Needs a machine that stays awake | Vendor's problem |

The pattern that emerges: local wins for anything involving your documents, your credentials, and your long-term memory. Cloud wins for heavy reasoning on a device that cannot handle it, and for people who will not maintain a setup.

## Takeaway

Running an agent locally is a weekend project, not a research programme. Get a runtime working, connect one tool, write your permissions rules before the agent touches anything, and add capability only after the previous step is verified. The reason to do it is not that local is faster or smarter — it is usually neither — but that you can read every file the agent knows and every action it took. That property is what makes delegating anything real feel reasonable.

Everything above, condensed into a two-page checklist you can keep open while you build:

![How to run an AI agent locally — the two-page setup checklist](/blog/how-to-run-ai-agent-locally-guide/local-agent-setup-takeaway.pdf)

The [start guide](https://wolffi.sh/start) walks the setup with the exact commands, and [the memory guide](/blog/ai-agent-memory-guide) is the natural next read once you are running.
