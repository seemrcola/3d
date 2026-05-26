import { describe, expect, test } from 'bun:test'
import {
  createRenderCommands,
  type Mesh,
  MeshObject,
  PerspectiveCamera,
  Scene,
  vec3
} from '../src/core'

describe('triangle mesh faces', () => {
  test('renders a mesh with a triangle face', () => {
    const mesh: Mesh = {
      vertices: [
        vec3(0, 0.25, 0),
        vec3(-0.25, -0.25, 0),
        vec3(0.25, -0.25, 0)
      ],
      faces: [{ vertices: [0, 1, 2], color: '#CCCCCC' }]
    }
    const scene = new Scene()
    const triangle = new MeshObject(mesh)
    const camera = new PerspectiveCamera({
      fov: Math.PI / 2,
      aspect: 1,
      near: 0.1,
      far: 100
    })

    triangle.position = vec3(0, 0, 2)
    scene.add(triangle)

    const commands = createRenderCommands(scene, camera, { width: 800, height: 800 })

    expect(commands).toHaveLength(1)
    expect(commands[0]!.points).toHaveLength(3)
  })
})
