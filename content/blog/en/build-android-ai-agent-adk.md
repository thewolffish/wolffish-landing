---
title: "How to Build an Android AI Agent With Google ADK"
description: "Google's ADK for Kotlin 1.0 is production-ready and runs agents on-device via LiteRT-LM or in the cloud. A step-by-step guide to shipping one."
date: 2026-09-22
categories: [guides]
keywords: [build android ai agent, google adk kotlin, adk for android, on-device ai agent, litert-lm agent, gemini nano ml kit, kotlin ai agent tutorial, ai agent android app, google agent development kit]
image: https://cdn.wolffi.sh/blog/build-android-ai-agent-adk/og.png
---

To build an AI agent for Android, use Google's Agent Development Kit (ADK) for Kotlin. ADK for Kotlin reached 1.0 general availability and now has full feature parity with the Python and Java ADKs, plus Android-first extensions that let an agent run entirely on the phone through LiteRT-LM, or in the cloud through Firebase AI Logic — with the same agent code either way. You define tools with annotations, declare the agent, and pick a model backend; the framework handles orchestration.

The reason this is worth a guide rather than a documentation link is that the interesting decision isn't the code. It's which backend each step of your agent runs on, and that choice has real limits.

## What ADK for Kotlin actually is

ADK is a code-first toolkit: you define agent behaviour, tools and orchestration in Kotlin, and the framework owns the loop. Per [Google's 1.0 announcement](https://developers.googleblog.com/announcing-adk-for-kotlin-10-building-production-ready-ai-agents-in-kotlin-android-and-beyond/), the release brings:

- **Hierarchical multi-agent systems** — chain agents and delegate to specialized children
- **Context compaction** — summarize history to stay inside token limits
- **Human-in-the-loop confirmation flows** — pause, ask, resume
- **Annotation-based tools** — generate schemas from Kotlin functions
- **Session resumability** — serialize and restore an interaction across sessions
- **Java interoperability** and Vertex AI session/memory/RAG services

It's built on a Kotlin Multiplatform core that stays agnostic about the model backend, the session store and the memory system. That agnosticism is the whole point: it's why the same agent can run on a phone or a server.

The [source is on GitHub](https://github.com/google/adk-kotlin) under Apache 2.0, and the [official Android docs live here](https://developer.android.com/ai/adk).

## Step 1 — choose your model backend

Do this before you write a line of agent code, because it constrains everything after it.

| Backend | Runs | Tool calling | Cost | Best for |
| --- | --- | --- | --- | --- |
| **LiteRT-LM** | On-device (Android + JVM) | Yes | Free | Offline, private, low-latency tasks |
| **ML Kit** (Gemini Nano) | On-device (Android only) | **Not yet** | Free | Plain chat and generation |
| **Firebase AI** | Cloud (Gemini) | Yes | Per token | Real work: multi-step tool use |

Two things to notice. First, ML Kit is published as a `-beta` pre-release and **does not support tool calling yet** — `functionCall` and `functionResponse` parts are dropped, so it's for plain generation, not agency. Second, if you try to use the GenAI SDK's `Gemini` class directly on Android, you'll hit a wall: it currently prevents using `API_KEY` and `GoogleCredentials` there. Firebase AI Logic is the supported route, and it's also the way to call Gemini from Android without embedding an API key in your app.

Because every backend is just a `Model` implementation behind the same `LlmAgent` API, switching is a one-line change — and you can compose them. An on-device agent can handle cheap, offline or privacy-sensitive turns and delegate the hard ones to a cloud agent inside the same hierarchy.

## Step 2 — add the dependencies

The core artifact is all most projects need:

```kotlin
implementation("com.google.adk:google-adk-kotlin-core:1.1.0")
```

Add the KSP processor if you want tools generated from annotations, and the webserver module if you'll serve the agent over HTTP:

```kotlin
implementation("com.google.adk:google-adk-kotlin-webserver:1.1.0")
ksp("com.google.adk:google-adk-kotlin-processor:1.1.0")
```

For on-device inference add `google-adk-kotlin-litertlm` (needs JDK 21+), and for cloud calls from Android add `google-adk-kotlin-firebase-android`. Everything is on Maven Central under the `com.google.adk` group.

## Step 3 — define a tool

Tools are ordinary Kotlin functions with annotations. This is the part ADK does better than most frameworks:

```kotlin
class SupportTools {
    @Tool
    suspend fun getOrderStatus(
        @Param("Order ID the customer is asking about") orderId: String
    ): String {
        // call your API
        return "Order $orderId shipped yesterday"
    }
}
```

KSP reads these at compile time and generates the function-call schemas. That gives you type-safe schemas, `suspend` function support, and — the detail that matters on Android — **zero runtime reflection**. Reflection is slow and awkward on mobile, and compile-time generation means a malformed tool schema is a build error, not a 2 a.m. production surprise.

Then expose them to the agent with the generated extension:

```kotlin
tools = SupportTools().generatedTools()
```

## Step 4 — build the agent

Declaring the agent is declarative and short:

```kotlin
import com.google.adk.kt.agents.LlmAgent
import com.google.adk.kt.agents.Instruction
import com.google.adk.kt.models.Gemini

val rootAgent = LlmAgent(
    name = "support_agent",
    description = "Answers customer order questions.",
    model = Gemini(name = "gemini-3.8-flash"),
    instruction = Instruction(
        "You answer order questions. Always look up the order before answering."
    ),
    tools = SupportTools().generatedTools()
)
```

The `instruction` is where you put the behaviour you care about. Notice the pattern in the example: the agent is told to *verify before answering*, not just to be helpful. That single line prevents the most common agent failure — a confident answer built on nothing.

If your agent needs procedure rather than just tools, ADK supports a `SkillToolset`: on-demand playbooks written as `SKILL.md` files that the model loads only when relevant. That's the same progressive-disclosure idea behind [how agent skills work](/blog/ai-agent-skills-guide) and [MCP](/blog/what-is-mcp-ai-agents), and it keeps your token bill down because the playbook isn't in context until it's needed.

## Step 5 — run it and actually look at it

To serve the agent locally with a debug UI:

```kotlin
fun main() = AdkDevServer(AdkServerConfig.inMemory(rootAgent)).start(wait = true)
```

That listens on port 8080 with the development UI at `http://localhost:8080/dev-ui`, including trace and agent-graph endpoints. Two cautions from the docs: the server binds to loopback because the endpoints are unauthenticated — put your own auth in front before you widen it — and if you deploy headlessly, use `AdkApiServer` instead, which leaves the UI unmounted. A stray `-Dadk.web.ui.enabled=true` in the launch environment will re-mount the UI even if your config says otherwise, so don't leave that lying around in production.

## What to know before you ship

- **ML Kit can't call tools yet.** If your feature list includes "the agent books/changes/sends something", ML Kit is the wrong backend today.
- **On-device ≠ capable.** A phone-sized model is excellent at classification and extraction and weaker at multi-step reasoning. Use it for the frontier it's good at and delegate the rest.
- **Test the agent, not just the app.** For an agent, "it ran" is not "it worked" — you need to check which tools it called in what order. The [evaluation approach](/blog/how-to-evaluate-ai-agents) is the same one you'd use on a server agent.

## The takeaway

ADK for Kotlin gives you one agent definition and three backends: on-device with LiteRT-LM, cloud with Firebase AI, or a hybrid of both. Start by picking the backend per step, annotate your tools so the schemas are generated at build time, run the dev UI to see the trace, and remember that ML Kit is chat-only for now. The framework is the easy part; deciding what each step deserves is the engineering.

![Building Android AI agents with Google ADK — one-page checklist](https://cdn.wolffi.sh/blog/build-android-ai-agent-adk/android-adk-checklist.pdf)
