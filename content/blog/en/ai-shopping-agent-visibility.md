---
title: "Get Your Products Picked by AI Shopping Agents"
description: "AI shopping agents recommend shortlists, not link lists. A merchant playbook: feeds, structured data, UCP and ACP checkout, and returns policy."
date: 2026-09-23
categories: [guides, market]
keywords: [AI shopping agent, agentic commerce for merchants, get recommended by AI agents, Universal Commerce Protocol, Agentic Commerce Protocol, product feed optimization, AI agent product visibility, agentic checkout]
image: https://cdn.wolffi.sh/blog/ai-shopping-agent-visibility/og.png
---

An AI shopping agent does not rank your product page — it decides whether your product belongs in a shortlist of three, and the shopper never sees the other two hundred. To be picked, your listings need to be machine-readable, in stock, and returnable, in that order of urgency. Everything about agentic commerce follows from that one difference.

Traditional search rewards a page that looks good to a person. An agent rewards data it can parse and a promise it can trust.

## How an agent picks a shortlist

The shopper asks for something vague — "a quiet coffee grinder under $150 that arrives before Friday." The agent then does four things, and each one is a filter you can fail.

1. **Retrieves candidates.** Usually from a product feed or structured catalogue, not from crawling your storefront. If you are not in the feed the agent reads, you are not in the conversation.
2. **Filters on hard constraints.** Price, availability, delivery date, shipping region. A missing attribute is treated as a failure, not as a maybe.
3. **Compares what it can read.** Which is where the difference between a well-structured listing and a pretty one shows up.
4. **Checks the risk.** Return window, warranty, seller rating, dispute history. An agent acting for someone else will avoid the ambiguous option rather than gamble with it.

The last step is the one merchants underestimate. Your return policy is no longer a nice-to-have on a footer — it is a ranking input.

## The four signals that decide it

| Signal | What to do | Why it decides the shortlist |
| --- | --- | --- |
| Feed accuracy | Price, stock, dimensions, and shipping time kept in sync, not overwritten nightly | Agents filter on values, and stale stock is the fastest way to be dropped |
| Product identifiers | GTIN, MPN, and brand on every variant | Matching across catalogues depends on them; without them you are unverifiable |
| Structured attributes | Material, capacity, compatibility, what is in the box | An agent cannot infer "works with a 58mm portafilter" from a lifestyle photo |
| Policy and trust data | Return window, warranty, seller identity, ratings | Agents acting on someone's behalf avoid the option they cannot vouch for |

If you only fix one thing this month, fix the feed. It is the smallest change with the largest effect, and it is the difference between being a candidate and being invisible.

## Checkout is moving inside the conversation

The second change is where the purchase happens. In 2026 the major surfaces began closing the loop themselves: Google's [Universal Commerce Protocol](https://developers.google.com/merchant/ucp) is designed to connect consumer surfaces like AI Mode in Search and Gemini directly to merchant backends for discovery and cart checkout, with [checkout on eligible product listings](https://support.google.com/merchants/answer/16837055?hl=en) rolling out through it. OpenAI's Agentic Commerce Protocol sits under Instant Checkout in ChatGPT, and Microsoft's Copilot supports checkout over the same family of standards.

For a merchant, the practical question is not which protocol wins — it is whether your platform has implemented any of them.

| Protocol | Who is behind it | What it gives you | Where it runs |
| --- | --- | --- | --- |
| UCP | Google, with retail and payment partners | Discovery plus checkout on AI surfaces | AI Mode, Gemini |
| ACP | OpenAI, with payment partners | In-chat purchase for listings | ChatGPT |
| AP2 | Google | A payment mandate layer for agent-initiated transactions | Beneath checkout flows |
| MCP commerce | Open, vendor-neutral | Let agents query a catalogue as a tool | Any MCP-capable agent |

Note that MCP appears in this table as commerce, not as something separate — the same protocol your agent uses to call any tool. Interoperating with agents is now a question of exposing a catalogue, which is a smaller job than building a new storefront.

## What the mature agents will ask you

If you already let a personal agent handle the other side — buying, tracking, and chasing refunds — you have a preview of what your own customers' agents will demand. The two requirements that come up first are availability truthfulness and dispute-ability.

- **Availability truthfulness.** An agent that shows a shopper an item you cannot ship has already broken the transaction. Accuracy beats breadth.
- **Dispute-ability.** A purchase that is hard to reverse gets avoided by agents on purpose. Clear, generous, machine-readable return terms are a competitive advantage, not a cost centre.

There is a third that is easier to overlook: agents read a lot of text, so a policy written in marketing language is a policy an agent cannot parse. Say the number of days. Say who pays return shipping.

## How to test whether you are visible

You do not need a new analytics suite to find out. Ask the question your customer would ask, in an agent, and see whether you appear.

1. Write five realistic shopper prompts in your category, with a budget and a deadline in each.
2. Run them weekly in two or three different AI assistants, signed out, so you see the default answer.
3. Log who gets recommended, and which attribute you are missing when you do not.
4. Fix the attribute, not the copy — six times out of ten the reason is a number nobody published.
5. Repeat. Visibility here is a maintained state, not a one-off project.

This is deliberately the same discipline as [generative engine optimization for content](https://wolffi.sh/blog/generative-engine-optimization-agents) — get cited, get chosen — applied to a catalogue instead of an article. And it sits alongside the buyer's side of this shift, covered in [how agentic commerce works](https://wolffi.sh/blog/ai-agents-buy-things-for-you).

## Takeaway

AI shopping agents choose a shortlist, not a ranking, and they filter on machine-readable facts before anything else: accurate feeds, real identifiers, complete attributes, and a return policy stated in plain numbers. Fix the feed first, check which checkout protocols your platform actually supports, and test weekly by asking an agent for what your customer wants — then publish the missing number.

![Interactive: the four agentic-commerce protocols and what each one gives a merchant](https://cdn.wolffi.sh/blog/ai-shopping-agent-visibility/protocol-map.html)
