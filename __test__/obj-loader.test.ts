import { describe, expect, test } from 'bun:test'
import { parseObjMesh } from '../src/core'
import demoObjSource from '../models/cube.obj' with { type: 'text' }
import teapotObjSource from '../models/teapot.obj' with { type: 'text' }

describe('parseObjMesh', () => {
  test('parses OBJ vertices and faces into a mesh', () => {
    const mesh = parseObjMesh(`
      # triangle and quad
      v 0 0 1
      v 1 0 1
      v 0 1 1
      v 1 1 1

      f 1 2 3
      f 2 4 3
    `)

    expect(mesh.vertices).toEqual([
      { x: 0, y: 0, z: 1 },
      { x: 1, y: 0, z: 1 },
      { x: 0, y: 1, z: 1 },
      { x: 1, y: 1, z: 1 }
    ])
    expect(mesh.faces).toEqual([
      { vertices: [0, 1, 2], color: '#CCCCCC' },
      { vertices: [1, 3, 2], color: '#CCCCCC' }
    ])
  })

  test('parses face entries that include texture and normal indices', () => {
    const mesh = parseObjMesh(`
      v 0 0 1
      v 1 0 1
      v 0 1 1
      vt 0 0
      vn 0 0 1
      f 1/1/1 2/1/1 3/1/1
    `, { color: '#FF00AA' })

    expect(mesh.faces).toEqual([
      { vertices: [0, 1, 2], color: '#FF00AA' }
    ])
  })

  test('demo OBJ file describes a cube', () => {
    const mesh = parseObjMesh(demoObjSource)

    expect(mesh.vertices).toHaveLength(8)
    expect(mesh.faces).toHaveLength(6)
    expect(mesh.faces.every(face => face.vertices.length === 4)).toBe(true)
  })

  test('parses a larger OBJ model', () => {
    const mesh = parseObjMesh(teapotObjSource)

    expect(mesh.vertices).toHaveLength(1202)
    expect(mesh.faces).toHaveLength(2256)
    expect(mesh.faces.every(face => face.vertices.length === 3)).toBe(true)
  })
})
