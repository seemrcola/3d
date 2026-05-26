import type { Mesh } from '../types'
import { vec3 } from '../math'

export interface ParseObjMeshOptions {
  color?: string
}

function parseFaceIndex(token: string, vertexCount: number): number {
  const rawIndex = Number.parseInt(token.split('/')[0] ?? '', 10)
  if (!Number.isInteger(rawIndex) || rawIndex === 0) {
    throw new Error(`Invalid OBJ face index: ${token}`)
  }

  const index = rawIndex > 0 ? rawIndex - 1 : vertexCount + rawIndex
  if (index < 0 || index >= vertexCount) {
    throw new Error(`OBJ face index out of range: ${token}`)
  }

  return index
}

export function parseObjMesh(source: string, options: ParseObjMeshOptions = {}): Mesh {
  const color = options.color ?? '#CCCCCC'
  const vertices: Mesh['vertices'] = []
  const faces: Mesh['faces'] = []

  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const [kind, ...parts] = trimmed.split(/\s+/)

    if (kind === 'v') {
      if (parts.length < 3) {
        throw new Error(`Invalid OBJ vertex line: ${line}`)
      }

      const x = Number(parts[0])
      const y = Number(parts[1])
      const z = Number(parts[2])
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        throw new Error(`Invalid OBJ vertex line: ${line}`)
      }

      vertices.push(vec3(x, y, z))
      continue
    }

    if (kind === 'f') {
      if (parts.length < 3) {
        throw new Error(`Invalid OBJ face line: ${line}`)
      }

      faces.push({
        vertices: parts.map(part => parseFaceIndex(part, vertices.length)),
        color
      })
    }
  }

  return { vertices, faces }
}
