---
title: Sponsored Agents in ChatGPT: What It Means for Buyers
description: OpenAI is testing Sponsored Agents that let an ad become a conversation with a business's AI. What changes for shoppers, sellers, and anyone using ChatGPT.
date: 2026-09-17
categories: [news, market]
keywords: [sponsored agents chatgpt, chatgpt ads 2026, openai advertising agents, ai shopping agents, agent advertising model, chatgpt ads for business]
image: https://cdn.wolffi.sh/blog/sponsored-agents-chatgpt-ads/og.png
---

OpenAI began testing Sponsored Agents on September 16, 2026 — a ChatGPT ad format where clicking an ad opens a separate, clearly labelled conversation with an AI agent built by the advertiser. Instead of a banner and a landing page, you get a chat window that knows what the business sells and will talk to you about it.

It is the first time an ad in a mainstream AI assistant can answer back. That is either a better shopping experience or a more efficient way to be sold to, and the honest answer is that it is both.

## What actually shipped

The mechanics, per OpenAI's announcement and coverage in Search Engine Land, PYMNTS, and Unite.AI:

- Advertisers in the United States can build a **Sponsored Agent** — an agent that represents the business inside ChatGPT.
- A user who clicks the ad enters a **separate conversation**, visually distinct from their normal ChatGPT thread, with the business's agent.
- The conversation is **explicitly labelled as sponsored**, rather than blended into normal assistant output.
- OpenAI also shipped natural-language tools for building campaigns and creatives, plus integrations with **HubSpot and Shopify** — its first CRM and ecommerce connectors.

The Shopify integration is the significant one for merchants. Products connect through the Shopify Catalog, so a store owner who already has a product feed does not rebuild anything to start running ChatGPT ads.

Availability rolled out to US merchants first, with other markets following on September 23.

## Why this is bigger than an ad format

Every ad model in history has ended at the same place: a click, then a page, then a decision the user makes alone. The advertiser's voice stops the moment the landing page loads.

A Sponsored Agent does not stop. The business's position is present in the room while the user is deciding, and it can respond to the specific objection the user just raised. That is a genuinely new shape of advertising, and it arrived without much of a public argument about whether it should.

Put the two halves together and the shift is clear: the same assistant people use to research a purchase now also hosts the seller's advocate inside the same product.

## The three constituencies, and how each is affected

| Who | What changes | What to watch |
|---|---|---|
| Shoppers | You can interrogate a seller's agent directly, 24/7 | Sponsored threads are a different context from your normal chat — keep them separate mentally |
| Small merchants | A conversational sales channel with no site build required | Your agent's answers become your brand voice; you need to own what it claims |
| Advertisers | A new unit that rewards clear product facts over clever creative | Overclaiming is far easier to do accidentally in chat than in a banner |

For shoppers, the near-term upside is real. Asking a seller's agent "will this fit a 15-inch laptop" and getting an answer beats reading a spec table. For merchants, the risk is subtler: an agent that confidently states something wrong about your product is a customer-service problem that scales.

## The trust problem nobody has solved yet

OpenAI has been careful about labelling, and that matters — a sponsored conversation is visually marked rather than disguised as neutral assistant output. But separation is not the same as neutrality.

The deeper question is what happens when a user asks a Sponsored Agent a question with an unflattering answer. A business-sponsored agent asked "is this the cheapest option" has an obvious incentive and no obvious obligation. Nothing in the rollout describes an accuracy standard, and there is no neutral referee inside the thread.

This is the same tension that produced the earlier argument about where AI answers come from. If you want the background on how assistants choose sources, [generative engine optimization for agents](/blog/generative-engine-optimization-agents) covers the mechanics, and [agentic search versus agent search](/blog/agentic-search-vs-agent) works through who is actually doing the looking.

## What it means if you run an agent of your own

There is a practical lesson here that has nothing to do with advertising.

A Sponsored Agent is a business-side agent optimised to talk to your agent. As more commercial conversations happen agent-to-agent, the ability to tell "this is a business making its case" apart from "this is information" becomes a capability you need to build in, not a policy you hope holds.

If you are running a [personal agent](https://wolffi.sh/start#guide) that researches purchases, the safest pattern is the one that already works for email: treat inbound content from a commercial counterparty as untrusted input, keep it out of the context that holds your instructions, and gate anything that spends money behind an approval. [The permissions guide](/blog/ai-agent-permissions-guide) walks through the setup.

## The caveat on all of this

The test is early and limited to the US. We do not yet have data on how often people click into a sponsored conversation, how long they stay, or whether it converts better than a landing page. Any claim about performance right now is speculation.

What is not speculation is the direction. OpenAI now has a monetised surface where commercial agents talk to users inside the assistant, and it has connected the two platforms merchants actually run their catalogues on.

## Takeaway

Sponsored Agents turn an ad into a conversation the business can steer. For merchants that is a cheap new channel with a new failure mode — an agent that speaks for your brand and can be wrong. For shoppers it is genuinely more useful than a landing page, provided you remember which side of the table the agent is sitting on. The important habit to build now is treating a sponsored agent's claims as a sales pitch, however helpful the chat feels.

A pack of prompts for talking to a sponsored agent without letting it set the frame — paste these into the assistant you control:

![Shopper's defence pack — prompts for talking to sponsored agents](/blog/sponsored-agents-chatgpt-ads/sponsored-agent-defence-pack.zip)

See [the start guide](https://wolffi.sh/start) for how to set up an agent that keeps commercial content quarantined from your instructions.
