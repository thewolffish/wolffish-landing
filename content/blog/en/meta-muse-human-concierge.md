---
title: "Meta Muse AI Agent Calls Were Handled by Humans"
description: "Reuters reports Meta routed some Muse phone calls to human contractors. What a hybrid agent means for disclosure, trust, and your own setup."
date: 2026-09-23
categories: [news]
keywords: [Meta Muse human concierge, Meta Muse AI agent, human in the loop AI agent, AI agent phone calls, AI agent disclosure, personal AI agent trust, hybrid AI agent, AI agent transparency]
image: https://cdn.wolffi.sh/blog/meta-muse-human-concierge/og.png
---

Some of the phone calls Meta's Muse agent made on a user's behalf were handled by people, not by the model. Reuters reported on September 22 that Meta has been testing a "human concierge" — contractors quietly taking over calls the agent had placed — and Meta describes it as a feedback exercise that helps it ship better safety and privacy features, not a product feature rolling out.

That single detail is the most useful thing to understand about consumer agents this month, because it tells you what the demo hides: a capable agent is usually held up by humans somewhere behind the curtain.

## What Reuters actually reported

According to internal company posts seen by [Reuters](https://www.reuters.com/business/meta-testing-human-concierge-its-new-personal-ai-agent-muse-2026-09-22/), Meta's test involved human contractors handling some of the calls placed through Muse, the personal agent it launched on September 8. Meta's response, repeated across coverage from [BNN Bloomberg](https://www.bnnbloomberg.ca/business/artificial-intelligence/2026/09/22/meta-testing-a-human-concierge-for-its-new-personal-ai-agent-muse-reuters-exclusive/) and [KSL](https://www.ksl.com/article/51627159/exclusive-meta-testing-a-human-concierge-for-its-new-personal-ai-agent-muse), was that the purpose was "to get feedback so we can implement safety and privacy protections and improve features before we release them publicly."

Three things are verifiable, and worth separating:

- The work was happening. Not rumoured — described in internal posts.
- It was quiet. The human on the line was not announced to the person on the other end as a human.
- It was a test. Meta says it is not a feature it intends to ship.

The uncomfortable part is the middle one. Nothing about the report says the humans were there to deceive anyone; a company testing where an agent fails on live calls is reasonable engineering. But it does mean that for the duration of that test, "an AI called my office" was not strictly true.

## Why a human behind the agent isn't automatically bad

The instinct is to read this as a scandal. It is more interesting than that, and the more useful read is architectural.

Voice is simply the hardest surface an agent operates on. A phone call is real-time, has no undo, exposes you to a stranger who can ask anything, and gives no chance to review a draft. Every consumer agent shipped so far is stronger at reading and writing text than at holding a live conversation about a booking. So when a lab tests phone calls, the sensible engineering move is to keep a person in the loop — not to fake it, but to catch it.

That is the same trade-off every self-hosted agent user makes, just with a different actor. You either accept a higher failure rate on the hard surface, or you put a human somewhere in the path. What differs is who is told.

## The three problems it creates

| Problem | Why it matters | What good looks like |
| --- | --- | --- |
| Undisclosed handoff | The person on the other end consented to a call with a bot, or to a call with a person — not to a swap mid-sentence | "I'm calling on behalf of a customer, with a colleague joining" |
| Data spread | A contractor hearing your call learns what your agent knows: your name, your address, your booking | A clear retention and access policy for anyone who hears your calls |
| Expectation drift | If the demo was partly human, your own results will be worse than the reviews | Judge an agent on what it does unattended, not on its best day |

The third one is what costs you. When a launch is polished by human help that the reviewer never knew about, the reviews describing it are describing something you will not receive. The agent that felt like magic in a hands-on preview becomes the agent that books the wrong table for you.

## What this means for your own setup

If you run a personal agent, the lesson is not "distrust agents" — it is that the interesting question about any agent is **who is in the loop, and whether you would know**.

Three habits that follow from that:

- **Ask before you delegate a phone call.** Voice is the surface where your agent has the least room to recover, and where a mistake is heard by a stranger. Start with calls where a wrong turn is cheap.
- **Make disclosure a default, not a choice.** If your agent identifies itself, the person on the other end behaves completely differently — and the outcome is usually better. Our [guide to agents that make phone calls](https://wolffi.sh/blog/ai-agents-make-phone-calls) covers what to script and when a human should take the call back.
- **Write down what your agent may share out loud.** Spoken details leak in a way typed ones do not. The [permissions guide](https://wolffi.sh/blog/ai-agent-permissions-guide) walks through scoping an agent to read-only or bounded access before you give it a voice.

Wolffish is built the other way around on purpose: the agent runs locally, its memory is a folder of markdown you can open, and anything consequential — a call, a payment, a message to a third party — lands in front of you as an approval before it happens. You can see the same pattern working end to end in the [setup guide](https://wolffi.sh/start#control). Not because agents are untrustworthy, but because "who acted, and did the other side know" should never be a question you have to guess at.

## The pattern to watch

Muse's numbers are real — it climbed to the top of the US iOS free charts within days of launch — and its problems are real too, from Amazon blocking it from shopping to a reported ClickFix vulnerability. A human stopgap in a test is a footnote next to those.

But it is the footnote that predicts what the next year looks like. Every consumer agent will need humans somewhere: for the hardest surface, for the lowest-frequency task, for the call that has to go right. The labs that succeed will be the ones that say so out loud.

## Takeaway

Meta quietly used human contractors on some Muse agent phone calls during testing — a reasonable engineering choice that becomes a trust problem only when it is undisclosed. Judge any agent, including the one on your machine, by what it does with nobody behind the curtain, and make sure you would know if that ever changed.

![One-page takeaway: what Meta's Muse human concierge test means for agent users](https://cdn.wolffi.sh/blog/meta-muse-human-concierge/takeaway.pdf)
