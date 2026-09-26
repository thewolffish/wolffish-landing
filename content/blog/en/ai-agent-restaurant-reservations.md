---
title: "AI Agent Restaurant Reservations: Book a Table by Text"
description: "Since August 10, ChatGPT books real tables through OpenTable, Resy and Yelp. What works, what still fails, and how to ask for a booking properly."
date: 2026-09-26
categories: [guides]
keywords: [AI agent restaurant reservations, ChatGPT book a restaurant table, OpenTable AI booking, Resy ChatGPT, Yelp waitlist AI, book a table with an AI assistant, AI dining reservations 2026]
image: https://cdn.wolffi.sh/blog/ai-agent-restaurant-reservations/og.png
---

Yes — your AI agent can now actually book the table, not just find the restaurant. Since **August 10, 2026**, ChatGPT completes real reservations through OpenTable, Resy and Yelp inside the conversation, and the assistant on your own machine can do the same through reservation tools it is given access to. The catch is that "can" and "will" are different things: the capability is narrow, the platforms cover specific countries, and how you ask decides whether you get a table or a long apology.

## What changed on August 10

For about a year, the standard agent demo ended the same way. The model found the restaurant, showed you the times, and then hands back control: *"I'm not able to complete the booking on your behalf."* PCWorld watched Claude surface a live Resy availability grid for a restaurant and decline to book it; ChatGPT's agent mode spent five minutes clicking through OpenTable's web interface, selected the wrong party size, and asked the human to finish the job.

On August 10, 2026 that gap closed with three partner launches at once:

- **Yelp** opened its Reservations and Waitlist to ChatGPT across thousands of restaurants in the US and Canada — waitlists included, not only future bookings.
- **Resy**, owned by American Express, launched in-chat reservations for US restaurants the same week, surfacing live availability under each venue and letting you refine by time, party size, cuisine or price.
- **OpenTable** powers recommendations globally. It was the first restaurant-tech partner on OpenAI's agent work, and its own write-up describes the flow plainly: ask for "a table for two tonight at 7PM" and the agent searches the database and returns bookable options ([OpenTable](https://www.opentable.com/restaurant-solutions/resources/openai/)).

The mechanism is not a private, one-off integration. The inline card that renders availability and submits a form is the shape of OpenAI's Apps SDK, which is built on the Model Context Protocol. In practice that matters for a simple reason: **if it is MCP underneath, other agents can reach the same rails.** Community MCP servers for OpenTable already expose search, availability, booking, listing and cancellation as callable tools ([mcp-opentable](https://github.com/markswendsen-code/mcp-opentable), [Apify's OpenTable Booker](https://apify.com/clearpath/opentable-booker)) — which is how a locally-run agent gets the same capability without waiting for a partnership.

## Which channel books where

| Channel | Coverage | Books a table | Joins a waitlist | Where you change or cancel it |
| --- | --- | --- | --- | --- |
| **OpenTable** | Global recommendations | Yes | Depends on venue | On OpenTable |
| **Resy** | US restaurants | Yes | Not advertised | On Resy |
| **Yelp** | US and Canada | Yes | Yes | On Yelp |
| **MCP reservation servers** | Venue-dependent, wherever you connect them | Yes, when the venue is listed | Rarely | On the venue's platform |

Two things to read out of that table. First, **country coverage is the constraint**, not restaurant count — if you are not in the US or Canada, Resy and Yelp are not your route. Second, **cancellations and changes happen on the platform, not in the chat.** Yelp states explicitly that changes are managed through Yelp afterwards. Your agent books; the platform still owns the record.

## How to ask so it works

1. **Give the four facts in one message.** Time, party size, date, and area or cuisine. "Book a table for four at an Italian place near the office, Friday 8pm" beats a conversation spread over six turns.
2. **Say "book", not "find".** Discovery and booking are separate actions in these systems. If you ask for options, you get options — and then you approve.
3. **Confirm the party size out loud.** This is the single most common failure: the agent picks the default (two) and you arrive with three.
4. **Give contact details once.** Name, phone, and any dietary note. If you keep them in the agent's memory, you stop retyping them per booking.
5. **Ask for the confirmation before you walk away.** The confirmation — venue, time, party size, reference — is the only proof the booking exists.
6. **For anything recurring, ask explicitly.** OpenTable's launch material specifically mentions single *or recurring* bookings. "Every second Thursday, 7pm, same restaurant" needs to be asked for as a pattern.

## What still fails

- **Deposit and prepaid venues.** Restaurants that take card details up front sit outside the plain booking flow, because money changing hands is a different rail from a reservation record.
- **Phone-only restaurants.** If a venue takes bookings by voice and nothing else, the agent needs a calling capability, not a reservation one — a separate skill with its own rules.
- **Large parties and special requests.** Eight people with a set menu is a negotiation, not a form. Use the agent to prepare the ask; make the call yourself.
- **Genuinely hot tables.** A platform only sees inventory that exists. The agent does not get you the table that was never released.

The honest summary: agents are now excellent at the *routine* booking, and still useless at the ones that require a human relationship.

## Why this matters beyond dinner

A restaurant table is the first mass-market instance of an assistant completing a real-world transaction inside a conversation — a booking record moved, not a link returned. That is the same machinery behind [agents that buy things for you](https://wolffi.sh/blog/ai-agents-buy-things-for-you), and the same reason the assistant you run yourself needs the same kind of access: an agent that can only read is an agent that always hands the last step back to you.

If you want the capability on your own machine rather than in someone's app, the wiring is ordinary — the reservation server gets added like any other tool, and the agent uses it. [The guide on the start page](https://wolffi.sh/start#guide) covers connecting external tools, and [how agents get live web information](https://wolffi.sh/blog/ai-agent-live-web-search) explains why a tool call beats a scrape for anything with real inventory.

## The takeaway

Booking a table by text works now, with real constraints: OpenTable globally for discovery, Resy in the US, Yelp in the US and Canada with waitlists, and MCP servers for anything you host yourself. Say "book", name the party size, keep your details in memory, and always collect the confirmation. Then check the platform — because that is still where the reservation actually lives.

<figure>

![Where each booking channel works: OpenTable, Resy, Yelp and self-hosted MCP servers compared](https://cdn.wolffi.sh/blog/ai-agent-restaurant-reservations/comparison.html)

</figure>
