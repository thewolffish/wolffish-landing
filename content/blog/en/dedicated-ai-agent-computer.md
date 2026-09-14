---
title: "A Computer That Only Runs Your AI Agent: Lapis One"
description: "Pamir's $359 Lapis One is a pocket Linux box built to run your agent 24/7, with a hardware KVM. What it does, who it's for, and the honest catch."
date: 2026-09-14
categories: [product, news]
keywords: [Lapis One, dedicated AI agent computer, agent computer, Pamir AI Lapis One, run AI agent 24/7, always-on agent hardware, Agent KVM, AI agent mini PC]
image: https://cdn.wolffi.sh/blog/dedicated-ai-agent-computer/og.png
---

On September 9, 2026, Pamir AI launched **Lapis One** — an 85mm Linux computer whose entire job is to keep your AI agent running so your laptop doesn't have to. Early-bird pricing is **$359** (list $599), and the feature that made the launch video travel is not the chip: one of its USB-C ports lets the agent watch and drive *another* computer's screen, keyboard, and mouse with no software installed on that machine at all.

It is the first consumer product built around a premise most people are still deciding about — that an agent should have its own computer, the way a household has its own router.

## What it actually is

Under the aluminum shell it is a real Debian machine, not a phone accessory or a bare dev board.

| Spec | Lapis One |
| --- | --- |
| Chip | Rockchip RK3576 — 4× Cortex-A72 + 4× Cortex-A53, 6 TOPS NPU |
| Memory / storage | 8GB LPDDR5, 64GB eMMC, M.2 2230 slot, microSD up to 2TB |
| Display | 240 × 400 monochrome memory LCD — status text stays visible for no power |
| Size / weight | 85 × 85 × 28mm, 227g |
| Battery | 3,300mAh — the maker cites roughly 2–4 hours depending on workload |
| Connectivity | Wi-Fi 6, Bluetooth 5.4, NFC, dual MEMS mics, 1W speaker, XMOS audio DSP |
| Extras | Fingerprint sensor, IMU, 12-pin GPIO, three physical controls |
| OS | Lapis OS (Debian 13 based), Python SDK, Nix support, Tailscale preconfigured |
| Security | LUKS2 disk encryption, TPM 2.0, dm-verity, signed A/B updates with rollback |
| Price / ship | $359 early bird, $599 list; first 140 white units ship October 2026, wider availability December |

The RK3576 is a mid-range ARM chip already used in single-board computers, so the differentiation isn't silicon — it's the enclosure, the battery, the always-on display, and remote access working out of the box. [Pamir's own page](https://www.pamir.ai/) frames it exactly that way: a finished Linux computer you can leave running, not a project you have to case.

## The feature people are arguing about: Agent KVM

Most computer-use agents control the machine they run on — a browser extension, an OS accessibility hook, a virtual display. Lapis One inverts that. Its dedicated USB-C port captures a *separate* computer's display (up to 2K at 30fps) and emulates a keyboard and mouse over the same cable.

The consequence is genuinely interesting in both directions. On the good side, the target machine sees a generic keyboard, mouse, and monitor — it has no idea an agent is attached. That means an agent can operate devices that have no agent-friendly APIs at all, including locked-down or legacy ones. On the risky side, there is no software guardrail on the far end of that cable. The caution has to live on the Lapis One side, because the target has no way to know it's being driven.

If you have ever wanted an agent to handle something on a machine you'd rather not install software on, that's the pitch.

## Who it's for — and who should skip it

**It fits you if** you already run an agent on a schedule and you're tired of it being hostage to a sleeping laptop; if you want SSH access to that agent from your phone anywhere; or if agent-driving-another-machine is a workflow you actually have.

**Skip it if** you're new to agents. Nothing about a dedicated box makes an agent better at its job. The [comparison of where to run an always-on agent](https://wolffi.sh/blog/where-to-run-ai-agent) still applies, and a cheap VPS or an old laptop you already own covers most of the same ground — including the part that matters most, which is that your agent's memory and configuration live in files you control. Buy hardware for a workflow you have, not one you're imagining.

The other reason to wait: this is a first batch from a small company. 140 units in October is a pilot run, not a supply chain.

## The bigger shift

The genuinely notable thing about Lapis One isn't the device — it's the category. For two years the assumption was that agents run *somewhere*: a cloud VM, your laptop, a browser tab. Lapis One is an argument that the agent deserves its own machine the same way your files got a NAS and your media got a streaming box.

That argument gets stronger as agents become always-on rather than on-demand. A scheduled briefing, a price watch, a mailbox triage — these are workloads that want a machine that is simply *always there*, reachable, and disposable if it goes wrong. And a dedicated box is a natural blast radius: if the agent on it does something dumb, it isn't sitting inside the laptop holding your tax returns.

The honest counterpoint is price and power. $359 buys a lot of VPS, and a small server you already pay for doesn't need charging. [Self-hosting an agent](https://wolffi.sh/start#vps) has always been the cheap version of this idea; Lapis One is the version you can hand to someone who doesn't want to manage one.

## Takeaway

Lapis One is a real product solving a real problem — where does an always-on agent live? — and its Agent KVM port is the first hardware answer to "how does an agent operate a machine it isn't installed on." It is also a first-batch device at a non-trivial price. If you already run agents on a schedule, it's worth watching. If you don't, buy nothing yet: get one working on the computer you own, and let the hardware category mature.

![Lapis One against the alternatives, on one page](https://cdn.wolffi.sh/blog/dedicated-ai-agent-computer/takeaway.pdf)
