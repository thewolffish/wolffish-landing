---
title: "Posts That Do More: Live Charts, PDFs & Downloads"
description: Wolffish blog posts can now carry working charts, native PDF viewers, video, and downloadable files — right in the article. Here's every block type, live on this page.
date: 2026-08-19
categories: [product, community]
keywords: [wolffish blog, interactive blog charts, embed pdf in blog, personal ai agent blog, rich media markdown]
image: https://cdn.wolffi.sh/generic/banner.jpg
---

A blog about an agent that *does things* shouldn't be limited to paragraphs. From today, posts on this blog can embed working charts, full documents, videos, and files you can take with you — every one of them written in plain markdown, rendered natively by your browser. This post is the living demo: everything below is real.

## A live chart, not a screenshot

This is a self-contained HTML page embedded in the article — hover the bars. It's showing real list prices from Wolffish's own model catalog, and it works because the blog embeds single-file HTML pages as sandboxed-free iframes:

![What a million tokens costs, interactive](/blog-demo/token-cost-chart.html)

## A PDF in the browser's own viewer

Guides and breakdowns can ship with a takeaway document. PDFs render in your browser's native viewer — zoom, search, print — and the little arrow opens them in a full tab:

![Wolffish quick reference, one page](/blog-demo/wolffish-quick-reference.pdf)

## Files you can take with you

Archives and documents become download cards. This one contains five copy-paste starter prompts from the [Get Started guides](https://wolffi.sh/start):

![Five starter prompts for your agent](/blog-demo/starter-prompts.zip)

## Motion, when it earns its place

Video renders with the native player — no external embeds, no tracking scripts:

![Six seconds of ocean gradients](/blog-demo/ocean-motion.mp4)

## And the quiet basics

Images and tables have been here all along:

![The Wolffish banner](https://cdn.wolffi.sh/generic/banner.jpg)

| You write | The reader gets |
| --- | --- |
| `![title](chart.html)` | A live, interactive page in an iframe |
| `![title](doc.pdf)` | The native PDF viewer, inline |
| `![title](file.zip)` | A download card with icon and filename |
| `![title](clip.mp4)` | The native video player |
| `![alt](photo.png)` | A clean, full-width image |

## Why this matters

Words explain; artifacts convince. A cost comparison lands harder as a chart you can hover, a setup guide travels further as a one-page PDF, and a list of prompts is more useful as files in your pocket than text on a screen. Expect future posts here to use these blocks the way good tools get used — when they carry weight, and not before.

If you'd rather make things than read about them, [the Get Started page](https://wolffi.sh/start) is twenty working setups away.
