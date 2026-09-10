import { NextResponse } from 'next/server'

/**
 * Same-origin proxy for the published sample files at
 * https://cdn.wolffi.sh/samples/ — the per-type stand-in bytes the playground
 * serves for every workspace path in its demo conversations (the same set the
 * mobile app's demo mode uses). The CDN sends no CORS headers, and the
 * spreadsheet and Word viewers need the bytes in JavaScript, so they fetch
 * through here. Only the published names pass; anything else is a 404.
 */
const CDN_BASE = 'https://cdn.wolffi.sh/samples'
const NAME_RE = /^(wolffish-sample\.[a-z0-9]+(?:\.[a-z0-9]+)?|README\.md)$/

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
): Promise<Response> {
  const { name } = await params
  if (!NAME_RE.test(name)) return new NextResponse('Not found', { status: 404 })
  const upstream = await fetch(`${CDN_BASE}/${name}`, {
    next: { revalidate: 86_400 }
  })
  if (!upstream.ok || !upstream.body) {
    return new NextResponse('Not found', { status: upstream.status === 404 ? 404 : 502 })
  }
  const headers = new Headers()
  headers.set('content-type', upstream.headers.get('content-type') ?? 'application/octet-stream')
  const length = upstream.headers.get('content-length')
  if (length) headers.set('content-length', length)
  headers.set('cache-control', 'public, max-age=86400, immutable')
  headers.set('content-disposition', `inline; filename="${name}"`)
  return new NextResponse(upstream.body, { status: 200, headers })
}
