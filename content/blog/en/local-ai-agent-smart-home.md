---
title: "Run a Local AI Agent on Your Smart Home: The 2026 Guide"
description: "Connect a local LLM to Home Assistant to control your home in plain language, with nothing leaving your network. A step-by-step setup guide using Ollama."
date: 2026-09-08
categories: [guides]
keywords: [local AI agent smart home, Home Assistant Ollama, local LLM home assistant, private smart home AI, Home Assistant AI voice 2026, natural language home control, run LLM locally home, Home Assistant conversation agent, smart home AI guide, local AI assistant home automation]
image: https://cdn.wolffi.sh/blog/local-ai-agent-smart-home/og.png
---

The smart-home setup people actually want in 2026 isn't a cloud speaker — it's a local AI agent that understands plain language and never sends your home data anywhere. By connecting a local LLM to Home Assistant, you get natural-language control of your lights, locks, thermostats, and automations, running entirely on your own hardware. Here's the complete guide.

## Why local instead of a cloud assistant

A cloud assistant sends your voice and home state to a server and waits for the answer. A local setup keeps everything on your network. The model runs on a machine you own, so nothing leaves the LAN, and you don't have a subscription based on how many rooms you automate. The trade is a bit of setup on your end — but for people who care where their home data goes, it's worth the half hour.

## The three pieces you need

1. **Ollama** — the local model server, the standard host. It runs on any machine on your network.
2. **A tool-capable model** — a model that can call functions, since controlling a device is a function call, not a chat reply.
3. **Home Assistant** — the hub that holds all your devices and their state, and that exposes the entities the agent is allowed to control.

## Step 1: Install and run Ollama

Install Ollama on a machine on your LAN — often an old PC, a home-server box, or a spare Mac Mini. Pull a model that's good at tool calling. Run it as a background service so it's always available. You'll get a URL it's listening on, typically `http://your-ollama-host:11434`.

## Step 2: Add Ollama as a conversation agent in Home Assistant

Home Assistant has an official Ollama integration. Add it, and point it at your local server's address. Pick your installed model as the agent. This is the step that turns Home Assistant from "I follow rigid automations" into "I understand a sentence."

## Step 3: Wire it into an Assist pipeline

Assist is Home Assistant's voice pipeline. Chain the pieces together: a wake word, speech-to-text for what you say, the **Ollama conversation agent** as the brain, and text-to-speech for the reply. This is what makes it feel like talking to a person instead of flipping switches.

## Step 4: Control what it can see and do — this is the important part

Give the agent access only to the entities you want it to control. Expose the lights, but maybe not the door lock, or not the security camera. This scoping is where the "agent" earns trust — a home agent that can reach everything is a home agent that can cause real damage if it misfires.

## Step 5: Turn on "prefer handling commands locally"

The single most useful setting in the whole build is the conversation agent's **"prefer handling commands locally"** toggle. With it on, Home Assistant tries its built-in intent engine first. "Turn off the kitchen lights" never touches the LLM at all — the local model only gets involved for genuinely conversational requests. This keeps it fast, predictable, and cheap.

## What a local agent actually does well

The real win isn't "turn on the light" — Home Assistant already does that. It's the *fuzzy* stuff: "it's too bright in here, make it warmer," "I'm leaving for the weekend, do a full sweep of every room and lock up," or "what did I leave running?" An LLM turns messy intent into a sequence of tool calls, then Home Assistant does the precise work. That's the actual value.

## The honest limits

A small local model won't reason like a frontier one. It'll mishear commands, and ambiguous requests sometimes fall apart. That's why the "prefer handling commands locally" toggle and tight entity scoping matter so much. And you still own the updates — the model, the host machine, and the integrations are yours to maintain.

![One-page setup guide: run a local AI agent on your smart home](https://cdn.wolffi.sh/blog/local-ai-agent-smart-home/takeaway.pdf)

## The takeaway

A local agent on your smart home is a real, private upgrade — plain-language control on your own hardware with zero cloud. Start small: one room, one Ollama model, a handful of entities. Get it trustworthy before you hand it the whole house.
