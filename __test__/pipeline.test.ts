import { describe, expect, test } from 'bun:test'
import {
  CUBE_MESH,
  createRenderCommands,
  MeshObject,
  PerspectiveCamera,
  Scene,
  vec3
} from '../src/core'

describe('createRenderCommands', () => {
  test('turns scene mesh faces into sorted face commands', () => {
    const scene = new Scene()
    const cube = new MeshObject(CUBE_MESH)
    const camera = new PerspectiveCamera({
      fov: Math.PI / 2,
      aspect: 1,
      near: 0.1,
      far: 100
    })
    cube.position = vec3(0, 0, 2)
    scene.add(cube)

    const commands = createRenderCommands(scene, camera, { width: 800, height: 800 })

    expect(commands).toHaveLength(6)
    expect(commands.every(command => command.type === 'face')).toBe(true)
    expect(commands.map(command => command.depth)).toEqual([...commands.map(command => command.depth)].sort((a, b) => b - a))
    expect(commands[0]!.points).toHaveLength(4)
    expect(commands[0]!.points[0]!.x).toBeGreaterThan(0)
    expect(commands[0]!.points[0]!.y).toBeGreaterThan(0)
  })

  test('skips faces whose vertices are clipped by the camera', () => {
    const scene = new Scene()
    const cube = new MeshObject(CUBE_MESH)
    const camera = new PerspectiveCamera({
      fov: Math.PI / 2,
      aspect: 1,
      near: 1,
      far: 100
    })
    cube.position = vec3(0, 0, 0.5)
    scene.add(cube)

    expect(createRenderCommands(scene, camera, { width: 800, height: 800 })).toEqual([])
  })
})
