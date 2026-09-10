'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Compartment, EditorState } from '@codemirror/state'
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  placeholder as cmPlaceholder
} from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import {
  bracketMatching,
  defaultHighlightStyle,
  HighlightStyle,
  indentOnInput,
  syntaxHighlighting
} from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { markdown } from '@codemirror/lang-markdown'
import { javascript } from '@codemirror/lang-javascript'
import { json, jsonParseLinter } from '@codemirror/lang-json'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { lintGutter, linter } from '@codemirror/lint'

export type CodeLanguage =
  | 'markdown'
  | 'json'
  | 'javascript'
  | 'typescript'
  | 'css'
  | 'html'
  | 'xml'
  | 'yaml'
  | 'shell'
  | 'python'
  | 'sql'
  | 'graphql'

export type CodeEditorBackground = 'surface' | 'field'

export type CodeEditorProps = {
  value: string
  language: CodeLanguage
  isDark: boolean
  readOnly?: boolean
  onChange?: (value: string) => void
  className?: string
  placeholder?: string
  spellcheck?: boolean
  background?: CodeEditorBackground
}

const themeFor = (background: CodeEditorBackground): ReturnType<typeof EditorView.theme> =>
  EditorView.theme({
    '&': {
      height: '100%',
      fontSize: '13px',
      backgroundColor: background === 'field' ? 'var(--color-bg)' : 'var(--color-surface)',
      color: 'var(--color-fg)'
    },
    '.cm-scroller': {
      fontFamily:
        "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
      lineHeight: '1.55'
    },
    '.cm-content': {
      caretColor: 'var(--color-fg)',
      padding: '12px 0'
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      color: 'var(--color-muted)',
      border: 'none'
    },
    '.cm-activeLine': {
      backgroundColor: 'transparent'
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'transparent',
      color: 'var(--color-fg)'
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: 'var(--color-fg)'
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'color-mix(in srgb, var(--color-accent) 25%, transparent)'
    },
    '.cm-lineNumbers .cm-gutterElement': {
      padding: '0 12px 0 8px',
      minWidth: '2ch'
    },
    '&.cm-focused': {
      outline: 'none'
    },
    '.cm-placeholder': {
      color: 'var(--color-muted)',
      fontStyle: 'italic'
    }
  })

const baseThemes: Record<CodeEditorBackground, ReturnType<typeof EditorView.theme>> = {
  surface: themeFor('surface'),
  field: themeFor('field')
}

const lightHighlight = HighlightStyle.define([
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: 'var(--hljs-comment)' },
  {
    tag: [t.keyword, t.modifier, t.controlKeyword, t.operatorKeyword],
    color: 'var(--hljs-keyword)'
  },
  { tag: [t.string, t.special(t.string)], color: 'var(--hljs-string)' },
  { tag: [t.number, t.bool, t.null], color: 'var(--hljs-number)' },
  { tag: [t.heading, t.strong], color: 'var(--hljs-section)', fontWeight: '600' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: [t.typeName, t.className, t.namespace], color: 'var(--hljs-entity)' },
  { tag: [t.propertyName, t.attributeName, t.variableName], color: 'var(--hljs-attr)' },
  { tag: [t.regexp, t.link], color: 'var(--hljs-string)' },
  { tag: [t.meta, t.documentMeta], color: 'var(--hljs-attr)' }
])

function languageExtension(language: CodeLanguage): readonly unknown[] {
  switch (language) {
    case 'json':
      return [json(), linter(jsonParseLinter()), lintGutter()]
    case 'javascript':
      return [javascript({ jsx: true })]
    case 'typescript':
      return [javascript({ jsx: true, typescript: true })]
    case 'css':
      return [css()]
    case 'html':
    case 'xml':
      return [html()]
    default:
      return [markdown()]
  }
}

export function CodeEditor({
  value,
  language,
  isDark,
  readOnly = false,
  onChange,
  className,
  placeholder,
  spellcheck = false,
  background = 'surface'
}: CodeEditorProps): React.JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const compartments = useMemo(
    () => ({
      language: new Compartment(),
      readOnly: new Compartment(),
      theme: new Compartment(),
      spellcheck: new Compartment()
    }),
    []
  )

  useEffect(() => {
    if (!hostRef.current) return

    const state = EditorState.create({
      doc: value,
      extensions: [
        EditorView.lineWrapping,
        lineNumbers(),
        history(),
        indentOnInput(),
        bracketMatching(),
        highlightActiveLine(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        compartments.theme.of(syntaxHighlighting(lightHighlight)),
        compartments.language.of(languageExtension(language) as never),
        compartments.readOnly.of([
          EditorState.readOnly.of(readOnly),
          EditorView.editable.of(!readOnly)
        ]),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        compartments.spellcheck.of(
          spellcheck ? EditorView.contentAttributes.of({ spellcheck: 'true' }) : []
        ),
        baseThemes[background],
        ...(placeholder ? [cmPlaceholder(placeholder)] : []),
        EditorView.theme({}, { dark: isDark }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current?.(update.state.doc.toString())
          }
        })
      ]
    })

    const view = new EditorView({ state, parent: hostRef.current })
    viewRef.current = view
    return () => {
      view.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compartments])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current === value) return
    view.dispatch({ changes: { from: 0, to: current.length, insert: value } })
  }, [value])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dispatch({
      effects: compartments.language.reconfigure(languageExtension(language) as never)
    })
  }, [language, compartments])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dispatch({
      effects: compartments.readOnly.reconfigure([
        EditorState.readOnly.of(readOnly),
        EditorView.editable.of(!readOnly)
      ])
    })
  }, [readOnly, compartments])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dispatch({
      effects: compartments.spellcheck.reconfigure(
        spellcheck ? EditorView.contentAttributes.of({ spellcheck: 'true' }) : []
      )
    })
  }, [spellcheck, compartments])

  return <div ref={hostRef} className={className} />
}
