---
title: "AI Agent Daily Brief: Set One Up in 20 Minutes"
description: "Your daily brief is the highest-value thing a personal agent does. What to put in it, the exact prompt and schedule, and what to leave out of it."
date: 2026-09-25
categories: [guides]
keywords: [AI agent daily brief, AI morning briefing, personal AI agent routine, automate morning summary, AI agent schedule, daily digest AI assistant, AI agent email calendar summary, schedule AI agent automation]
image: https://cdn.wolffi.sh/blog/ai-agent-daily-brief/og.png
---

A daily brief is one scheduled message from your agent, waiting before you start your day: what is on your calendar, what needs a decision, what changed overnight, and what it already handled. It takes about twenty minutes to set up, and it is the single highest-value thing most people ever get out of a personal AI agent — because unlike a chat you have to remember to open, a brief arrives on its own.

This is the complete version: what belongs in it, the prompt to use, where to schedule it, and the failure modes that make people turn briefs off.

## What belongs in a brief

Five blocks, in this order. If a block has nothing, it says "nothing" and moves on — no filler.

1. **Today's shape.** Calendar for the day, with travel time between back-to-back items and any conflict flagged. This is the one block worth getting exactly right.
2. **Needs you.** Messages where someone is waiting on a reply or a decision — a school email, a client question, an invoice with a due date. Not "you have 34 unread emails"; the three that matter.
3. **Due or drifting.** Tasks and renewals with a date: bills to pay, forms to sign, subscriptions renewing, anything with a deadline in the next 14 days.
4. **Watch list.** The handful of numbers or pages you care about — a price you are waiting to drop, a package, a flight fare, a metric. Only what changed, with the change.
5. **Done.** What the agent completed since yesterday. Short, past tense, with the artifact where you can check it.

Notice what every block has in common: it is **read-only or already-finished**. Nothing in a brief spends money, sends anything, or makes a commitment. That is what makes it safe to run at 06:30 while you sleep.

## What to leave out

- **The raw inbox.** A dump of subject lines is noise with a timestamp. Triage, don't forward.
- **Anything the agent cannot verify.** If a calendar feed fails to load, the correct brief says "calendar unavailable", not a confident empty day.
- **Anything outward-facing without review.** Drafts belong in the brief; sends do not.
- **Motivation and commentary.** You do not need a paragraph about how your week looks. You need the three things.
- **More than one screen.** If it does not fit on a phone screen, it will not be read by Thursday.

## Set it up: five steps

1. **Pick three sources.** Calendar plus one inbox plus one more (tasks, notes, a specific site). Adding sources is easy; trusting a brief that quietly skipped one is not.
2. **Write the prompt with explicit gaps.** Tell it what to say when data is missing — this is the difference between a brief you trust and one you stop reading. Template below.
3. **Schedule it 30 minutes before you wake.** Early enough to beat you, late enough that overnight emails are in. A weekday schedule plus a lighter weekend version works better than one job doing both.
4. **Deliver it where you look.** A push notification to your phone and the message sitting in a conversation beats an email you will find at lunch.
5. **Review it daily for one week, then cut.** Every block you skipped reading twice gets deleted. Most briefs fail at nine blocks, not four.

### The prompt

```text
Every weekday at 06:30, build my daily brief from my calendar,
my inbox and my task list. One screen. Five blocks, in this order:

1. TODAY — calendar items with start times and locations. If two
   events are back to back, note travel time. Flag conflicts.
2. NEEDS ME — max 3 messages that need a reply or a decision
   today, with who and what they want in one line each.
3. DUE — anything with a deadline in the next 14 days, plus
   subscriptions renewing this month.
4. WATCH — only items whose value changed since yesterday.
5. DONE — what you completed since the last brief, with the file
   or link where I can check it.

Rules: if a source fails to load, write "unavailable" for that
section and never guess. No advice, no commentary, no summary
of the summary. Ship nothing, send nothing, buy nothing.
```

If your agent supports [persistent facts about you](https://wolffi.sh/blog/ai-agent-memory-guide), add a line telling it who the important people are — "anything from school or my accountant goes in NEEDS ME". A brief improves fast once it knows your priorities rather than guessing them.

## The three failure modes

| Failure | What it looks like | Fix |
| --- | --- | --- |
| **Confident emptiness** | "Nothing on today 🎉" when the calendar feed was actually down | Require an explicit "unavailable" state per source |
| **Volume inflation** | Twelve bullets, all equally urgent | Hard cap every block (3 items max), let the agent rank |
| **Alert fatigue** | A ping for something that could have waited | Reserve high priority for money, travel and hard deadlines |

The third one is why briefs die. If the notification goes off on your phone for something that mattered on Tuesday, you will mute it by Friday — and it will not come back.

## Make it a system, not a one-off

A brief is the natural first automation because it is read-only, bounded, and immediately useful. From there it becomes the base layer other jobs report into: the subscription check writes to DUE, the price watch writes to WATCH, the inbox triage writes to NEEDS ME. One message a day, several agents behind it.

Two things to get right before you add more:

- **Schedule what is safe to leave alone.** Read-and-report first; anything that acts gets a review step. [What to schedule unattended](https://docs.wolffi.sh/configuration/what-to-schedule) has the checklist we use.
- **Set it up in your own stack.** [Scheduling a personal agent's automations](https://wolffi.sh/blog/schedule-ai-agent-automations) covers the mechanics, and [what to automate first](https://wolffi.sh/blog/what-to-automate-first-ai-agent) helps you pick the next job after the brief. If you want the brief itself ready-made, Wolffish ships [scheduled briefings with review gates](https://wolffi.sh/start#guide) as a first-class flow.

<figure>

![Daily brief starter pack: the prompt, a scoring checklist and three ready-made block variations](https://cdn.wolffi.sh/blog/ai-agent-daily-brief/daily-brief-starter-pack.zip)

</figure>

CC on families shows where the pattern is heading — Google's "Your Day Ahead" is the same idea, sent to six people instead of one. Whether it is you or your household, the design rule holds: **one screen, ranked, honest about what it could not read.**

## The takeaway

Twenty minutes, three sources, five blocks, one schedule. A daily brief is the cheapest way to find out whether an agent fits your life — because it asks nothing of you but a glance, and it fails loudly rather than silently. Build it this week, read it for seven days, and delete whatever you skipped. What survives is the automation you actually wanted.
