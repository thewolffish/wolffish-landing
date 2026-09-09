---
title: "How to Vet the Agent Skills and MCP Servers You Install"
description: "Agent skills and MCP servers are third-party code — and the first CVE for an agent system showed they can be weaponized. Here's how to vet what you install."
date: 2026-09-04
categories: [guides, security]
keywords: [agent skill security, MCP server security, AI agent skill supply chain, vet AI agent skills, CVE agent skills, MCP supply chain attack, AI agent malware, safe MCP servers, third party AI agent skills, agent skill marketplace risks]
image: https://cdn.wolffi.sh/blog/how-to-vet-agent-skills-and-mcp-servers/og.png
---

An AI agent skill or MCP server is not a plugin you trust blind — it's executable code that runs with your agent's permissions, and it can be weaponized. In January 2026 the first CVE ever assigned to an agentic AI system landed: CVE-2026-25253, a remote-code-execution flaw in a skill runtime that let a malicious skill seize control.

The rule for installing any third-party skill or MCP server is the same as for granting access: **assume it's hostile until you've checked it.** Here's the vetting checklist that keeps you safe.

## Why skills and MCP servers are dangerous

Skills and MCP servers sit in the riskiest possible spot in an agent — they carry the agent's tool access. A skill is often just a Markdown file describing a procedure, but it can ship a bundled script. An MCP server is a small program, usually over HTTP or stdio, that your agent calls for data. If either is malicious, it can read your files, call your APIs, or poison the agent's decisions.

The research is unambiguous. [HiddenLayer](https://www.hiddenlayer.com/research/the-next-ai-supply-chain-risk-malicious-skills-in-agentic-ai) notes that skills aren't cryptographically signed and anyone with a GitHub account can publish one, yet agents will happily execute whatever's inside. [Orca Security](https://orca.security/resources/blog/ai-agent-skill-supply-chain-security/) demonstrated a backdoor installed through an innocuous-looking skill that left no trace in telemetry. And [Unit 42](https://unit42.paloaltonetworks.com/ai-agent-supply-chain-risks/) frames the whole thing as an agent supply-chain problem, not a one-off bug.

## The vetting checklist

Run through these before you install anything into your agent.

1. **Open it before you run it.** Read the skill's description and every bundled script. If there's code you don't understand, find out what it does or don't install it.
2. **Check the source.** Is it from a maintainer you trust, with real stars and a history? A skill with 2 stars and 10 downloads is a red flag, not a vote of confidence.
3. **Check permissions.** Skills and MCP servers should ask for the minimum access. If it wants your filesystem or every API, that's a problem.
4. **Prefer signed packages.** Signed skills can't be swapped out silently. If the registry signs, only install signed ones.
5. **Update with care.** Every update is a new install. A skill that was safe three months ago may not be now.
6. **Grant least privilege.** Even a vetted skill shouldn't run with full access. Limit it, then [further limit it](/blog/ai-agent-permissions-guide) — least privilege is your baseline.

## What belongs in the registry

The marketplace itself is where the risk collects. Researchers have reported hundreds of malicious skills poisoning registries and unauthenticated MCP servers exposed without any access control. That's why the strongest vendors are now shipping *inspection* — a review path that checks a skill before deployment. If your agent's registry doesn't vet, do it yourself. [Sectricity's agentic supply-chain analysis](https://sectricity.com/blog/agentic-ai-supply-chain-security/) is a good reference for how deep the problem goes.

## Treat it like installing software

The mental model is the simplest thing to adopt: a skill or MCP server is software you install, and you shouldn't install software you haven't checked. The same instinct that makes you wary of a random executable should apply to your agent's tools.

If your agent can't run a skill you've vetted because it's [blocked by the website](/blog/why-ai-agents-get-blocked-websites), that's a separate problem. But the security baseline is simple — [read, check, and limit](/blog/ai-agent-security) before you let any third-party code touch your agent.

**Takeaway:** Every skill and MCP server you install is third-party code. Read it, check its source, limit its access — and never trust a registry's count over your own eyes.
