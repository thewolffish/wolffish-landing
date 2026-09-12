---
title: "AI Agent Skills Marketplace: The New App Store (2026)"
description: "Agent skill marketplaces turn SKILL.md files and MCP servers into one-install capabilities. Where to browse, how they differ, and how to install safely."
date: 2026-09-12
categories: [market, guides]
keywords: [AI agent skills marketplace, SKILL.md standard, agent skills 2026, MCP server registry, Claude Code plugin marketplace, agent marketplace comparison, install AI agent skills, agent skill security, AI agent capabilities]
image: https://cdn.wolffi.sh/blog/ai-agent-skills-marketplace/og.png
---

An AI agent skills marketplace is where the capability you are missing already exists as a file someone wrote — you install it instead of building it. The marketplaces that matter in 2026 are not one store: they are a handful of registries and platform-native catalogs, split between **open standards** that work across agents and **walled gardens** that only feed one vendor's product.

Knowing which is which decides whether the skill you install today still works in six months.

## Why this exists now

An agent out of the box can read files, call a few tools and write text. Everything past that has to be added. That used to mean glue code per agent; in 2026 it means one of two packaging formats:

- **A skill** — a folder with a `SKILL.md` file holding instructions, plus any scripts or references it needs.
- **An MCP server** — a small program exposing tools over the Model Context Protocol, so the agent can query a database, drive an API or reach a service.

The reason a marketplace is viable at all is that `SKILL.md` became a cross-agent convention rather than one vendor's format. As [Agensi's market landscape](https://www.agensi.io/learn/ai-agent-marketplace-landscape-2026) puts it, a skill no longer needs a separate version for every agent — which is what turns a format into a distribution layer.

## The marketplaces, compared

| Marketplace | What it holds | Open or walled | Worth knowing |
| --- | --- | --- | --- |
| [Agensi](https://www.agensi.io/) | `SKILL.md` skills **and** MCP servers | Open standard | Curated, runs security scans on listings, 70/30 split paid to creators |
| [Smithery](https://smithery.ai/) | MCP servers | Open standard | The largest MCP catalog; a directory rather than a store |
| [Glama](https://glama.ai/) | MCP servers | Open standard | Registry with cleaner categorisation and search |
| [Composio](https://composio.dev/) | Agent integrations | Open standard | More infrastructure than marketplace — it manages auth and rate limits for you |
| GPT Store / Agent Builder | GPTs and agents | OpenAI only | Huge reach, no portability |
| Claude skills | Skills | Anthropic only | Deep integration with one agent |
| Gemini Extensions | Extensions | Google only | Tied to Google's surface |
| Salesforce AgentExchange | Enterprise agents | Salesforce only | Consolidated the AppExchange, Slack Marketplace and Agentforce catalogs |

The split is the whole story. On the open side, one artifact reaches every compatible agent. On the walled side, distribution is easier and reach is capped by whichever product you signed up to.

## What to check before you install anything

Marketplace curation is a safety net, not a guarantee. The [first CVE for an agent system](https://wolffi.sh/blog/how-to-vet-agent-skills-and-mcp-servers) showed that third-party capability code is exactly as dangerous as third-party code has always been — the difference is that this code runs with your agent's permissions, including your credentials and your files.

A workable order of operations:

1. **Read the skill file end to end.** It is instructions, not compiled code — you can audit it. Look for anything that tells the agent to act without asking, or to keep something from you.
2. **List what it can touch.** Files, network, shell, browser, credentials. A weather skill that wants your password manager is a no.
3. **Install with the minimum permission**, and require an approval step on anything that sends, pays or deletes.
4. **Run a read-only task first** and read each tool call it made.
5. **Know the undo.** Where it lives on disk, the command that removes it, and which credentials to rotate if it turns out to be hostile.

![Skill vetting kit — the checklist and review prompt to run before you install](https://cdn.wolffi.sh/blog/ai-agent-skills-marketplace/skill-vetting-kit.zip)

## The part marketplaces do not solve

Discovery. A catalog answers "what exists", never "what should I add". That question is about your own week: which two or three things do you repeat often enough that a saved procedure beats typing the prompt again. Most people need three skills, not thirty — and precision on an agent's skill pool degrades as the pool grows, which [the research on skill overload](https://wolffi.sh/blog/ai-agent-skills-guide) already showed.

There is also a quieter advantage to how Wolffish handles this: its capabilities are markdown files you can open, read and edit before they run, and MCP connects it to the wider tool ecosystem through [one paste](https://wolffi.sh/start) — the [documentation](https://docs.wolffi.sh) covers how a capability is installed, read and reloaded. A skill you can read is a skill you can keep, fork or delete with confidence — which is the only durable answer to supply-chain risk in a market this young.

## The takeaway

Skills marketplaces are the distribution layer personal agents were missing, and 2026 is the year they became usable: one format, several registries, and a genuine choice between portability and convenience. Use the open-standard catalogs when you want a capability that outlives the agent you happen to run today, use the platform stores when convenience wins, and read every file before you install it. A marketplace gets the skill onto your machine; only you can decide whether it should be there.
