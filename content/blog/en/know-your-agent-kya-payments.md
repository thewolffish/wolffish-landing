---
title: "Know Your Agent: Visa and Mastercard's New AI Rules"
description: "Visa, Mastercard and Ant agreed on a Know-Your-Agent framework for AI payments on September 10. Here's what KYA means for anyone whose agent buys things."
date: 2026-09-11
categories: [news]
keywords: [know your agent, KYA framework, AI agent payments, agentic commerce, AI agent verification, agent identity verification, Visa Trusted Agent Protocol, Mastercard Verifiable Intent, AI agents buying things, agentic payment standards]
image: https://cdn.wolffi.sh/blog/know-your-agent-kya-payments/og.png
---

**Visa, Mastercard, and Ant International announced on September 10, 2026 that they are building a shared Know-Your-Agent (KYA) framework — one way for payment networks to check that an AI agent acting on your behalf is really yours, really authorized, and really doing what you asked.** The announcement is a standards agreement, not a product: no specifications, no rollout dates. But it is the clearest signal yet that the payments industry expects your agent to start buying things, and is laying identity rails before that happens at scale.

## What was actually announced

The three companies used a joint announcement in São Paulo to align on an *interoperable* KYA framework for agentic commerce. In plain terms: an agent that registers and proves itself once should be recognizable across card networks and wallets, instead of repeating verification with every network, merchant, and platform.

The framework rests on three mechanics, per the joint announcement:

- **Cross-network operator traceability.** Every agent is linked back to a validated operator, cardholder, or business, so each transaction has a clear human or company behind it.
- **Shared certification requirements.** Agents are assessed against common security and behavioral requirements before they are trusted to transact.
- **Continuous transaction monitoring.** Identity is re-evaluated using both identity and transaction signals, so trust is ongoing rather than a one-time badge.

That matters commercially because of one number the companies cited: by 2030, AI agents are projected to orchestrate **$3 trillion to $5 trillion** of global consumer commerce. That projection [comes from McKinsey's QuantumBlack research unit](https://www.unite.ai/ant-international-visa-mastercard-align-on-ai-agent-verification-rules/), published in January 2026.

## Why payments needed an identity layer

Agents have been able to browse and recommend for years. Paying is different: money leaving an account without a verified chain of consent is fraud by default. And each network had already built its own answer, all incompatible:

| Protocol | Owner | First released | What it establishes |
| --- | --- | --- | --- |
| Trusted Agent Protocol (TAP) | Visa | October 2025 | Agent authentication and authorization at the transaction level |
| Verifiable Intent | Mastercard | March 2026 | That an agent's action reflects the user's actual intent; open-source, co-developed with Google |
| Agentic Mobile Protocol (AMP) | Ant International | April 2026 | Agent identity and capability certification for wallets and mobile apps, with an agent trust rating |

Three good answers to the same question is still friction. Every merchant, agent platform, and wallet would otherwise keep building three integrations. [Forkast's analysis](https://forkast.news/ant-international-visa-and-mastercard-agree-on-agent-identity-standard-now-comes-the-hard-part/) frames the gap well: agentic commerce is stuck at the identity layer, and interoperability is what unblocks it.

There is also a regulator in the room. The collaboration will run through [BuildFin.ai](https://itdigest.com/fintech/ant-international-mastercard-and-visa-unveil-know-your-agent-interoperability-framework-to-secure-agentic-commerce/), an industry platform convened by the Monetary Authority of Singapore, building on MAS's SAFR framework for agentic finance — which is built around governance checkpoints that verify and record an agent's proposed actions before they execute.

![How the three protocols verify an agent — and what the shared KYA framework adds](https://cdn.wolffi.sh/blog/know-your-agent-kya-payments/kya-protocols.html)

## What this means for you

You will not deal with any of this directly. What you should expect over the next year:

- **Fewer re-verifications.** Your agent should be recognized across networks instead of re-onboarding store after store.
- **A cleaner consent trail.** When something goes wrong, "who authorized this?" becomes answerable — the agent traces to a validated person.
- **Spending that behaves more like a card, less like a script.** Limits, merchant rules, and revocation are the natural next features once identity is solved.

For those of us who already run a personal agent that shops, this is the missing piece. A local agent that checks a price and can complete the purchase has always needed two things: your explicit approval, and a payment rail that trusts it. The approval half is a design choice you control — Wolffish's approach is that anything involving money is confirmed with you first, which is why [its safety patterns](https://docs.wolffi.sh/extending/safety-patterns) put spending behind an approval gate rather than a permission toggle. The trust half is what Visa, Mastercard, and Ant just started building.

## The honest caveats

It is early, and the announcement says less than the headlines imply:

- **No specifications, governance, or timelines** have been published. It is a statement of intent between competitors.
- **Consumer trust is the real bottleneck.** A Product.ai trust report cited by Forkast found only 14% of consumers trust AI to complete purchases without verification, and 42% would not trust an AI with a purchase over $25. Protocol work does not move that number on its own.
- **Proprietary interests are unresolved.** An open, interoperable standard and a gated ecosystem that favors incumbents look identical at announcement time and very different in production.

## What to do now

1. **Keep a human approval step on anything that spends money.** No framework announced this week replaces your judgment.
2. **Watch which merchants and wallets adopt first.** Adoption by the agent platforms you already use is the signal that matters, not the press release.
3. **Read the trade press, not the marketing.** Concrete specs are the milestone to look for — when they ship, [agentic commerce](https://wolffi.sh/blog/ai-agents-buy-things-for-you) gets its trust layer for real.

**The takeaway:** KYA is the payments industry agreeing that agents need verifiable identity before they can be trusted with your money. Nothing changes at your checkout today — but the rails your agent will eventually pay through just got a design. Until then, the safest agent is still the one that asks you first.

If you want to see what that looks like in practice, [see the setups people actually use](https://wolffi.sh/start).
