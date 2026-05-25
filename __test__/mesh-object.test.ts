import { describe, expect, test } from 'bun:test'
import { CUBE_MESH, MeshObject, transformPointMat4, vec3 } from '../src/core'

describe('MeshObject', () => {
  test('keeps mesh data with object transform state', () => {
    const cube = new MeshObject(CUBE_MESH)

    expect(cube.mesh).toBe(CUBE_MESH)
    expect(cube.mesh.vertices).toHaveLength(8)
    expect(cube.mesh.faces).toHaveLength(6)
    expect(transformPointMat4(cube.localMatrix, vec3(1, 2, 3))).toEqual(vec3(1, 2, 3))
  })

  test('transforms vertices through the inherited local matrix', () => {
    const cube = new MeshObject(CUBE_MESH)
    cube.position = vec3(0, 0, 2)
    cube.rotation = vec3(Math.PI / 2, 0, 0)
    const vertex = vec3(0, 1, 0)

    expect(transformPointMat4(cube.localMatrix, vertex)).toEqual({
      x: 0,
      y: expect.closeTo(0),
      z: expect.closeTo(3)
    })
  })
})
