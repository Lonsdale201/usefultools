type JsonRecord = Record<string, unknown>

export interface DirectDependency {
  name: string
  range: string
  section: 'dependencies' | 'devDependencies' | 'optionalDependencies' | 'peerDependencies'
}

export interface DependencyNode {
  name: string
  versions: string[]
  dependencies: string[]
  dependents: string[]
}

export interface DependencyGraph {
  nodes: Record<string, DependencyNode>
  nodeNames: string[]
  directDependencies: DirectDependency[]
  edgeCount: number
}

interface MutableNode {
  name: string
  versions: Set<string>
  dependencies: Set<string>
  dependents: Set<string>
}

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : null
}

function readJson(input: string): { value?: JsonRecord; error?: string } {
  try {
    const parsed = JSON.parse(input)
    const record = asRecord(parsed)
    if (!record) return { error: 'Input must be a JSON object.' }
    return { value: record }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

function getNode(map: Map<string, MutableNode>, name: string): MutableNode {
  const existing = map.get(name)
  if (existing) return existing
  const created: MutableNode = {
    name,
    versions: new Set<string>(),
    dependencies: new Set<string>(),
    dependents: new Set<string>(),
  }
  map.set(name, created)
  return created
}

function extractNameFromPackagePath(inputPath: string): string {
  const normalized = inputPath.replace(/\\/g, '/')
  if (!normalized) return ''
  if (normalized === '') return ''
  const marker = '/node_modules/'
  const markerIndex = normalized.lastIndexOf(marker)
  let tail = markerIndex >= 0
    ? normalized.slice(markerIndex + marker.length)
    : normalized.startsWith('node_modules/')
      ? normalized.slice('node_modules/'.length)
      : normalized

  if (!tail) return ''
  const parts = tail.split('/').filter(Boolean)
  if (parts.length === 0) return ''
  if (parts[0].startsWith('@') && parts.length >= 2) return `${parts[0]}/${parts[1]}`
  return parts[0]
}

function addEdge(map: Map<string, MutableNode>, fromName: string, toName: string) {
  if (!fromName || !toName) return
  const fromNode = getNode(map, fromName)
  getNode(map, toName)
  fromNode.dependencies.add(toName)
}

function parseRootDependencies(pkgJson: JsonRecord): DirectDependency[] {
  const sections: DirectDependency['section'][] = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']
  const direct: DirectDependency[] = []
  sections.forEach((section) => {
    const table = asRecord(pkgJson[section])
    if (!table) return
    Object.entries(table).forEach(([name, range]) => {
      direct.push({
        name,
        range: typeof range === 'string' ? range : '',
        section,
      })
    })
  })
  return direct
}

function parseLockfilePackagesObject(lockJson: JsonRecord, map: Map<string, MutableNode>) {
  const packages = asRecord(lockJson.packages)
  if (!packages) return
  Object.entries(packages).forEach(([pathKey, pkgValue]) => {
    const pkg = asRecord(pkgValue)
    if (!pkg) return
    if (pathKey === '') return
    const explicitName = typeof pkg.name === 'string' ? pkg.name : ''
    const name = explicitName || extractNameFromPackagePath(pathKey)
    if (!name) return
    const node = getNode(map, name)
    if (typeof pkg.version === 'string') node.versions.add(pkg.version)
    const deps = asRecord(pkg.dependencies)
    if (!deps) return
    Object.keys(deps).forEach((depName) => addEdge(map, name, depName))
  })
}

function walkLegacyDependencyTree(name: string, value: JsonRecord, map: Map<string, MutableNode>) {
  const node = getNode(map, name)
  if (typeof value.version === 'string') node.versions.add(value.version)

  const requires = asRecord(value.requires)
  if (requires) {
    Object.keys(requires).forEach((depName) => addEdge(map, name, depName))
  }

  const nested = asRecord(value.dependencies)
  if (!nested) return
  Object.entries(nested).forEach(([depName, depValue]) => {
    addEdge(map, name, depName)
    const depRecord = asRecord(depValue)
    if (depRecord) walkLegacyDependencyTree(depName, depRecord, map)
  })
}

function parseLegacyLockfile(lockJson: JsonRecord, map: Map<string, MutableNode>) {
  const dependencies = asRecord(lockJson.dependencies)
  if (!dependencies) return
  Object.entries(dependencies).forEach(([name, depValue]) => {
    const depRecord = asRecord(depValue)
    if (depRecord) walkLegacyDependencyTree(name, depRecord, map)
  })
}

function finalizeGraph(map: Map<string, MutableNode>, directDependencies: DirectDependency[]): DependencyGraph {
  directDependencies.forEach((direct) => {
    getNode(map, direct.name)
  })

  map.forEach((node) => {
    node.dependencies.forEach((depName) => {
      const depNode = getNode(map, depName)
      depNode.dependents.add(node.name)
    })
  })

  const nodeNames = Array.from(map.keys()).sort((a, b) => a.localeCompare(b))
  const nodes: Record<string, DependencyNode> = {}
  let edgeCount = 0

  nodeNames.forEach((name) => {
    const node = map.get(name)
    if (!node) return
    const deps = Array.from(node.dependencies).sort((a, b) => a.localeCompare(b))
    const dependents = Array.from(node.dependents).sort((a, b) => a.localeCompare(b))
    edgeCount += deps.length
    nodes[name] = {
      name,
      versions: Array.from(node.versions).sort((a, b) => a.localeCompare(b)),
      dependencies: deps,
      dependents,
    }
  })

  return { nodes, nodeNames, directDependencies, edgeCount }
}

export function analyzeDependencyGraph(
  packageJsonInput: string,
  lockfileInput: string
): { graph?: DependencyGraph; error?: string } {
  const parsedPackage = readJson(packageJsonInput)
  if (!parsedPackage.value) return { error: `Invalid package.json: ${parsedPackage.error ?? 'parse error'}` }

  const parsedLock = readJson(lockfileInput)
  if (!parsedLock.value) return { error: `Invalid lockfile: ${parsedLock.error ?? 'parse error'}` }

  const directDependencies = parseRootDependencies(parsedPackage.value)
  const map = new Map<string, MutableNode>()
  const lockfileVersion = typeof parsedLock.value.lockfileVersion === 'number' ? parsedLock.value.lockfileVersion : 0
  const hasPackagesObject = asRecord(parsedLock.value.packages) !== null

  if (hasPackagesObject || lockfileVersion >= 2) parseLockfilePackagesObject(parsedLock.value, map)
  else parseLegacyLockfile(parsedLock.value, map)

  if (map.size === 0 && directDependencies.length === 0) {
    return { error: 'No dependency data found in package.json / lockfile.' }
  }

  return { graph: finalizeGraph(map, directDependencies) }
}

function reachableFromRoots(graph: DependencyGraph, roots: string[]): Set<string> {
  const reachable = new Set<string>()
  const stack = [...roots]

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current || reachable.has(current)) continue
    reachable.add(current)
    const node = graph.nodes[current]
    if (!node) continue
    node.dependencies.forEach((dep) => {
      if (!reachable.has(dep)) stack.push(dep)
    })
  }

  return reachable
}

export interface RemovalImpact {
  removed: string[]
  retained: string[]
}

export function previewRemovalImpact(graph: DependencyGraph, removeName: string): RemovalImpact {
  const roots = graph.directDependencies.map((dep) => dep.name)
  const baseline = reachableFromRoots(graph, roots)
  const remainingRoots = roots.filter((name) => name !== removeName)
  const remainingReachable = reachableFromRoots(graph, remainingRoots)

  const removed = Array.from(baseline)
    .filter((name) => !remainingReachable.has(name))
    .sort((a, b) => a.localeCompare(b))
  const retained = Array.from(remainingReachable).sort((a, b) => a.localeCompare(b))
  return { removed, retained }
}
