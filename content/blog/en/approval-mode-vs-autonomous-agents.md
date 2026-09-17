---
title: Approval Mode vs Autonomous Agents: Which to Choose
description: Approval mode gates every agent action behind your sign-off; autonomy skips the prompts. A practical breakdown of when each pattern actually wins.
date: 2026-09-17
categories: [guides, product]
keywords: [approval mode ai agent, autonomous agent risks, human in the loop agent, ai agent guardrails comparison, agent permission prompt fatigue]
image: https://cdn.wolffi.sh/blog/approval-mode-vs-autonomous-agents/og.png
---

The choice between approval mode and autonomous agents is the single highest-leverage decision you make when setting up an agent, and most people get it wrong in the same direction: they start autonomous because the prompts are annoying, then retreat to approval mode after the first incident. There is a better way to decide.

The answer is not one or the other. It is a split by reversibility, and once you see the split, the configuration writes itself.

## The two patterns, precisely

**Approval mode** means the agent drafts, stages, and prepares — and then waits. Nothing is sent, posted, paid, or deleted until a human confirms. The agent does the work; you keep the trigger.

**Autonomous mode** means the agent acts and reports. It sends the email, books the slot, files the form, and tells you afterward. You keep the ability to undo, not the ability to prevent.

Both are legitimate. The mistake is applying them uniformly across every action an agent can take.

## The three-factor test

For any action, ask three questions:

1. **Is it reversible?** Can you un-send, un-pay, or restore? If no, that is a strong vote for approval.
2. **Is it cheap to check?** If reviewing the agent's work takes five seconds, approval costs you nothing. If it takes five minutes, autonomy starts winning.
3. **What is the volume?** Approving ten actions a day is fine. Approving two hundred is not a workflow, it is a second job.

Score an action against all three and the pattern falls out.

| Action | Reversible? | Cheap to check? | Verdict |
|---|---|---|---|
| Drafting an email | Yes | Yes | Autonomous |
| Sending an email | No | Yes | Approval |
| Reading a document | Yes | — | Autonomous |
| Deleting a file | No | Yes | Approval |
| Adding a calendar entry | Yes | Yes | Autonomous |
| Making a payment | No | — | Always approval |
| Posting publicly | Semi | No | Approval |
| Research and summarising | Yes | Yes | Autonomous |

Notice that nothing in the "always approval" column is negotiable, and that a large share of everyday work lands in the autonomous column. An agent with this split is genuinely useful and genuinely safe at the same time.

![Reversibility by action type — what your agent should never do alone](/blog/approval-mode-vs-autonomous-agents/reversibility-chart.html)

Hover any bar to see the score. Everything scoring 7 and above is a candidate for autonomy; everything at 2 and below goes behind a gate.

## Why prompt fatigue is the real enemy

The reason people disable approval mode is not that approvals are wrong. It is that they are badly scoped. A system that asks permission for reading a file has trained you to click yes without reading — and once you are clicking without reading, the gate has stopped being a gate while still feeling like one.

This is the failure mode to design against, and it is invisible from the inside. You think you are reviewing. You are rubber-stamping. Then the one prompt that mattered scrolls past while you are approving the eleventh calendar invite.

The cure is not fewer approvals. It is **fewer, higher-stakes approvals**. Approve only the irreversible things, then approve them properly, because they will be rare enough that you actually read them.

There is a second-order effect worth knowing: once approvals are reserved for genuinely consequential actions, people stop resenting them. The complaint about approval mode was never about being asked — it was about being asked constantly and pointlessly.

## The hybrid pattern that works

The configuration most people converge on, after some trial:

- **Draft-and-stage by default.** The agent produces the finished artifact — the email written, the form filled, the post composed — and presents it for one-keystroke confirmation.
- **Auto-execute the reversible.** Calendar changes, file reads, note creation, research runs, and internal organisation happen without a prompt.
- **Hard-gate the four verbs.** Send, pay, delete, publish. These are not configurable defaults; they are the line.
- **Time-box the autonomy.** An agent running unattended overnight gets a tighter gate than one you are watching, because you are not there to catch a wrong turn.
- **Escalate on uncertainty.** When the agent's confidence is low or the instruction was ambiguous, it should ask — not guess and ask forgiveness.

That last rule is worth implementing explicitly. An agent that knows when it does not know is worth far more than one that is merely confident.

## What the industry is doing

This split is not a personal preference. It is becoming the default design across the products shipping right now.

Anthropic's small-business workflows launch in September explicitly starts **every workflow in approval mode** — drafting and staging the work, then waiting for the owner's OK before anything sends, posts, or pays — and lets the owner turn that off one workflow at a time. Shopify, Stripe, and the rest of the connector list all sit behind that gate.

Meta's Muse takes the architectural version of the same idea, gating outbound traffic through a separate broker rather than trusting the agent's own restraint. Both are answers to the same question: where do you put the control so the agent cannot reason past it?

For a local agent, you have more options than either, because you control the whole stack. [Setting up permission rules](/blog/ai-agent-permissions-guide) and [asking before acting](/blog/get-your-ai-agent-to-ask-before-acting) cover the implementation. The [Wolffish start guide](https://wolffi.sh/start#guide) walks through defining these gates in plain configuration files you can read and edit.

## The cost of getting it wrong in each direction

Over-gating produces an agent you stop using. It is annoying, it is slow, and eventually you turn it off entirely — which is a worse outcome than never having set it up, because you have burned the habit.

Under-gating produces an incident. The first one usually involves an email sent to the wrong person, a duplicate payment, or a public post that was not meant to be public. Most are recoverable. Some are not.

The asymmetry is what should drive the design: an over-gated agent wastes your time, an under-gated agent costs you something you cannot get back. When you are unsure which side an action falls on, gate it, and revisit after a week of real use.

## One-page reference

Everything above condensed into a two-page takeaway you can keep next to your config:

![Approval mode vs autonomous agents — the two-page takeaway](/blog/approval-mode-vs-autonomous-agents/approval-mode-takeaway.pdf)

## Takeaway

Approval mode and autonomy are not competing philosophies — they are two settings you apply to different actions, decided by whether the action is reversible, whether checking it is cheap, and how often it happens. Approve the irreversible few and let everything else run. The goal is an agent whose approval prompts are rare enough that you read every one, because a gate you click past without thinking is not a gate at all.

Start with [the permissions setup](https://wolffi.sh/start#guide) and configure your four hard-gated verbs before anything else.
