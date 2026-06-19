<picture>
  <img src="https://cdn.wolffi.sh/general/ogimage.jpg" alt="wolffish" />
</picture>

# wolffish-landing

**The front door to wolffish.** Published at [wolffi.sh](https://wolffi.sh).

Landing page for the Wolffish desktop agent — an immersive, bilingual (English + Arabic) single-page site with a real-time 3D ocean scene, dynamic release detection, and platform-aware download links.

---

## Watch

<table>
  <tr>
    <td align="center">
      <a href="https://www.youtube.com/watch?v=MA6KkeZyFF4"><img src="https://cdn.wolffi.sh/general/Demo%20walkthrough.png" width="360" alt="Demo walkthrough" /></a>
      <br /><b>Demo walkthrough</b>
    </td>
    <td align="center">
      <a href="https://www.youtube.com/watch?v=TKdTWd6BXR8"><img src="https://cdn.wolffi.sh/general/Cinematic%20reveal.png" width="360" alt="Cinematic reveal" /></a>
      <br /><b>Cinematic reveal</b>
    </td>
  </tr>
</table>

---

## What It Shows

### Hero

Large animated title with a live version badge pulled from the release server. Tagline, subtitle, and a direct path to downloading the app.

### Features (3 cards)

| Feature | Description |
|---------|-------------|
| **Local & Markdown-First** | Runs offline with local models. Your data never leaves your machine. The agent's brain is plain markdown you can read, edit, and version control. |
| **Brain-Inspired Architecture** | Built like a human brain — memory, reasoning, and action work together in one agentic architecture. The agent remembers context, thinks step by step, and acts on your behalf. |
| **Extensible** | Drop a folder with a SKILL.md to teach your agent something new instantly. Add tools, workflows, or entire capabilities — no config, no setup, just plug and go. |

### Downloads

Platform-aware cards for macOS, Windows, and Linux. Detects the visitor's OS and highlights the compatible option with a green badge. Filenames and versions are fetched server-side from `https://releases.wolffi.sh`.

### 3D Ocean Scene

Full-screen GPU-accelerated background rendered with Three.js:

- Procedural ocean surface with 4-layer Simplex noise waves (256x256 vertices)
- Storm clouds, mist, rain (12,000 particles), and rain streaks (4,000 line segments)
- Dynamic lightning with unpredictable flash bursts
- Moon specular highlights, subsurface scattering, foam on wave crests
- Gentle camera sway for an immersive feel
- ACES Filmic tone mapping, exponential fog, custom GLSL shaders

### Footer

Links to docs, GitHub, Discord, and X.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16, React 19, TypeScript 5 |
| **Styling** | Tailwind CSS 4, glassmorphic UI with backdrop-blur |
| **3D** | Three.js with custom GLSL Simplex noise shaders |
| **i18n** | next-intl (English + Arabic with full RTL support) |
| **Fonts** | IBM Plex Sans Arabic (5 weights, local files) |
| **Icons** | react-icons (Font Awesome 6) |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              Root layout, metadata, i18n setup
│   ├── page.tsx                Home — server-side release fetching
│   └── globals.css             Global styles, font-face declarations
├── components/
│   ├── OceanScene.tsx          Three.js 3D ocean (full shader pipeline)
│   ├── OceanSceneClient.tsx    Dynamic import wrapper (SSR: false)
│   └── LandingOverlay.tsx      Nav, hero, features, downloads, footer
└── i18n/
    └── request.ts              next-intl locale configuration

messages/
├── en.json                     English translations
└── ar.json                     Arabic translations

public/
├── icon_transparent.png        Wolffish logo (displayed next to title)
└── fonts/                      IBM Plex Sans Arabic (.ttf)
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) to see the site.

---

## How It Works

**Server-side release fetching** — `page.tsx` fetches release metadata from the update server on every request (YAML files for each platform), extracts version and download URLs, and passes them as props. Falls back gracefully if the server is unreachable.

**Client-side OS detection** — Uses `navigator.userAgent` with `useSyncExternalStore` to safely hydrate and highlight the visitor's compatible platform.

**Three.js SSR handling** — The ocean scene is wrapped in `next/dynamic` with `ssr: false` to prevent hydration mismatch. The canvas renders only on the client.

**Locale persistence** — Language selection is stored in a cookie (1-year expiry). The page re-renders with the correct `dir` attribute and full RTL layout for Arabic.

---

## Deployment

Deployed on [Vercel](https://vercel.com). Any push to `main` triggers a production build.

---

## Links

- **Live site** — [wolffi.sh](https://wolffi.sh)
- **App repo** — [wolffish-app](https://github.com/thewolffish/wolffish-app)
- **Documentation** — [docs.wolffi.sh](https://docs.wolffi.sh/)
- **Discord** — [Join](https://discord.com/invite/F5Ue36PzQ)
- **X** — [@the_wolffish](https://x.com/the_wolffish)

---

## License

MIT License — Copyright (c) 2026 [Younes Alturkey](mailto:younes@wolffi.sh)
