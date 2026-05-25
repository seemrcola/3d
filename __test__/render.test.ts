import { describe, expect, test } from 'bun:test'
import { CUBE_MESH, MeshObject, PerspectiveCamera, Scene, vec3 } from '../src/core'
import { Canvas3DRenderer } from '../src/render'

function createFakeContext() {
  const calls: string[] = []
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    beginPath: () => calls.push('beginPath'),
    closePath: () => calls.push('closePath'),
    fill: () => calls.push('fill'),
    fillRect: () => calls.push('fillRect'),
    lineTo: () => calls.push('lineTo'),
    moveTo: () => calls.push('moveTo'),
    stroke: () => calls.push('stroke')
  }

  return { calls, ctx: ctx as unknown as CanvasRenderingContext2D }
}

describe('Canvas3DRenderer', () => {
  test('clears the viewport and draws scene face commands', () => {
    const { calls, ctx } = createFakeContext()
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

    const renderer = new Canvas3DRenderer(ctx, {
      backgroundColor: '#101010',
      outlineColor: '#50FF50',
      outlineWidth: 2,
      viewport: { width: 800, height: 800 }
    })

    renderer.render(scene, camera)

    expect(calls[0]).toBe('fillRect')
    expect(calls.filter(call => call === 'fill')).toHaveLength(6)
    expect(calls.filter(call => call === 'stroke')).toHaveLength(24)
  })
})
