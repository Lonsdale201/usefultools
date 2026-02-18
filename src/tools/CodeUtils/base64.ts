export function encodeBase64(input: string): { result: string; error?: string } {
  try {
    const bytes = new TextEncoder().encode(input)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return { result: btoa(binary) }
  } catch (e) {
    return { result: '', error: String(e) }
  }
}

export function decodeBase64(input: string): { result: string; error?: string } {
  try {
    const binary = atob(input.trim())
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return { result: new TextDecoder().decode(bytes) }
  } catch (e) {
    return { result: '', error: 'Érvénytelen Base64 bemenet: ' + String(e) }
  }
}
