'use client'

/**
 * CodeMirror is ~half a megabyte the first paint never needs — it loads the
 * first time an editor is actually shown. Same props and exports as the
 * implementation, so call sites are unchanged.
 */
import dynamic from 'next/dynamic'

export type { CodeEditorBackground, CodeEditorProps, CodeLanguage } from './CodeEditorImpl'

export const CodeEditor = dynamic(() => import('./CodeEditorImpl').then((m) => m.CodeEditor), {
  ssr: false,
  loading: () => <div className="bg-surface h-full w-full" aria-hidden />
})
