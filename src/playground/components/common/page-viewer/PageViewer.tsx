'use client'

import { CodeBlock } from '@/playground/components/core/CodeBlock'
import { Markdown } from '@/playground/components/core/Markdown'
import { useTranslation } from '@/playground/i18n'
import { GlobalIcon, LinkSquare01Icon } from 'hugeicons-react'
import { useEffect, useRef, useState } from 'react'

export type PageViewerProps = {
  content: string
  title?: string | null
  url?: string | null
  format?: string | null
}

function hostnameOf(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

function isWebUrl(url: string | null | undefined): url is string {
  return typeof url === 'string' && /^https?:\/\//i.test(url)
}

/**
 * Renders a page-content tool result (browser_page_content, ext_read_page,
 * web_fetch) as a small chat card. When the result is a straightforward
 * website (we have an http(s) URL) it renders the captured page inside a
 * borderless frame; otherwise it shows the captured text/HTML in a
 * collapsible code block. The frame is lazy-mounted so a long transcript
 * doesn't build many of them at once.
 */
export function PageViewer({ content, title, url, format }: PageViewerProps): React.JSX.Element {
  const { t } = useTranslation()
  const host = hostnameOf(url)
  const heading = title?.trim() || host || t('chat.pageViewer.untitled')

  if (isWebUrl(url)) {
    return <WebsiteCard url={url} heading={heading} host={host} content={content} format={format} />
  }
  return (
    <ContentCard
      content={content}
      heading={heading}
      url={url ?? null}
      host={host}
      format={format}
    />
  )
}

function WebsiteCard({
  url,
  heading,
  host,
  content,
  format
}: {
  url: string
  heading: string
  host: string | null
  content: string
  format?: string | null
}): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (visible) return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [visible])

  // The desktop embeds the live site in an Electron <webview>. In the browser
  // that frame is at the mercy of every site's framing policy, so the card
  // renders what the tool actually captured instead: the page's own markup in
  // a sandboxed frame (opaque origin, no allow-same-origin), or its text.
  const body =
    format === 'html' ? (
      <iframe
        title={heading}
        srcDoc={content}
        sandbox="allow-scripts allow-popups allow-forms allow-modals"
        className="h-full w-full border-0 bg-white"
      />
    ) : (
      <div className="text-fg h-full overflow-auto bg-white px-4 py-3 text-sm dark:bg-white/95">
        <Markdown content={content} />
      </div>
    )

  return (
    <div
      ref={ref}
      className="border-border bg-surface flex w-full flex-col self-start overflow-hidden rounded-2xl border"
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <GlobalIcon size={14} className="text-muted shrink-0" />
        <span className="text-fg min-w-0 truncate text-xs font-medium" title={heading}>
          {heading}
        </span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          title={url}
          className="text-muted hover:text-fg ms-auto flex shrink-0 items-center gap-1 text-[10px]"
        >
          <LinkSquare01Icon size={12} className="shrink-0" />
          <span className="max-w-[200px] truncate">{host ?? url}</span>
        </a>
      </div>
      <div className="bg-white" style={{ height: 440 }}>
        {visible ? (
          body
        ) : (
          <div className="text-muted flex h-full items-center justify-center text-xs">
            {host ?? url}
          </div>
        )}
      </div>
    </div>
  )
}

function ContentCard({
  content,
  heading,
  url,
  host,
  format
}: {
  content: string
  heading: string
  url: string | null
  host: string | null
  format?: string | null
}): React.JSX.Element {
  const { t } = useTranslation()
  const language = format === 'html' ? 'html' : format === 'markdown' ? 'markdown' : 'plaintext'

  return (
    <div className="border-border bg-surface flex w-full flex-col self-start overflow-hidden rounded-2xl border">
      <div className="flex items-center gap-2 px-3 py-2">
        <GlobalIcon size={14} className="text-muted shrink-0" />
        <span className="text-fg min-w-0 truncate text-xs font-medium" title={heading}>
          {heading}
        </span>
        <span className="text-muted shrink-0 text-[10px]">
          {content.length.toLocaleString()} {t('chat.pageViewer.chars')}
        </span>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer noopener"
            title={url}
            className="text-muted hover:text-fg ms-auto flex shrink-0 items-center gap-1 text-[10px]"
          >
            <LinkSquare01Icon size={12} className="shrink-0" />
            <span className="max-w-[160px] truncate">{host ?? url}</span>
          </a>
        )}
      </div>

      <div className="px-3 pb-3">
        <CodeBlock content={content} language={language} maxH="max-h-80" />
      </div>
    </div>
  )
}
