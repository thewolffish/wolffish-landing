/**
 * The replica renders the macOS build: the desktop runs with
 * titleBarStyle 'hiddenInset', so every page clears the traffic lights with
 * `pt-8` and the floating discs ride at `top-12`. The playground draws its own
 * traffic lights in the frame, so these offsets are the thing that makes the
 * chrome line up exactly.
 */
export const isMac = true

/** Top padding for a page's root `<main>`, accounting for the macOS titlebar. */
export const pageTopPadding = 'pt-8'
