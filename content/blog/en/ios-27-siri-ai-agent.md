---
title: "iOS 27 Siri AI: Your iPhone Becomes an Agent"
description: "iOS 27 lands September 14 with Siri AI: app actions, onscreen awareness, and a dedicated Siri app. Here's what changes and which iPhones get it."
date: 2026-09-10
categories: [product, news]
keywords: [iOS 27 Siri AI, Siri agent, App Intents, iOS 27 release date, Siri AI features, Apple Intelligence 2026, Siri app, iPhone AI agent]
image: https://cdn.wolffi.sh/blog/ios-27-siri-ai-agent/og.png
---

**iOS 27 ships on Monday, September 14, 2026, and its headline feature is Siri AI — a Siri that can understand your personal context, see what's on your screen, and take actions inside your apps.** That is the difference between a voice assistant that reads a weather forecast and an agent that opens the app, fills the field, and confirms the booking.

Apple published the full release notes with the release candidate on September 9, so this is no longer roadmap — it is the build shipping next week.

## What actually lands on September 14

The release notes list four things Siri AI can now draw on: **personal context understanding**, **app actions**, **onscreen awareness**, and **broad world knowledge**. In practice that shows up as:

- **A dedicated Siri app** — a place to start or resume conversations, syncing privately across your Apple devices through iCloud.
- **Siri mode in Camera** — Visual Intelligence built into the Camera app, so you can point at a receipt to split a bill or a plate of food to look up nutrition.
- **Write with Siri** — generate a draft, edit, or get feedback almost anywhere you type. In Messages and Mail it mirrors the way you actually write to specific people.
- **Call Context in Phone** — when you're speaking to a business, Siri proactively surfaces the relevant detail from your other apps, like a confirmation code or a reservation number.
- **Safari gets agent-ish tools** — including Notify Me, which periodically checks a page for changes such as price drops or restocked items.

That last one is a small, telling addition: a browser that watches a page for you is a monitoring agent with a friendly name.

## The part that matters most: app actions

Siri has been able to *answer* for years. iOS 27 is about making it *act*, and that runs on a developer framework called **App Intents**.

Apps declare what they can do as typed, reviewable actions — "start a workout", "log a payment", "add to cart". Apple's own developer documentation describes App Intents as the way apps connect their content and capabilities to Siri AI for personal context, app actions, and onscreen awareness. And with iOS 27, **SiriKit is deprecated: App Intents is the only route by which Siri can call into a third-party app.**

The consequence is blunt — apps that haven't adopted App Intents simply drop out of Siri's agentic flows. Expect a visible capability gap between your most-used apps for a while, while the long tail catches up.

Underneath, Apple's Foundation Models were, in Apple's own words, "custom-built in collaboration with Google and its Gemini models" — a notable detail given how much of the assistant market now runs on someone else's model.

## Which iPhones get it

Siri AI is not a whole-device upgrade. Here is the compatibility split:

| Feature | Requirement |
| --- | --- |
| Siri AI (conversational, app actions, onscreen awareness) | iPhone 16 and later, iPhone 15 Pro, iPhone 15 Pro Max |
| Custom expressive voice (on-device models) | iPhone Air, iPhone 17 Pro and later |
| General iOS 27 update | iPhone 11, 2nd-generation iPhone SE and newer |

So the OS runs on a 2019 phone, but the agent features need at least a 15 Pro or a 16-series device. If you're on an older iPhone, September 14 changes your Settings app, not your assistant.

## How it compares to the other assistants

Siri AI is arriving into a crowded market of always-on agents. The honest comparison:

| | Siri AI (iOS 27) | Google Gemini Spark | A local-first agent |
| --- | --- | --- | --- |
| Where it runs | On-device plus Apple's private cloud | Google's cloud | Your own machine |
| What it can act on | Apps that adopt App Intents | Google apps and connected services | Files, email, browser, shell on your computer |
| Best at | Everyday phone actions, personal context, camera | Inbox and Google Workspace tasks | Multi-step work that touches your own files |
| Trade-off | Only as capable as the apps that support it | Your data lives in Google's cloud | You set it up and maintain it |

None of these replaces the others. Siri AI will own the two-second phone action — the tap-and-ask cases. The longer, messier jobs still belong to an agent with access to your actual files.

If you're deciding what to run where, our breakdown of [the best personal AI agent in 2026](https://wolffi.sh/blog/best-personal-ai-agent-2026) covers the cloud options, and [the Google Assistant shutdown](https://wolffi.sh/blog/google-assistant-gemini-shutdown) is the cautionary tale about what happens when a platform decides your assistant is obsolete.

## What to do on day one

- **Update, then check Settings → Apple Intelligence** to confirm Siri AI is active in your region.
- **Test one real action, not a question.** Asking for the weather proves nothing. Try "add a dentist appointment Tuesday at 4" or a camera action.
- **Expect gaps in third-party apps.** If Siri can't act in an app you rely on, that is an App Intents gap, not a bug — and it is worth reporting to the app's developer.
- **Decide your privacy line now.** Personal context means Siri is reading more of your data, including across apps. A dedicated agent you run yourself is the alternative when that trade isn't worth it — that's what [Wolffish](https://wolffi.sh/start#calendar) exists for, and the [quickstart](https://docs.wolffi.sh/getting-started/quickstart) walks through it.

## The takeaway

September 14 is the day the phone stops being a place you ask questions and becomes a device that can be handed a task. Siri AI's ceiling is set by how many apps adopt App Intents — so the feature you get depends less on Apple than on the developers of the five apps you actually use.

![iOS 27 at a glance: what ships September 14, what Siri AI can do, and which iPhones qualify](https://cdn.wolffi.sh/blog/ios-27-siri-ai-agent/ios-27-takeaway.pdf)
