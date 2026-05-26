import { describe, expect, test } from 'bun:test'
import { MeshObject, Scene } from '../src/core'
import { TEST_CUBE_MESH } from './fixtures/cube-mesh'

describe('Scene', () => {
  test('adds and removes mesh objects', () => {
    const scene = new Scene()
    const cube = new MeshObject(TEST_CUBE_MESH)

    expect(scene.objects).toEqual([])

    scene.add(cube)
    expect(scene.objects).toEqual([cube])
    expect(scene.meshObjects()).toEqual([cube])

    scene.remove(cube)
    expect(scene.objects).toEqual([])
  })
})
