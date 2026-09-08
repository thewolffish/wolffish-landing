---
title: "AI Agent Add-Ons: The Supply-Chain Problem in Your Skills"
description: "17,800 public AI add-ons pull instructions from unverified sources, some faking Anthropic or OpenAI. Here's what it means for your personal agent."
date: 2026-09-08
categories: [news, guides]
keywords: [AI agent add-on supply chain, rogue AI skills, shadow AI agents, AI agent skills security, fake Anthropic OpenAI skills, CrownStrike Falcon Guardian, AIR Security agent firewall, how to vet AI agent add-ons, AI agent supply chain attack, personal AI agent security]
image: https://cdn.wolffi.sh/blog/ai-agent-addon-supply-chain/og.png
---

The supply-chain problem that hit software is now hitting not your agent — it's hitting the code that agent runs. A new security report found **17,800 public AI add-ons across roughly 6.7 million installations drawing instructions from unverified external sources**, including "skills" that impersonate Anthropic and OpenAI and are capable of running arbitrary code. If you've installed a skill, an MCP server, or a plug-in for your personal agent, this is the story to read before you add another.

## What the report actually found

Researchers discovered that a large chunk of the publicly available add-ons for AI agents pull their instructions from sources nobody vetted. Some add-ons masquerade as official tools from trusted vendors — skills named to look like Anthropic's or OpenAI's — specifically to get past security review. The worst of them can execute arbitrary code on the machine that runs them.

This isn't a theoretical "someone could" warning. The add-ons are public and installed. If you type "turn on the AI that reads my calendar" into your agent's directory, you may be installing a piece of code that reports back, reads files, or runs commands — and you have no way to see what it's doing.

## Why "it's just a prompt" is the wrong mental model

The mistake people make is treating a skill like a longer prompt. A prompt is text; a skill is code. It runs in your environment, with your credentials, and it can call tools, read files, and make network requests. That means the code you added has the same power as the agent itself — and the same questions apply that you'd ask about any software you install. Where does it come from? Who wrote it? What does it touch? What happens when I revoke it?

## Shadow agents are the second half of this problem

CrowdStrike's response, a product called **Falcon Guardian**, frames the other side of it. The company argues the endpoint is where an agent reasons, plans, and runs code — so it's the one place with a complete view of what that agent actually did. Guardian discovers both known and "shadow" AI agents on Windows and macOS endpoints, traces the chain from a user prompt through the identity used, the tools called, and the skills invoked, down to whatever the agent did to the system afterward. It can then block agents that aren't explicitly approved.

The word "shadow" matters. A shadow agent is one running on a machine that nobody in charge knows about — installed silently, maybe by a skill, maybe by another agent. The security world is only beginning to inventory these.

## What a context firewall does

A second company, **AIR Security**, came out of stealth with an inline firewall for agents. Instead of blocking after the fact, it screens the instructions, tools, and data flowing into an agent's context *before* the agent acts. That's a meaningful distinction: a lot of agent exploits need context to do damage. If the malicious instruction never reaches the model, the model never acts on it. This is the "filter what enters the context" approach, and it's where the defense is heading.

## What this means for a normal person running an agent

You don't need an enterprise firewall to stay safe. You need three habits.

1. **Install fewer add-ons.** Every skill, MCP server, and plug-in is code you're trusting. Only add ones you actually need and will use.
2. **Check the source.** Is it from the vendor, or from an unknown account? A skill named "OpenAI official" that lives in a random repo is a red flag, not a credential. Vet it the way you'd vet any third-party software.
3. **Scope the access.** Give the add-on only the permission it needs. Don't let a skill that reads your calendar also read your files, send messages, or spend money. If the agent gives you a permissions panel, use it.

The agent should also ask before it acts on your behalf — on the bigger things, at least. [An agent that confirms before it acts](https://wolffi.sh/blog/get-your-ai-agent-to-ask-before-acting) is the simplest defense against an add-on deciding to do something you didn't intend.

![One-page takeaway: stay safe from rogue agent add-ons](https://cdn.wolffi.sh/blog/ai-agent-addon-supply-chain/takeaway.pdf)

## The takeaway

Your personal agent is only as safe as the code you let it run. The 17,800-add-on report is a warning about the *ecosystem*, not a reason to abandon agents — it's a reason to be pickier. Install less, check the source, and scope the access. That covers the real risk without an enterprise firewall.
