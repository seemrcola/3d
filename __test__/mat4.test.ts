import { describe, expect, test } from 'bun:test'
import {
  identityMat4,
  multiplyMat4,
  perspectiveMat4,
  rotationXMat4,
  rotationYMat4,
  rotationZMat4,
  scaleMat4,
  transformPointMat4,
  translationMat4
} from '../src/core/math/mat4'
import { vec3 } from '../src/core/math/vec3'

describe('mat4', () => {
  test('keeps points unchanged with the identity matrix', () => {
    expect(transformPointMat4(identityMat4(), vec3(1, 2, 3))).toEqual(vec3(1, 2, 3))
  })

  test('translates, scales, and rotates points', () => {
    expect(transformPointMat4(translationMat4(3, 4, 5), vec3(1, 2, 3))).toEqual(vec3(4, 6, 8))
    expect(transformPointMat4(scaleMat4(2, 3, 4), vec3(1, 2, 3))).toEqual(vec3(2, 6, 12))

    expect(transformPointMat4(rotationXMat4(Math.PI / 2), vec3(0, 1, 0))).toEqual({
      x: 0,
      y: expect.closeTo(0),
      z: expect.closeTo(1)
    })
    // 标准右手系：绕 Y 轴 90°，(1,0,0) → (0,0,-1)
    expect(transformPointMat4(rotationYMat4(Math.PI / 2), vec3(1, 0, 0))).toEqual({
      x: expect.closeTo(0),
      y: 0,
      z: expect.closeTo(-1)
    })
    expect(transformPointMat4(rotationZMat4(Math.PI / 2), vec3(1, 0, 0))).toEqual({
      x: expect.closeTo(0),
      y: expect.closeTo(1),
      z: 0
    })
  })

  test('multiplies matrices in transform order', () => {
    const transform = multiplyMat4(translationMat4(10, 0, 0), scaleMat4(2, 2, 2))

    expect(transformPointMat4(transform, vec3(1, 1, 1))).toEqual(vec3(12, 2, 2))
  })

  test('applies translation, then X then Y rotation in correct order', () => {
    // T(0,0,2) * Rx(45°) * Ry(45°) 作用在 (0.25, -0.1, 0.5) 上
    // 等价于：先绕 Y 旋转，再绕 X 旋转，最后平移 z
    const point = vec3(0.25, -0.1, 0.5)
    const angle = Math.PI / 4
    const c = Math.cos(angle)
    const s = Math.sin(angle)

    // 手工计算: Ry(45°) 作用于 (x, y, z)
    // 标准右手系 Ry: x' = x*c + z*s, z' = -x*s + z*c
    const afterRy = vec3(
      point.x * c + point.z * s,
      point.y,
      -point.x * s + point.z * c
    )
    // Rx(45°) 作用于上一步结果
    const afterRx = vec3(
      afterRy.x,
      afterRy.y * c - afterRy.z * s,
      afterRy.y * s + afterRy.z * c
    )
    // 平移 +2 在 z 轴
    const expected = vec3(afterRx.x, afterRx.y, afterRx.z + 2)

    const modelMatrix = multiplyMat4(
      translationMat4(0, 0, 2),
      multiplyMat4(rotationXMat4(angle), rotationYMat4(angle))
    )
    const actual = transformPointMat4(modelMatrix, point)

    expect(actual).toEqual({
      x: expect.closeTo(expected.x),
      y: expect.closeTo(expected.y),
      z: expect.closeTo(expected.z)
    })
  })

  test('creates a perspective projection matrix', () => {
    const projection = perspectiveMat4(Math.PI / 2, 1, 1, 100)
    const projected = transformPointMat4(projection, vec3(0, 0, -2))

    expect(projected.x).toBe(0)
    expect(projected.y).toBe(0)
    expect(projected.z).toBeGreaterThan(0)
    expect(projected.z).toBeLessThan(1)
  })
})
