import { describe, expect, test } from 'bun:test'
import { MeshObject, PerspectiveCamera, Scene, vec3 } from '../src/core'
import { Canvas3DRenderer } from '../src/render'
import { TEST_CUBE_MESH } from './fixtures/cube-mesh'

function createFakeContext() {
  const calls: string[] = []
  const fillAlphas: number[] = []
  const strokeAlphas: number[] = []
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    globalAlpha: 1,
    beginPath: () => calls.push('beginPath'),
    closePath: () => calls.push('closePath'),
    fill: () => {
      calls.push('fill')
      fillAlphas.push(ctx.globalAlpha)
    },
    fillRect: () => calls.push('fillRect'),
    lineTo: () => calls.push('lineTo'),
    moveTo: () => calls.push('moveTo'),
    stroke: () => {
      calls.push('stroke')
      strokeAlphas.push(ctx.globalAlpha)
    }
  }

  return { calls, fillAlphas, strokeAlphas, ctx: ctx as unknown as CanvasRenderingContext2D }
}

describe('Canvas3DRenderer', () => {
  test('clears the viewport and draws scene face commands', () => {
    const { calls, fillAlphas, strokeAlphas, ctx } = createFakeContext()
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

    const renderer = new Canvas3DRenderer(ctx, {
      backgroundColor: '#101010',
      fillAlpha: 0.45,
      outlineColor: '#50FF50',
      outlineWidth: 2,
      viewport: { width: 800, height: 800 }
    })

    renderer.render(scene, camera)

    expect(calls[0]).toBe('fillRect')
    expect(calls.filter(call => call === 'fill')).toHaveLength(1)
    expect(calls.filter(call => call === 'stroke')).toHaveLength(4)
    expect(fillAlphas.every(alpha => alpha === 0.45)).toBe(true)
    expect(strokeAlphas.every(alpha => alpha === 1)).toBe(true)
  })
})
