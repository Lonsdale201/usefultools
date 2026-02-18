import yaml from 'js-yaml'

export function jsonToYAML(input: string): { result: string; error?: string } {
  try {
    const parsed = JSON.parse(input)
    return { result: yaml.dump(parsed, { indent: 2, lineWidth: 120 }) }
  } catch (e) {
    return { result: '', error: String(e) }
  }
}

export function yamlToJSON(input: string): { result: string; error?: string } {
  try {
    const parsed = yaml.load(input)
    return { result: JSON.stringify(parsed, null, 2) }
  } catch (e) {
    return { result: '', error: String(e) }
  }
}
