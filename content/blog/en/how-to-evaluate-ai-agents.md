---
title: "How to Evaluate an AI Agent: Metrics That Matter"
description: "Public agent benchmarks are saturated and gameable in 2026. Here's how to evaluate an AI agent on your own data — trajectory, tool calls, and the metrics that count."
date: 2026-09-03
categories: [guides]
keywords: [how to evaluate AI agents, AI agent evaluation, AI agent benchmarks 2026, evaluate AI agent performance, trajectory evaluation, AI agent testing, LLM agent evaluation, agent benchmark saturation, how to test AI agents, AI agent eval framework]
image: https://cdn.wolffi.sh/blog/how-to-evaluate-ai-agents/og.png
---

To evaluate an AI agent, stop grading the final answer and start grading the path it took: you need to check whether it called the right tools in the right order, not just whether the output looks right. Public benchmarks are a weak signal in 2026 because they're saturated and gameable, so the only evaluation that reliably predicts production behavior is the one you run on your own data.

That sentence is the whole guide in miniature. The rest is how to do it without building a research lab.

## Why benchmarks mislead you

Public agent benchmarks — from SWE-bench-style coding suites to the dozens of tool-use leaderboards — are approaching saturation. The top models cluster near the ceiling, and labs now optimize for the test rather than the work. A number like "89% on Terminal-Bench" tells you a model is capable, but it tells you almost nothing about whether it will correctly file an expense report in *your* workflow.

The failure is silent and expensive: you pick a model or agent framework because it topped a leaderboard, and it turns out to be wrong for your tasks in ways the benchmark never measured. As the [Automation Anywhere evaluation guide](https://www.automationanywhere.com/company/blog/ai-agent-benchmarks) puts it, what benchmarks miss is trajectory accuracy — whether the agent reasoned correctly on the way to the answer, not just whether it landed there.

## The two metrics that actually matter

There are two things to measure, and they're different questions:

| Metric | Question it answers | Why it matters |
| --- | --- | --- |
| **Task success** | Did it complete the job? | The floor — an agent that can't finish tasks is useless no matter how clean its reasoning is |
| **Trajectory** | Did it take the right path to get there? | The ceiling — a right answer reached through wrong tool calls will break the moment the task varies |

An agent can nail the answer while calling the wrong tools in the wrong order, and that's a production liability. The moment a task shifts slightly, the lucky path stops working. [MLflow's benchmarking protocol](https://mlflow.org/articles/benchmarking-ai-agent-performance/) and [this trajectory-evaluation guide](https://www.morphllm.com/ai-agent-evaluation) both converge on the same prescription: capture the full span tree of model calls and tool calls, then score the path, not just the output.

## A practical evaluation loop

You don't need a benchmark suite. You need a set of real tasks and a scoring habit:

1. **Collect 20–50 real tasks** from your actual workflow — not synthetic ones. Pull from the last month of things you actually wanted the agent to do.
2. **Define the gold trajectory** for each: which tools *should* it call, in what order, with roughly what inputs. Write it down before you run anything.
3. **Run the agent** and log every step — model calls, tool calls, arguments, and outputs.
4. **Score two numbers**: task success (did it finish?) and trajectory match (did it call the expected tools in order?). Score them separately.
5. **Bucket by difficulty.** A 90% success rate on easy tasks says nothing if the hard 10% are the ones that matter. Track the hard bucket on its own.
6. **Re-run on new tasks weekly.** An agent that passes a fixed set can be overfit to it. Rotate fresh tasks in.

The step people skip is writing the gold trajectory first. If you don't know what "right" looks like before you run, you'll convince yourself the agent's path was correct because it got there — which is just verification theater.

## What about LLM judges?

Using a model to score another model's work scales, but it should never set the standard. LLM judges are useful for triage — flagging which runs deserve human review — and they're the only affordable way to score hundreds of trajectories. The rule that keeps them honest: the judge approves nothing; it only ranks and routes. A human sets the gold standard, and a human samples the judge's calls to keep it calibrated. [This 2026 evaluation write-up](https://nomadx.ae/blog/how-to-evaluate-ai-agents-2026/) frames it the same way: evaluate the path, anchor it on tool-call correctness, and never let the judge define the bar.

## Make it part of how you choose an agent

Evaluation isn't a one-time gate — it's how you choose and keep an agent. When you're comparing a personal agent against alternatives, run the same small task set through each and compare both numbers, not just "it worked." A personal agent that holds its own memory and tools needs the same scrutiny as an enterprise one, because the failure mode is identical: it looks right until it quietly does the wrong thing.

If you're choosing a personal agent at all, the same evaluation mindset applies — see our [guide to whether you need one](https://wolffi.sh/blog/do-you-need-a-personal-ai-agent) and the [reliability breakdown of why agents fail](https://wolffi.sh/blog/why-ai-agents-fail-reliability). For the practical side of actually wiring one up, [Wolffish's getting-started guide](https://wolffi.sh/start) walks through a local-first agent you can inspect and evaluate yourself.

![The AI Agent Evaluation Checklist — one-page PDF takeaway](https://cdn.wolffi.sh/blog/how-to-evaluate-ai-agents/ai-agent-evaluation-checklist.pdf)

## The takeaway

Grade the path, not just the answer. Collect real tasks, write the gold trajectory first, score task success and trajectory separately, and re-run on fresh data. Do that, and you'll catch the agent that's confidently wrong long before a leaderboard number would have warned you.
