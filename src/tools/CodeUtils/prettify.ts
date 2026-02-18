export function prettifyJSON(input: string): { result: string; error?: string } {
  try {
    const parsed = JSON.parse(input)
    return { result: JSON.stringify(parsed, null, 2) }
  } catch (e) {
    return { result: '', error: String(e) }
  }
}

export function minifyJSON(input: string): { result: string; error?: string } {
  try {
    const parsed = JSON.parse(input)
    return { result: JSON.stringify(parsed) }
  } catch (e) {
    return { result: '', error: String(e) }
  }
}

export function prettifyXML(input: string): { result: string; error?: string } {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(input.trim(), 'application/xml')
    const errorNode = doc.querySelector('parsererror')
    if (errorNode) {
      return { result: '', error: errorNode.textContent ?? 'XML parse error' }
    }
    return { result: formatXML(doc) }
  } catch (e) {
    return { result: '', error: String(e) }
  }
}

function formatXML(doc: Document): string {
  const serializer = new XMLSerializer()
  let xml = serializer.serializeToString(doc)
  // Basic indent
  let indent = 0
  return xml
    .replace(/>\s*</g, '><')
    .split(/(?<=>)(?=<)|(?<=[^>])(?=<)/)
    .map((node) => {
      if (node.match(/^<\/\w/)) indent -= 2
      const line = ' '.repeat(Math.max(0, indent)) + node
      if (node.match(/^<\w[^/]*[^/]>$/) && !node.match(/<.*\/>/)) indent += 2
      return line
    })
    .join('\n')
}

export function prettifyHTML(input: string): { result: string; error?: string } {
  try {
    let indent = 0
    const result = input
      .replace(/>\s+</g, '><')
      .replace(/(<[^/][^>]*>)(<\/)/g, '$1\n$2')
      .split(/(?<=>)(?=<)/)
      .map((node) => {
        const isClose = node.match(/^<\//)
        const isSelfClose = node.match(/\/>$/)
        if (isClose) indent -= 2
        const line = ' '.repeat(Math.max(0, indent)) + node
        if (!isClose && !isSelfClose && node.match(/^</)) indent += 2
        return line
      })
      .join('\n')
    return { result }
  } catch (e) {
    return { result: '', error: String(e) }
  }
}

export function minifyHTML(input: string): { result: string } {
  return { result: input.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim() }
}
