import { describe, expect, test } from 'bun:test'
import { PerspectiveCamera, vec3 } from '../src/core'

describe('PerspectiveCamera', () => {
  test('projects a world point into viewport pixels', () => {
    const camera = new PerspectiveCamera({
      fov: Math.PI / 2,
      aspect: 1,
      near: 0.1,
      far: 100
    })

    expect(camera.projectPoint(vec3(0, 0, 2), { width: 800, height: 800 })).toEqual({
      x: 400,
      y: 400
    })
    expect(camera.projectPoint(vec3(1, 1, 2), { width: 800, height: 800 })).toEqual({
      x: 600,
      y: 200
    })
  })

  test('projects relative to camera position and clips near/far points', () => {
    const camera = new PerspectiveCamera({
      fov: Math.PI / 2,
      aspect: 1,
      near: 1,
      far: 10
    })
    camera.position = vec3(0, 0, 2)

    expect(camera.projectPoint(vec3(0, 0, 4), { width: 800, height: 800 })).toEqual({
      x: 400,
      y: 400
    })
    expect(camera.projectPoint(vec3(0, 0, 2.5), { width: 800, height: 800 })).toBeNull()
    expect(camera.projectPoint(vec3(0, 0, 20), { width: 800, height: 800 })).toBeNull()
  })
})
