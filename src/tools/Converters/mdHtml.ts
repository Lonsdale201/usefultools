import { marked } from 'marked'
import TurndownService from 'turndown'

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
})

function htmlToPlainText(html: string): string {
  if (typeof DOMParser === 'undefined') {
    return html.replace(/<[^>]+>/g, '').trim()
  }
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return (doc.body.textContent ?? '').trim()
}

export function markdownToHtml(input: string): { result: string; error?: string } {
  try {
    const result = marked.parse(input, { async: false, gfm: true, breaks: false }) as string
    return { result }
  } catch (error) {
    return { result: '', error: `Markdown parse error: ${String(error)}` }
  }
}

export function markdownToPlain(input: string): { result: string; error?: string } {
  const parsed = markdownToHtml(input)
  if (parsed.error) return parsed
  return { result: htmlToPlainText(parsed.result) }
}

export function htmlToMarkdown(input: string): { result: string; error?: string } {
  try {
    return { result: turndown.turndown(input) }
  } catch (error) {
    return { result: '', error: `HTML parse error: ${String(error)}` }
  }
}

