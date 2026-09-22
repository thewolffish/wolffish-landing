---
title: "AI Agent for Spreadsheets: Analyze Data by Asking"
description: "Stop writing formulas to answer one question. Here's how an AI agent analyzes a messy spreadsheet in plain English — and how to check its numbers."
date: 2026-09-22
categories: [guides]
keywords: [ai agent for spreadsheets, ai spreadsheet analysis, analyze csv with ai, ai agent excel, plain english data analysis, spreadsheet ai agent 2026, ai analyze data questions, chat with your spreadsheet]
image: https://cdn.wolffi.sh/blog/ai-agent-spreadsheet-analysis/og.png
---

An AI agent analyzes a spreadsheet by writing and running code against it, not by reading cells into a chat window. You ask "which region lost the most revenue last quarter," the agent writes a query, executes it, and returns the answer with the rows it used. The reason that distinction matters: an agent that computes can be checked, and one that *reads* numbers off a grid and does mental arithmetic cannot.

That difference is the whole guide. Everything below is about getting the first thing and never accepting the second.

## Why this is one of the two biggest agent use cases

The data backs this up rather than it being a hunch. [LangChain's State of Agent Engineering](https://www.langchain.com/state-of-agent-engineering), a survey of over 1,300 professionals, found research and data analysis is the **second most common primary agent use case at 24.4%**, just behind customer service at 26.5%. Together those two account for more than half of all primary agent deployments.

The same survey found 57% of respondents have agents in production, quality is the top barrier to shipping (32%), and cost has dropped as a concern — falling model prices moved it down the list. So the problem isn't that agents can't analyze data. It's that people can't tell when the analysis is wrong.

## What an agent does that a formula doesn't

If you already have the spreadsheet, why involve an agent at all? Three jobs where formulas lose:

| Job | Formula | Agent |
| --- | --- | --- |
| **Answer a one-off question** | Build a pivot or write a nested formula you'll delete | Ask it, get the answer and the rows behind it |
| **Handle mess** | Breaks on inconsistent date formats, trailing spaces, mixed currencies | Cleans and normalizes before answering |
| **Cross-file reasoning** | Manual VLOOKUPs across three exports with different schemas | Reads all three, works out what matches |

The first row is where most people actually live. You don't want a dashboard; you want one answer, once, and then you want to move on. Building a pivot table to answer a question you'll never ask again is the spreadsheet equivalent of writing a function to add two numbers.

## A worked example

Let's take a genuinely messy file — the kind that comes out of a Shopify export, a bank, or a booking system. Suppose it has these columns:

```
order_date, region, amount, currency, status
"2026-08-01", "north ", 1250.00, "SAR", "completed"
"01/08/2026", "North", 890.5, "SAR", "Completed"
"2026-08-02", "south", 145.75, "USD", "refunded"
```

Three rows, three problems, and each one breaks a formula:

- The same region appears as `north `, `North`, and `south` — trailing whitespace and inconsistent case.
- Dates are in two formats, one of which is ambiguous depending on locale.
- There's a `currency` column, so summing `amount` adds riyals to dollars.
- `status` has both `completed` and `Completed`, and a refund is sitting in the same column as revenue.

A human skims past these. A formula doesn't — it silently returns a number that's wrong in a way nobody notices until a decision depends on it.

## Step by step

1. **Keep a pristine copy.** Give the agent a working copy and never let it touch the original. This is the single most important habit in the whole workflow, and it's the same principle behind [why agents should ask before they act](https://wolffi.sh/blog/get-your-ai-agent-to-ask-before-acting).
2. **Describe your columns, not just the file.** Tell it that `amount` is gross and `status` includes refunds, and that `currency` must be respected. Column *meaning* is the context that prevents a plausible wrong answer.
3. **Ask for the cleaning first, as its own step.** "List every distinct value in `region` and `status`, and tell me what you're normalizing." Review that before any number is calculated.
4. **Then ask your real question.** One question per pass, so a wrong answer is traceable to one cause.
5. **Demand the rows.** "Show the rows that make up that total." An answer you can't trace is a rumor.
6. **Spot-check by hand.** Pick three rows from the evidence and verify them yourself. Thirty seconds, and it catches whole classes of failure.

The prompt pattern that does the most work here is boring: ask for the *method* alongside the answer. "Show me the rows, the filter you applied, and how you handled currency." An agent that has to explain its query usually can't quietly guess.

## What to check before you trust a number

- **Did it exclude refunds?** A revenue figure that includes refunded orders is wrong, and it looks completely normal.
- **Did it convert currency at some rate it invented?** If the agent reports a single total across currencies, ask what rate it used. If it can't name one, the total is fiction.
- **Does the row count match?** "Total across 412 orders" is checkable. If your file has 1,200 rows, that gap is the story.
- **Are the dates parsed the way you think?** Ambiguous formats silently move transactions between months, which is exactly how a quarterly comparison flips sign.
- **Is the answer suspiciously round or suspiciously clean?** Small datasets are where models hallucinate summary statistics — one guide to a popular analysis tool warns directly that too few rows or many missing values produces invented numbers. Ask for the underlying rows when the data is thin.

## When to keep using formulas

Agents are not always the right tool, and pretending otherwise costs you accuracy:

- **The answer is recurring.** If you'll ask the same question every month, build the formula once. An agent that re-derives it monthly will re-derive it slightly differently.
- **The data is small and clean.** Ten tidy rows don't need a code-executing loop.
- **It's a calculation of record.** Anything feeding a tax filing, a payroll or an audit belongs in a deterministic formula you can point at. Keep the agent for analysis, not bookkeeping.

For the recurring-and-personal cases, the right split is an agent that finds the insight and formulas that hold the line — the same division of labour that shows up in [using an agent for expense reports](https://wolffi.sh/blog/ai-agent-expense-reports).

## The takeaway

An AI agent analyzes a spreadsheet well when it runs code, shows its working, and hands you the rows — and badly when it reads numbers and reports a total you can't trace. Ask for the method with the answer, check refunds and currency every single time, and keep your formulas for the questions you'll ask again.

![The messy sample dataset used in this guide — download the CSV](https://cdn.wolffi.sh/blog/ai-agent-spreadsheet-analysis/messy-orders-sample.csv)
