---
title: "Anthropic Merges Cowork Into One Claude: What Changes"
description: "Anthropic merged Cowork, chat, and Design into one Claude on September 16, 2026, then shipped Docs and Slides. Here's what changes for your agent."
date: 2026-09-18
categories: [news, product]
keywords: [one Claude, Anthropic Cowork merge, Claude Cowork, Claude Docs, Claude Slides, Claude unified interface, Claude agentic tasks, Claude Pro Max, Claude permission modes, Anthropic September 2026]
image: https://cdn.wolffi.sh/blog/anthropic-one-claude-cowork-merge/og.png
---

**Anthropic merged Claude Cowork into ordinary Claude on September 16, 2026 — there is no longer a separate agent mode to select.** Cowork's multi-step work now runs from any conversation, and Anthropic shipped two new tools with it: Claude Docs and Claude Slides, both in beta on paid plans.

The move is bigger than a menu change. It removes the decision that was quietly costing Anthropic users time — *does this task belong in chat or in Cowork?* — and it tells you where the company thinks agents are going: not a separate app you visit, but the default surface you already use.

## What actually changed

Anthropic's framing is that users told the company the frustrating part was deciding where a task belonged, because work started in one product did not carry into the other. In the merged experience, [Anthropic says](https://www.unite.ai/anthropic-folds-cowork-into-a-single-claude-experience-across-plans/) you describe what you need and Claude picks the tool — answering a quick question, or taking on research, reports, spreadsheets and presentations and handing back finished files.

| Before September 16 | After |
| --- | --- |
| Chat and Cowork were separate places to work | One conversation; no mode to choose |
| Cowork's skills and connectors lived in Cowork | Available from any conversation, with your existing context |
| Claude Design was its own surface | Works inside conversations |
| Docs and Slides did not exist | Both launched in beta on paid plans |
| Long work was a Cowork session | Tasks run in parallel, and keep running in the cloud if you close the laptop |

The rollout is staged. The unified experience [reaches Pro and Max plans over the coming weeks](https://www.unite.ai/anthropic-folds-cowork-into-a-single-claude-experience-across-plans/), and Enterprise admins decide when to switch Docs and Slides on for their organizations.

## The three details that matter most

**Tasks get a permission dial.** A setting in the message box controls how independently Claude works: *Manual* is the default and asks before acting, while *Auto* lets it keep going with automated safety checks before each action. It applies to the whole conversation and can be changed at any time. If you have ever wanted an agent to be bold on one task and careful on another, this is the control you were missing — the same idea we cover in [approval mode vs autonomous agents](/blog/approval-mode-vs-autonomous-agents).

**Cloud work and local work are not the same thing.** More involved tasks keep running in the cloud even if you close your laptop — but tasks that use files or apps on your computer need the Claude Desktop app open. That split is the honest architecture of every cloud agent, and it is why [local-first](/blog/local-first-vs-cloud-ai-assistant) still has a distinct pitch.

**It all lives at one shareable link.** Anything made with Docs, Slides or Design lives at a link that opens on a phone, where you can move an element or tell Claude what to change.

## Why Anthropic did it

Fortune [described the move](https://fortune.com/2026/09/16/anthropic-merges-its-claude-chat-and-agentic-cowork-products-into-a-single-ai-assistant-as-part-of-a-push-to-build-an-ai-superapp/) as Anthropic folding its chat and agentic products into one assistant as part of a push to build a superapp. That is the honest read: when every major lab can do chat well, the differentiator becomes whether the agent finishes the job — and a product that hides its agent behind a separate tab never proves that to a normal user.

It also reverses a cost Anthropic had been paying since January. Cowork began as a research preview for Max plans on macOS on January 12, 2026, reached general availability on macOS and Windows on April 9, arrived on web and mobile on July 7, and gained memory that worked across chat and Cowork on August 25. Each step pulled two products closer. September 16 finished the job.

## What it means if you run a personal agent

The lesson transfers even if you never open Claude: **the interface is not the feature — the loop is.** Whether an agent is one tab or three, it needs the same four things to be worth trusting: memory that persists, a permission setting you understand, work that survives you closing the lid, and a place where finished files actually land.

If you are mapping your own version of that, start at [wolffi.sh/start#control](https://wolffi.sh/start#control) for the approval-and-permissions side, and [wolffi.sh/start#guide](https://wolffi.sh/start#guide) for the rest. Wolffish keeps those four pieces as markdown you can read and edit — which is the whole point of [running the loop on your own machine](/blog/how-to-run-ai-agent-locally-guide). The safety trade-offs of an auto-approving agent are worth understanding before you turn the dial, and we wrote them up in [safety patterns for agent permissions](https://docs.wolffi.sh/extending/safety-patterns).

One caution: consolidation is not automatically safer. Fewer surfaces means fewer places to overlook a permission, but it also means one setting now governs a lot more work. Read the default before you rely on it.

![One-page summary: what the one-Claude merge changes, and what to check first](https://cdn.wolffi.sh/blog/anthropic-one-claude-cowork-merge/one-claude-takeaway.pdf)

## The takeaway

Anthropic's September 16 change settles an argument the whole industry has been having: the agent should not be a destination. If you are choosing tools right now, stop asking which product has the best agent tab and start asking which one keeps the context, the permissions and the output when the tab is gone. And if you are already on Claude, the practical action is small — find the permission setting in the message box, read what Manual and Auto actually do, and set it deliberately rather than by default.
