---
title: "AI Standards Body: What It Means for Your Agent"
description: "OpenAI, Anthropic and Google are weighing a FINRA-style AI standards body to test models before release. Here's what it changes for agent users."
date: 2026-09-19
categories: [news, market]
keywords: [AI standards body, FINRA for AI, frontier AI regulation, Demis Hassabis standards body, AI model pre-release testing, AI agent compliance, AI safety oversight, AI governance 2026]
image: https://cdn.wolffi.sh/blog/ai-standards-body-explained/og.png
---

**The three largest AI labs are working on an industry-funded standards body that would test frontier models before release — modelled on FINRA, the body that polices US broker-dealers — and it could eventually become a condition of selling models in the United States.** OpenAI's global policy chief confirmed the talks on the record; Anthropic, OpenAI and Google have been discussing it for weeks. Nothing is agreed, funded, or staffed, and the loudest objection is that it lets three companies write the rules that judge everyone.

Here is what has actually been proposed, what a FINRA-style body would do, and why it reaches further than it looks — including into whatever agent you run.

## What has actually been proposed

Three separate things are often reported as one, so keep them apart:

- **The proposal.** On July 14, Google DeepMind's Demis Hassabis published a plan for a US-led *Frontier AI Standards Body* modelled on FINRA. Frontier labs would submit models for evaluation up to **30 days before release**, tested for dangerous cyber, biological and deception capabilities. Participation starts voluntary and, in his design, later becomes a condition of deploying in the US.
- **The talks.** The Information reported that Anthropic, OpenAI and Google have discussed forming a joint industry body. OpenAI's Chris Lehane subsequently confirmed the three had been working on AI safety together for weeks and described a self-regulatory body modelled on FINRA. Sam Altman endorsed the idea publicly on September 15.
- **The counter-proposal.** Anthropic CEO Dario Amodei's September essay argued for a different mechanism: embed independent evaluators such as METR inside frontier labs for extended periods, and set common safety standards across democratic states.

They agree on the problem — evaluation capacity is not keeping up with release cadence — and disagree on who holds the clipboard.

## How a FINRA-style body would actually work

FINRA works because the SEC sits above it: the industry funds and staffs the rulemaking, and a government regulator backs it with statutory authority. The AI version, so far, has the first half and not the second.

| Body | Founded | Funded by | What it does |
| --- | --- | --- | --- |
| Frontier Model Forum | 2023 | Six member labs | Safety research via the $10M+ AI Safety Fund |
| Agentic AI Foundation | Dec 2025 (Linux Foundation) | Member companies | Open standards for agents — hosts MCP, goose, AGENTS.md |
| Appia Foundation | June 2026, 13 members | Members | Turns governance principles into specs, tests and proofs of compliance |
| EU GPAI Code of Practice | July 2025 | EU | Voluntary route to prove AI Act compliance; Anthropic, Google, Microsoft and OpenAI signed |
| Proposed frontier standards body | Not yet | Industry, per Hassabis | Pre-release model testing, up to 30 days before launch |

## The three real problems

**Independence.** A regulator financed by the companies it regulates has a template: the issuer-pays credit-rating system before 2008, where the entity being graded paid the grader. The Council on Foreign Relations raised exactly that analogy. Who funds the body, who picks the evaluators, and what happens when a model fails are all unanswered.

**Capacity.** GovAI projects that 14–16 models between 2025 and 2028 will be within the same order of magnitude as the largest training run to date. That implies continuous review capacity, not a periodic audit, and no one has staffed for it.

**Entry cost.** The OECD has warned that high fixed costs and concentrated infrastructure already make it hard for new labs to enter. Turn a voluntary framework mandatory and compliance becomes a barrier incumbents can afford and challengers cannot — which is precisely what Cohere's CEO Aidan Gomez called a cartel. Senator Bernie Sanders made the opposite criticism: voluntary industry standards are not enough, and binding international rules are what is needed. Some of the largest names in tech reportedly lobbied the White House against the industry-funded regulator plan.

## What this means if you run an AI agent

Closer to home than it looks, in three ways.

**Model availability gets a window.** If pre-release testing becomes standard or mandatory, new frontier models may arrive later than the announcement — and small labs may ship first precisely because they are not in the scheme. Anyone whose agent depends on the newest model should plan for a gap between "announced" and "available to you."

**Evaluations become procurement checklists.** The direction of travel is that "was this model tested, by whom, and can I see the results?" becomes a question you are expected to ask. That is already the shape of [how to evaluate an AI agent](https://wolffi.sh/blog/how-to-evaluate-ai-agents), and if you buy or build agents professionally, the answers become your due diligence file.

**Agent protocols are already governed.** The notable part of this landscape is that agent interoperability is not waiting for a standards body. MCP, goose and AGENTS.md were donated to the Agentic AI Foundation under the Linux Foundation in December 2025 — a standards body for agents that already exists, already has members, and already shipped specifications. Whatever the frontier labs agree on for model testing sits on top of rails that are already laid.

Worth reading alongside this: the [Anthropic R&D Automation Index](https://wolffi.sh/blog/anthropic-rd-automation-index), which is the kind of measurement such a body would be asked to verify, and our breakdown of [the EU AI Act's agent probe](https://wolffi.sh/blog/eu-ai-act-agent-probe) for what the regulatory side looks like when it arrives with actual authority.

## The takeaway

A FINRA for AI is the most concrete governance proposal on the table, and it is being designed by the three companies with the most to gain from the design. The idea is not crazy — pre-release testing with real capacity is a genuine gap — but it needs an authority above it, and right now there is no SEC. For anyone running agents, the practical effect arrives slowly and indirectly: longer windows between announcement and access, and evaluation results becoming part of every serious buying decision.

Sources: [CNN on the talks](https://us.cnn.com/2026/09/14/tech/ai-standards-body), [Cryptopolitan on the proposals and objections](https://www.cryptopolitan.com/anthropic-openai-and-google-weigh-a-shared-ai-standards-body/), and [TechCrunch on Hassabis's original proposal](https://techcrunch.com/2026/07/14/deepmind-ceo-calls-for-an-independent-standards-body-to-regulate-frontier-ai/).
