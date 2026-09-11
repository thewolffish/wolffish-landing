---
title: "OpenAI's Agents API, Explained for Builders"
description: "OpenAI opened its Agents API in public beta on September 10 — a managed Codex harness for long-running cloud agents. What it replaces, and when to use it."
date: 2026-09-11
categories: [news]
keywords: [OpenAI Agents API, Codex harness, build AI agents, cloud agents API, managed agent infrastructure, context compaction, AI agent orchestration, OpenAI public beta, agent subagents, MCP tools]
image: https://cdn.wolffi.sh/blog/openai-agents-api-explained/og.png
---

**OpenAI opened the Agents API in public beta on September 10, 2026 — a managed service that hands you the same harness and infrastructure that runs Codex, so you can stand up a long-running cloud agent with one API call instead of building session management, context compaction, and failure recovery yourself.** You bring the task, the tools, the MCP servers, and the environment; OpenAI hosts and maintains the agent loop and keeps improving it as new models ship.

## What you actually get

The pitch is straightforward: everything between "here is my model" and "here is an agent that works for hours" is boring, hard, and identical across teams. The [Agents API announcement](https://openai.com/index/introducing-the-agents-api/) describes a session created with a single call that specifies:

- **Model and instructions** — including `gpt-6-astra` in the launch example.
- **Tools** — MCP servers over HTTP, custom functions, and built-in tools like web search.
- **Subagents** — `multi_agent: { enabled: true, max_concurrent_subagents: 3 }` in the sample, with concurrency you configure.
- **Environment** — OpenAI's hosted sandbox, your own infrastructure, or a partner sandbox.
- **Vaults** — secrets passed by reference (`vault_ids`) rather than pasted into a prompt.

The parts that used to be your problem are now the harness's:

| You used to build | The Agents API does it |
| --- | --- |
| Context management as sessions grow | Automatic compaction when a session approaches its limit |
| Tool definitions bloating every prompt | Tool search that loads relevant definitions on demand |
| Sequential tool calls, one slow round trip each | Programmatic tool calling — parallel calls, chained operations, results filtered in code |
| Retry and recovery logic after failures | Session recovery managed by OpenAI |
| Harness rewrites on every model upgrade | Versioned harness maintained alongside the models |

MarkTechPost's write-up [captures the framing well](https://www.marktechpost.com/2026/09/10/openai-launches-the-agents-api-in-public-beta-putting-the-codex-harness-behind-one-api-call/): OpenAI hosts and maintains the harness; the environment, context, and UX stay yours.

## Why this matters more than a model launch

For two years the frontier argument was about model quality. The gap that actually decides whether agents work in production has been elsewhere — the scaffolding around the model: memory, compaction, recovery, tool selection, cost per task.

That scaffolding has a name now: the harness. And the interesting move here is that OpenAI is selling *its own* rather than leaving every team to rebuild a worse one. Two consequences:

1. **The floor rises.** Teams that were going to lose six months to session plumbing can now ship the part that is actually theirs — domain tools, knowledge, and workflows.
2. **The moat narrows for the generic-layer builders.** If your product *was* generic agent orchestration, your differentiation just moved to something else.

It also lines up with what the last six months of agent writing has argued repeatedly: the constraint is context, not intelligence. Automatic compaction and tool search are direct answers to the [context tax](https://wolffi.sh/blog/ai-agent-context-tax) that makes agents slow and expensive — the harness is where those wins are captured, and now they arrive with the model rather than after it.

## Environment choice is the real decision

The most consequential design choice in the announcement is not the harness — it is where the agent runs. OpenAI offers a hosted sandbox (the same infrastructure behind Codex and ChatGPT for Work) plus first-class integrations with Blaxel, Cloudflare, Daytona, DigitalOcean, E2B, Modal, Oracle, Runloop, and Vercel.

That spectrum covers three quite different postures:

- **Fully managed** — fastest to production, least control.
- **Your VPC** — data residency and network rules you own.
- **Specialized providers** — GPU shapes, cold-start profiles, and storage that fit a specific workload.

Pick wrong and you will re-platform later, because the sandbox is where your files, secrets, and network policy live.

## When to use it — and when not to

**Use it when:** you are building cloud agents that need to run for hours or days, fan out across subagents, and survive failures; you want MCP servers as your tool layer; your team's value is in domain workflows, not agent plumbing.

**Think twice when:** your agent needs to live on a user's own machine with their own files — a hosted harness and a hosted sandbox are the opposite design. And if your workflow is a fixed pipeline of steps, a plain prompt chain is still cheaper and simpler than an autonomous loop.

That local-vs-cloud split is the same fork the wider ecosystem keeps having; the honest answer is that they solve different jobs. Cloud harnesses are excellent at fan-out, burst, and durability. Local agents are excellent at your data never leaving your machine and your tools being the ones you actually use — that is the design [Wolffish](https://wolffi.sh/start) takes, and it is why the two coexist rather than compete.

## The caveats

- **Public beta.** Expect breaking changes; "iterate quickly during the beta" is the vendor's own language.
- **No extra platform fee, but no free lunch either.** Pricing is still usage-based; a managed harness that compacts and recovers is *doing work* you would otherwise pay an engineer for, but it is not a discount on tokens.
- **Where you still own the outcome.** Compaction can lose details that mattered, tool search can miss the tool you needed, and subagents can duplicate work. The harness removes plumbing, not supervision — evaluation and tracing of *your* workflows remain on you.

![One-page takeaway: what the Agents API handles, and what stays yours](https://cdn.wolffi.sh/blog/openai-agents-api-explained/agents-api-takeaway.pdf)

## What to do next

1. **Read the changelog, then the sandbox docs** — the environment decision is the one you cannot cheaply reverse.
2. **Port one real workflow, not a demo.** Pick a job that currently takes multiple prompt chains and tool calls.
3. **Measure before and after** on the two numbers that matter: cost per completed task, and failure recovery without human intervention.

**The takeaway:** the Agents API is OpenAI acknowledging that the harness is the product. If you were building cloud agents, this replaces months of plumbing; if you were selling that plumbing, it is time to sell the outcomes instead.

For how the same principles change when the agent lives on your own computer, [start here](https://wolffi.sh/start).
