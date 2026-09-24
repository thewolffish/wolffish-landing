---
title: "How to Switch AI Assistants Without Losing Data"
description: "How to move your chats, preferences and prompts from ChatGPT, Claude or Gemini to another assistant — and keep the parts that actually make it useful."
date: 2026-09-24
categories: [product, guides]
keywords: [switch AI assistant, export ChatGPT data, move AI assistant memory, AI data portability, import ChatGPT to Gemini, AI agent memory, switch from ChatGPT to Claude, keep your AI prompts]
image: https://cdn.wolffi.sh/blog/switch-ai-assistant-keep-memory/og.png
---

You can switch AI assistants without starting over, because almost everything that makes an assistant useful is exportable — chat history, stated preferences, and the custom instructions you wrote. What does not move on its own is the structure: your saved prompts, your project rules, and the tool connections you built up. Handle those deliberately and a switch takes an afternoon instead of a month.

## What transfers, and what does not

Be clear-eyed before you start, because a migration plan built on the wrong assumption wastes the most time.

| Asset | Moves? | How |
| --- | --- | --- |
| Chat history | Yes, as an archive | Built-in data export (a ZIP, usually JSON) |
| Custom instructions / system prompt | Yes, verbatim | It is just text — copy and paste it |
| Stated preferences ("senior engineer, be concise") | Yes, as text | Re-enter once in the new tool |
| Long-term memory entries | Partly | Some assistants now ingest a rival's history directly |
| Saved prompts and procedures | Yes, if you stored them as files | Copy the files — this is the valuable part |
| Skills, tools and connectors | No | Re-author per platform |
| Schedules and automations | No | Re-create per platform |

Two of those rows decide how painful the move is. Prompts stored as *files* travel perfectly; prompts stored as *messages you scroll back to find* do not.

## Step 1: export before you browse

Do this first, even if you are only thinking about switching — exports can take hours to arrive and expire.

- **ChatGPT:** open Settings, go to Data controls, use Export data ([ZDNET walks through it](https://www.zdnet.com/article/how-to-switch-from-chatgpt-to-gemini-without-starting-from-scratch/)).
- **Claude and Gemini:** both offer account data exports from settings, and Google has built an import path that ingests a ChatGPT or Claude history so you are not rebuilding memory by hand.
- **Everything else:** check for an export before you check for a delete button. An assistant that will not hand you your data is telling you something.

## Step 2: filter hard

A manual export is typically 95% noise — one-off questions, regenerated answers, abandoned threads. Judge each conversation with one question: *would I be annoyed to explain this again?* Keep those, plus anything containing code, configuration, or a decision you made.

Most people find that 2000 conversations reduce to 30 that matter. That is the point of the filter — the archive is evidence, not memory.

## Step 3: turn history into a profile

This is the step almost everyone skips and the one that pays. Write a single document — call it a profile — that says who you are, what you are working on, how you want to be answered, and the standing rules you keep repeating.

Include:

- role, expertise level, and the tone you actually want
- the projects you are running, with one line each on their current state
- your preferences: responses in English, concise, no filler
- your boundaries: never delete files, never push to git, never install globally without asking
- the tools and accounts the assistant should know about

That file is worth more than the entire archive. It takes twenty minutes to write and it is what stops the new assistant feeling like a stranger.

## Step 4: re-enter instructions once, not repeatedly

Every assistant has a place for persistent instructions — custom instructions, a project, a system prompt, settings. Put the stable half of your profile there, not the project detail. Then put project detail in the project or folder the new tool provides, so it loads only when relevant.

The failure mode is pasting your whole life story into every new chat. It burns context and the model stops reading it.

## Step 5: keep prompts as files, not messages

Anything you have asked for more than twice is a procedure, not a question. Save it as a file with a clear name — a vendor enquiry template, a weekly review checklist, a research brief — and keep those files in one folder you control.

This is the difference between a migration that hurts and one that does not. Files are the only layer that survives every platform change, because no provider can revoke them.

## Step 6: test with the same three tasks

Do not judge the new assistant on a fresh chat. Run the same three real tasks you ran on the old one and compare output directly:

1. one task that needs your context (a document review in your domain)
2. one that needs a tool (a search, a file, a calendar)
3. one that needs a procedure (your saved prompt, unedited)

If task three fails, your prompts did not come across. If task one fails, your profile is missing something.

## Own the portable layer

The lesson from every migration is the same: whatever lives only inside a vendor's memory is rented, and whatever lives in files you can read is owned.

That is the design bet behind Wolffish — its memory is markdown in a folder on your machine, and its procedures and skills are files you can open, edit and copy to anything else. You can start from [the CLI quickstart](https://wolffi.sh/start#cli) or read [how it structures memory](https://docs.wolffi.sh/memory/overview). Even if you never switch again, having a portable layer makes the next switch boring, which is exactly what you want.

The same logic applies to what your assistant remembers over time; our [memory guide](https://wolffi.sh/blog/ai-agent-memory-guide) covers how to keep that useful rather than noise, and the [local-first comparison](https://wolffi.sh/blog/local-first-vs-cloud-ai-assistant) covers what you gain and give up by hosting it yourself.

![Migration starter kit: a profile template, a prompt-file naming scheme and a three-task test checklist](https://cdn.wolffi.sh/blog/switch-ai-assistant-keep-memory/migration-kit.zip)

## The takeaway

Export first, filter brutally, write one profile document, and keep every repeated prompt as a file. Do those four things and switching assistants becomes a routine maintenance task instead of a hostage situation — and the next assistant you try gets a running start rather than a blank slate.
