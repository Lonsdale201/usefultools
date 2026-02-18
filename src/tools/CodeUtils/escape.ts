export function escapeHTML(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function unescapeHTML(input: string): string {
  const txt = document.createElement('textarea')
  txt.innerHTML = input
  return txt.value
}

export function encodeURL(input: string): string {
  return encodeURIComponent(input)
}

export function decodeURL(input: string): string {
  try {
    return decodeURIComponent(input)
  } catch {
    return input
  }
}

export function encodeURLFull(input: string): string {
  return encodeURI(input)
}

export function decodeURLFull(input: string): string {
  try {
    return decodeURI(input)
  } catch {
    return input
  }
}
