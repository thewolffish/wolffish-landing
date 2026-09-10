---
title: "OpenAI's 10,000-Agent Swarm Cracked Navier-Stokes"
description: "OpenAI says ~10,000 AI agents proved Navier-Stokes can blow up in 88 hours. What a 10,000-agent swarm means for the agents you run yourself."
date: 2026-09-10
categories: [news]
keywords: [agent swarm, OpenAI 10000 agents, Navier-Stokes AI proof, multi-agent orchestration, parallel AI agents, OpenAI Millennium Prize, agent coordination, AI math breakthrough]
image: https://cdn.wolffi.sh/blog/openai-agent-swarm-navier-stokes/og.png
---

**OpenAI announced on September 8, 2026 that a system of roughly 10,000 concurrent AI agents produced a proof that the Navier–Stokes equations can develop a singularity in finite time — reaching the result about 88 hours after the agents were launched.** If it survives scrutiny, it is the clearest example yet of a swarm of agents solving something a single model was never going to get in one pass.

The prize behind it is real: the Navier–Stokes existence and smoothness problem is one of the seven Millennium Prize Problems the Clay Mathematics Institute named in 2000, carrying a $1,000,000 award.

## What OpenAI actually did

The timeline matters, because the swarm is not the whole story:

- **August 28** — OpenAI began training a new internal model that it says is "significantly more capable than GPT-6 Astra." That model is unreleased, and its training was still ongoing when it was used.
- **September 1 (Tuesday)** — after hearing rumors that two Millennium Prize problems had been resolved elsewhere, OpenAI launched an effort to evaluate the model against every open Millennium problem.
- **September 5 (Saturday)** — the Navier–Stokes group returned a result, roughly 88 hours after the first agents started.
- **Afterward** — a further model formalized the proof in Lean, the machine-checkable proof language, in about 17 more hours.

The agents were not a single model asked one question. They were a coordinating system: agents had tools (a cached copy of the internet they could read, and the ability to run code), and they were split into groups that could communicate internally but varied in size. The group that cracked Navier–Stokes ran on the order of 10,000 concurrent agents.

The result itself: an initially smooth fluid at rest can develop a singularity in finite time, with energy staying finite throughout. OpenAI describes the shape as a vortex spiralling inward and stretching like spaghetti.

## The orchestration trick worth stealing

The most interesting detail for anyone who runs agents is how OpenAI split the question. It gave different groups **different versions of the problem statement**: variants A and B, which would resolve as a proof, went to some groups; variants C and D, which would resolve as a *disproof*, went to others.

That is a fan-out with competing hypotheses — you don't ask one agent "is this true?", you ask several agents to attack a claim from opposite directions and see which side produces something that survives. The same pattern also produced a bonus result: a separate, near-100-agent group spent about 50 hours resolving an unforced variant of the related Euler equations regularity problem.

OpenAI did not publish a token or dollar figure for the run, and none of the reporting since has confirmed one.

## Why this is not the same as one agent

A single model answering one prompt has one context window and one line of reasoning. A swarm buys three things a single agent cannot: **parallelism** (many searches at once), **independent verification** (a second agent that did not write the proof checks it), and **hypothesis coverage** (someone is always trying to disprove the thing). The trade is cost and control — every extra agent multiplies tokens, and coordination itself becomes the failure mode.

If you want the smaller-scale version of this debate, it is exactly the question in [one agent or many](https://wolffi.sh/blog/one-agent-vs-multi-agent): a single agent is cheap and predictable, a team of subagents is fast and deep. What OpenAI did was run that dial all the way to the right, at a scale nobody had demonstrated publicly before.

## Two caveats that matter

**The proof is not yet accepted.** OpenAI published a writeup and a Lean formalization, but a Millennium Prize is awarded only after a result is published and accepted by the mathematical community — a process that takes months or years, not hours. Treat this as a claim under review, not a settled theorem.

**The credit fight is already running.** Axios reported the announcement was overshadowed by a dispute over credit for the result, and the framing of "AI solved it" has been contested. That is normal for a big claim, and it is a reason to read the primary source rather than the headlines.

None of that changes the engineering lesson. Even if the proof needs revision, the *system* that produced it — thousands of tool-using agents coordinating on one hard problem, with differently-framed groups racing toward opposite conclusions — is the part that generalises.

## What this means if you run a personal agent

You are not going to spawn 10,000 agents to plan your week. But the swarm pattern scales down cleanly, and it already shows up in the tools you use:

- **Fan out your research.** Instead of one prompt, spin up three or four agents on separate angles of the same question and read the overlap. Every product that advertises "deep research" is doing this under the hood.
- **Use a separate agent to verify.** An agent that checks its own work is grading its own homework. A second pass with a different framing catches more.
- **Budget the coordination, not just the calls.** More agents means more tokens and more ways to go wrong. Cap the loop.

A local-first agent like [Wolffish](https://wolffi.sh/start#research) is a reasonable place to experiment with this at small scale, because the run happens on your machine and you can watch what each agent actually did.

## The takeaway

OpenAI's ~10,000-agent run is the strongest public argument yet that the unit of AI progress is shifting from *the model* to *the system around the model* — orchestration, tool use, and independent verification. The math is still being checked. The architecture is already the story.

![How OpenAI's agent swarm ran: a timeline from a quiet August training run to a Lean-verified proof](https://cdn.wolffi.sh/blog/openai-agent-swarm-navier-stokes/swarm-timeline.html)
