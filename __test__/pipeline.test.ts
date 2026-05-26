import { describe, expect, test } from 'bun:test'
import {
  createRenderCommands,
  type Mesh,
  MeshObject,
  PerspectiveCamera,
  Scene,
  vec3
} from '../src/core'
import { TEST_CUBE_MESH } from './fixtures/cube-mesh'

describe('createRenderCommands', () => {
  test('turns visible scene mesh faces into sorted face commands', () => {
    const scene = new Scene()
    const cube = new MeshObject(TEST_CUBE_MESH)
    const camera = new PerspectiveCamera({
      fov: Math.PI / 2,
      aspect: 1,
      near: 0.1,
      far: 100
    })
    cube.position = vec3(0, 0, 2)
    scene.add(cube)

    const commands = createRenderCommands(scene, camera, { width: 800, height: 800 })

    expect(commands).toHaveLength(1)
    expect(commands.every(command => command.type === 'face')).toBe(true)
    expect(commands.map(command => command.depth)).toEqual([...commands.map(command => command.depth)].sort((a, b) => b - a))
    expect(commands[0]!.points).toHaveLength(4)
    expect(commands[0]!.points[0]!.x).toBeGreaterThan(0)
    expect(commands[0]!.points[0]!.y).toBeGreaterThan(0)
  })

  test('skips faces whose vertices are clipped by the camera', () => {
    const scene = new Scene()
    const cube = new MeshObject(TEST_CUBE_MESH)
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

  test('clips faces that cross the near plane instead of dropping them', () => {
    const scene = new Scene()
    const mesh: Mesh = {
      vertices: [
        vec3(-0.5, -0.5, 0.05),
        vec3(0.5, -0.5, 0.2),
        vec3(0, 0.5, 0.2)
      ],
      faces: [{ vertices: [0, 2, 1], color: '#near' }]
    }
    const triangle = new MeshObject(mesh)
    const camera = new PerspectiveCamera({
      fov: Math.PI / 2,
      aspect: 1,
      near: 0.1,
      far: 10
    })
    scene.add(triangle)

    const commands = createRenderCommands(scene, camera, { width: 800, height: 800 })

    expect(commands).toHaveLength(1)
    expect(commands[0]!.color).toBe('#near')
    expect(commands[0]!.points).toHaveLength(4)
  })

  test('clips faces that cross the far plane instead of dropping them', () => {
    const scene = new Scene()
    const mesh: Mesh = {
      vertices: [
        vec3(-0.5, -0.5, 9),
        vec3(0.5, -0.5, 11),
        vec3(0, 0.5, 9)
      ],
      faces: [{ vertices: [0, 2, 1], color: '#far' }]
    }
    const triangle = new MeshObject(mesh)
    const camera = new PerspectiveCamera({
      fov: Math.PI / 2,
      aspect: 1,
      near: 0.1,
      far: 10
    })
    scene.add(triangle)

    const commands = createRenderCommands(scene, camera, { width: 800, height: 800 })

    expect(commands).toHaveLength(1)
    expect(commands[0]!.color).toBe('#far')
    expect(commands[0]!.points).toHaveLength(4)
  })

  test('culls faces that point away from the camera', () => {
    const scene = new Scene()
    const mesh: Mesh = {
      vertices: [
        vec3(-0.5, 0.5, 0),
        vec3(0.5, 0.5, 0),
        vec3(0.5, -0.5, 0),
        vec3(-0.5, -0.5, 0)
      ],
      faces: [
        { vertices: [0, 1, 2, 3], color: '#front' },
        { vertices: [0, 3, 2, 1], color: '#back' }
      ]
    }
    const object = new MeshObject(mesh)
    const camera = new PerspectiveCamera({
      fov: Math.PI / 2,
      aspect: 1,
      near: 0.1,
      far: 100
    })
    object.position = vec3(0, 0, 2)
    scene.add(object)

    const commands = createRenderCommands(scene, camera, { width: 800, height: 800 })

    expect(commands).toHaveLength(1)
    expect(commands[0]!.color).toBe('#front')
  })
})
