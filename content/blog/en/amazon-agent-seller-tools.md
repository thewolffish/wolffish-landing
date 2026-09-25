---
title: "Amazon AI Agents: Seller Tools Open, Storefront Closed"
description: "At Accelerate, Amazon opened Seller Central to outside AI agents through Claude and Quick — while shopping agents still get blocked. What the split tells you."
date: 2026-09-25
categories: [market, news]
keywords: [Amazon AI agents, Amazon Seller Central API, Selling Partner plugin Claude, agentic commerce, AI agent marketplace access, Amazon AgentCore, seller assistant AI, agent friendly websites]
image: https://cdn.wolffi.sh/blog/amazon-agent-seller-tools/og.png
---

Amazon will let AI agents into the back office and keep them out of the storefront. On September 23 at its Accelerate seller conference, Amazon opened its Seller Central data and actions to outside agents through a new Selling Partner plugin, launching in beta with Anthropic's Claude and alongside Amazon's own Quick assistant. Sellers can now check inventory, listings, pricing and sales performance from inside a general-purpose agent instead of logging into Seller Central. Meanwhile the same company still blocks agents that try to shop on a customer's behalf.

Both moves are deliberate, and together they describe the most important open question in agentic commerce: who gets to be the intermediary.

## What Amazon actually shipped

The announcement has three parts:

- **A Selling Partner plugin** that connects seller data — inventory levels, sales analytics, listing health, real-time performance — to a supported AI agent, so a seller can ask questions and request actions without opening Seller Central.
- **Persistent memory and always-on workflows** in Seller Assistant, Amazon's own seller-facing agent, so it accumulates context instead of restarting each session.
- **A managed model stack underneath**, with the assistant running on Amazon Bedrock and combining Amazon's own Nova models with Claude.

The plugin is a US beta starting with Claude, and Amazon bundled a free 12-month Quick Plus subscription for primary account holders through the end of 2026. [GeekWire's coverage](https://www.geekwire.com/2026/amazon-opens-its-seller-tools-to-outside-ai-agents-starting-with-anthropics-claude/) frames it as a genuine opening rather than a walled garden with a window, and [Unite.AI](https://www.unite.ai/amazon-brings-seller-assistant-to-claude-and-amazon-quick/) notes the same three pieces. API Evangelist's read is the sharpest: [Amazon opened Seller Central to agents and kept the storefront closed](https://apievangelist.com/2026/09/24/amazon-opened-seller-central-to-agents-and-kept-the-storefront-closed/).

## The two doors, side by side

| | Seller-side agents | Shopping-side agents |
| --- | --- | --- |
| Status | Opened — beta plugin, Claude and Quick | Blocked — agentic shopping traffic refused |
| Who is the agent | The seller's, acting for the business | The buyer's, acting for the person |
| Data it touches | The seller's own inventory, listings, analytics | Product pages, prices, checkout |
| Who benefits | Amazon earns fees either way; sellers save time | The buyer compares; Amazon's ad and margin surface erodes |
| Who is in control | Amazon's API, Amazon's terms, Amazon's models | Nobody Amazon did not approve |

The asymmetry is the message. An agent acting *for a seller* is a productivity tool that increases throughput on Amazon's marketplace. An agent acting *for a shopper* is a comparison engine that flattens the difference between listings, kills impulse, and makes the sponsored placement worth less. Same technology, opposite economics.

## Why this is the pattern to expect everywhere

For the last year the story was agents getting blocked: bot checks, terms of service, "unusual traffic" pages. That framing was always too simple. Sites are not anti-agent — they are pro-agent-on-their-terms. Amazon has now shown exactly what the terms look like:

- **Open where the agent works for the account holder** — dashboards, reporting, inventory, support, billing.
- **Closed where the agent works against the house** — price comparison, checkout on someone else's rails, ad-free shopping.
- **Hosted on the site's own stack** where possible, so permissions, models and logging stay inside the perimeter.

That is the same split showing up in [retailers blocking agentic shopping](https://wolffi.sh/blog/amazon-blocks-muse-agentic-shopping), in the broader pattern of [why agents get blocked](https://wolffi.sh/blog/why-ai-agents-get-blocked-websites), and in the wave of agent-payment and agent-identity schemes — an agent with a verifiable identity and a spending limit is a customer a site can tolerate; an anonymous scraper is not.

## What it means if you are not a seller

Three practical reads:

- **Your buying agent will hit walls, and the walls are legal, not technical.** When a site blocks your agent, the fix is almost never a better prompt. It is a different route: a signed-in browser session you control, an official API where one exists, or doing the final click yourself.
- **The best automation targets are your own accounts, not other people's storefronts.** Banking, utilities, subscriptions, insurance, school portals, invoices — places where the account is yours and the site has no reason to fight you.
- **"Agent-friendly" is becoming a product feature.** Expect vendors to advertise agent access the way they advertise API access, and expect the interesting fights to be over who pays the toll on a purchase an agent makes.

For anyone building a personal agent, the lesson is to design for a world of uneven doors: assume some destinations work read-only, some need your session, and some need your hand on the last button. An agent that plans for all three keeps working; one that assumes permanent access spends its life staring at a bot check.

<figure>

![Amazon's two doors for AI agents: where the seller-side agent is let in and where the shopping-side agent is refused](https://cdn.wolffi.sh/blog/amazon-agent-seller-tools/amazon-agent-access.pdf)

</figure>

## The takeaway

Amazon did not pick a side between agents and humans. It picked a side between agents that *serve its sellers* and agents that *compete with its storefront* — and shipped accordingly within 48 hours of each other. Read every agent-access announcement from here that way. The question is never "is this site agent-friendly", it is "agent-friendly for whom, and who gets paid".
