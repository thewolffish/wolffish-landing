---
title: "AI Agents Found a New Enzyme: Inside a 950-Agent Run"
description: "Anthropic ran ~950 Claude agents for 21 hours over 200,000 enzymes and flagged a CRISPR-like system nobody had described. What it proves — and doesn't."
date: 2026-09-25
categories: [news]
keywords: [AI agents scientific discovery, Anthropic Claude enzyme discovery, ART enzyme system, AI agents in biology, AI agent fleets, Claude agents 21 hours, AI research automation, AI agent drug discovery]
image: https://cdn.wolffi.sh/blog/ai-agents-scientific-discovery/og.png
---

Anthropic says roughly 950 Claude agents spent 21 hours and 210 million tokens searching a DNA database, and one of them flagged an enzyme system no one had described before. The system — array-associated reverse transcriptases, or ART, found in bacteriophage DNA — pairs a reverse transcriptase with an array of repeating DNA sequences, a combination that until now had only been seen together in a handful of systems that turned out to be programmable. The finding is real and written up; its function is still unknown.

That gap between "flagged" and "understood" is the whole story. Here is what actually happened, what the announcement does and does not establish, and why the shape of the run matters even if you never touch a pipette.

## What the agents actually did

Anthropic's life sciences group gave Claude one prompt: search a large database of DNA sequences for interesting new examples of reverse transcriptases. From there the company says its involvement was limited to that prompt and the lab work. The agents did the rest:

- gathered more than 200,000 reverse transcriptases from sequence data
- identified 3,500 new candidate systems
- produced a short human-readable report for each of the 20 most compelling candidates, proposing a function and the evidence for it
- eliminated most candidates in a follow-up pass where the agents critiqued their own evidence

For an expert scientist, Anthropic notes, that sweep is weeks to months of work. One agent then noticed the defining feature — a repeating pattern of DNA sequences sitting next to the gene for an odd-looking reverse transcriptase.

<figure>

![The funnel Anthropic reported: 200,000+ reverse transcriptases gathered, 3,500 candidate systems, 20 written reports, and one system that survived lab testing](https://cdn.wolffi.sh/blog/ai-agents-scientific-discovery/agent-funnel.html)

</figure>

## Why 950 agents is a different kind of run

The number that matters is not 950. It is the *report per candidate*.

A single long chat session asked to "find something interesting in 200,000 sequences" produces a vibe and a handful of guesses. A fleet of agents that must write a separate, evidence-backed case for each shortlisted candidate produces something a scientist can audit — and, crucially, reject. Anthropic describes most candidates dying at the review stage, which is the point. Cheap hypothesis generation is only useful when something downstream is expensive and strict.

That pattern is not specific to biology. It is the same shape as any agent job worth automating: fan out over a large pile, produce one defensible artifact per item, then run a second pass that tries to kill each one. Sorting 180 unread emails, comparing 40 subscriptions, or reading 12 lease clauses all work the same way. The volume is where the agent earns its keep; the second pass is what makes the output trustworthy enough to act on.

## What is proven, and what is not

Worth being precise, because headlines flattened this one:

| Claim | Status |
| --- | --- |
| ~950 agents ran for ~21 hours using 210M tokens | Stated by Anthropic, consistent across coverage |
| The underlying reverse transcriptase was already known | Yes — it had been identified in an earlier study of a jumbo phage |
| The associated DNA repeat array and accessory protein were new | Anthropic says Claude appears to have been the first to notice them |
| The system's function | Unknown. Research ongoing |
| Peer review | None. A pre-print was released alongside the announcement |
| Who did the lab work | Human scientists, BSL-1 and BSL-2 work only, no human pathogens |

The endorsement is real but measured. Feng Zhang, a CRISPR pioneer at MIT and the Broad Institute, called it "an exciting example of how AI agents can contribute to biological discovery" and said the identification of RNA-repeat arrays associated with reverse transcriptases "is genuinely intriguing and merits further investigation" — which is a scientist saying *look closer*, not *this changes medicine*. [Anthropic's own post](https://www.anthropic.com/news/claude-discovers-novel-enzyme-system) is careful in the same way, and [Quartz's write-up](https://qz.com/anthropic-claude-crispr-like-enzyme-system-bacteriophage-092426) notes the CRISPR analogy is about structure and potential, not proven function.

## The honest read on "AI does science"

Three things this story genuinely changes:

- **Search is no longer the bottleneck.** Millions of agents scanning public sequence data in hours is a real shift in what a small team can attempt. The related work is compounding fast — [Stanford's Paper2Agent](https://wolffi.sh/blog/paper2agent-research-papers-agents) turns published papers into runnable agents, and [Anthropic's R&D index](https://wolffi.sh/blog/anthropic-rd-automation-index) already measured how much of its own research loop Claude carries.
- **Verification is the bottleneck now.** Anthropic's scientists spent their time deciding which hypotheses deserved a bench. Expect the scarce skill to be taste — choosing what to test — not throughput.
- **The lab is still human.** Every physical result here came from people. Agents proposed; people pipetted.

If you want the version of this pattern that fits your own week rather than a wet lab, it is the same discipline: give the agent a bounded, read-only pile, demand one written artifact per item, then let it argue itself out of most of them before you look. [What to schedule unattended](https://docs.wolffi.sh/configuration/what-to-schedule) covers where that line sits, and it is where a personal agent like Wolffish is designed to live — [scheduled, sourced, and reviewable](https://wolffi.sh/start#guide) rather than one-shot clever.

## The takeaway

Anthropic's agents did in 21 hours what a researcher would have spent weeks or months on, and the payoff was one genuinely new candidate — not a cure, not a peer-reviewed enzyme, not a product. That ratio is the realistic promise of agent fleets: enormous search, tiny yield, and a human deciding what the yield means. Measure your own agent work the same way. Not "did it sound smart", but "how many candidates did it produce, and could I check them?"
