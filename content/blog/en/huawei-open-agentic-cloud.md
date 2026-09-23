---
title: "Huawei's Open Agentic Cloud: The Non-US Agent Stack"
description: "Huawei opened its agent stack: openEuler ThinkPro, Ascend NPUs, and 5,000+ MCP assets. What a parallel agent ecosystem means for everyone else."
date: 2026-09-23
categories: [market, news]
keywords: [Huawei agentic cloud, openEuler ThinkPro, Huawei Ascend AI agents, MCP assets catalogue, agentic AI infrastructure, non-US AI agent stack, open source agent runtime, AI agent ecosystem]
image: https://cdn.wolffi.sh/blog/huawei-open-agentic-cloud/og.png
---

Huawei has opened its agent stack end to end — a runtime for agents inside the openEuler operating system, agentic tooling in its CANN computing framework, shared Ascend NPU clusters for developers, and a catalogue of more than 5,000 general plus 1,000 industry-specific MCP assets. The short version of why it matters: agent infrastructure is no longer a single-supplier story, and the second stack is being built on open, self-hostable pieces rather than on top of Western cloud APIs.

That has a practical consequence for anyone who runs an agent, even if they never touch Huawei hardware.

## What Huawei actually announced

Four separate announcements, made in the same push, and they only make sense together.

- **ThinkPro in openEuler.** Huawei describes ThinkProcess (ThinkPro) as the atomic unit of an agent's thinking, execution, exploration, and evolution — with APIs at both user-space and kernel-space level that abstract state management and hardware resources like CPU and memory. This is the most interesting piece: it treats an agent as a first-class workload the operating system schedules, rather than as a program pretending to be one.
- **Agentic tooling in CANN.** The compute framework gains agent-aware tooling, alongside an open PTO instruction-set architecture — the layer that connects an agent's plan to the silicon underneath.
- **Shared compute for developers.** Access to clusters of roughly 10,000 NPUs and a "100 NPU-hour" baseline programme, aimed at getting people building without a hardware purchase.
- **AgentArts and openJiuwen.** Huawei Cloud's agent platform and its open-source edition, exposing over 5,000 general and 1,000+ industry MCP assets.

The [official Huawei announcement](https://www.huawei.com/en/news/2026/9/hc-agentic-thinkpro-pto-cann) covers the runtime and silicon side; the [agentic cloud release](https://www.huawei.com/en/news/2026/9/hc-agentic-infra-industry-ai) covers the platform and catalogue. [Power Technology](https://www.power-technology.com/sponsored/huawei-cloud-unveils-enterprise-ai-portfolio-as-it-commits-to-building-an-open-agentic-cloud/) reported the same commitments from the Huawei Connect stage.

## Two stacks, compared

| Layer | US-centric stack (dominant today) | Huawei's stack |
| --- | --- | --- |
| Model access | Closed APIs, per-token billing | Hosted plus open-weight models |
| Agent runtime | Application-level frameworks | ThinkPro inside the OS itself |
| Silicon | CUDA and Nvidia accelerators | Ascend NPUs, open PTO ISA |
| Tool catalogue | MCP servers, fragmented per vendor | 5,000+ general and 1,000+ industry MCP assets, published as a catalogue |
| Compute entry | Pay per token or per hour | Shared clusters plus a free baseline allocation |
| Governance | US and EU regulation | Domestic and export-control regime |

The row that matters most for the next two years is the runtime one. Everyone else ships agents as applications. Putting the scheduler inside the operating system is the bet that agents will be the normal way software runs, not a novelty layered on top of it.

## Why a 5,000-asset tool catalogue is the real headline

MCP — the protocol that lets an agent call tools it was not built with — is only as useful as the number of things it can reach. That is the whole argument for it: an agent with twenty tools is a demo, an agent with five thousand is infrastructure.

A published catalogue of that size, in one place, with an open-source edition behind it, is a distribution play. It means a developer can build an agent that speaks to payment, logistics, manufacturing, and telecom systems without negotiating each integration separately — the same problem every MCP user outside that ecosystem solves by hand, one server at a time. If you have ever spent an evening wiring up a single integration, the value of a catalogue is obvious.

## What this means if you are not in that ecosystem

The honest answer is: nothing changes about your agent tomorrow, and something useful changes about your options.

**Portability is the opening.** MCP is a shared protocol, not a Huawei format. An agent built to consume MCP tools is not locked to whichever catalogue it was wired against first, which makes the protocol layer the one genuinely neutral ground in a fragmenting market. If you are building or configuring skills for your own agent, the [MCP integration docs](https://docs.wolffi.sh/integrations/mcp) cover the part that transfers across stacks.

**Self-hosting gets a second reference implementation.** Every argument for running an agent on your own machine has been built on the assumption that the interesting runtimes are single-vendor. A serious OS-level agent runtime developed outside that lineage weakens the assumption that local-first is a niche.

## The part to be sceptical about

Catalogue sizes are press-release numbers, and "assets" is a generous word — quantity says nothing about whether an individual tool works, is maintained, or is safe to call. The same skepticism applies to any tool directory, and [vetting skills and MCP servers](https://wolffi.sh/blog/how-to-vet-agent-skills-and-mcp-servers) is the discipline that actually protects you. A tool your agent can call is also a tool that can call your agent.

There is also nothing here about consumers. This is enterprise and developer infrastructure, announced for a market where Huawei already has hardware deployed. It is not a personal agent you can install tonight. What it is, is the moment the agent stack stops having one centre — and that is worth knowing regardless of which side you build on.

## Takeaway

Huawei opened a complete agent stack — an OS-level runtime in openEuler, agentic tooling in CANN, shared Ascend compute, and a catalogue of 5,000+ general MCP assets — making agent infrastructure a two-bloc market for the first time. You do not have to use any of it to be affected: protocol-level portability just became a real strategy instead of a talking point, and the local, self-hosted agent stopped being the exotic option.

![One-page takeaway: Huawei's open agentic cloud and the two-stack agent market](https://cdn.wolffi.sh/blog/huawei-open-agentic-cloud/takeaway.pdf)
