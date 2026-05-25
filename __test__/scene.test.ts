import { describe, expect, test } from 'bun:test'
import { CUBE_MESH, MeshObject, Scene } from '../src/core'

describe('Scene', () => {
  test('adds and removes mesh objects', () => {
    const scene = new Scene()
    const cube = new MeshObject(CUBE_MESH)

    expect(scene.objects).toEqual([])

    scene.add(cube)
    expect(scene.objects).toEqual([cube])
    expect(scene.meshObjects()).toEqual([cube])

    scene.remove(cube)
    expect(scene.objects).toEqual([])
  })
})
