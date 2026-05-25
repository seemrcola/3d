import { describe, expect, test } from 'bun:test'
import {
  multiplyMat4,
  rotationXMat4,
  rotationYMat4,
  scaleMat4,
  transformPointMat4,
  translationMat4,
  vec3
} from '../src/core/math'
import { Object3D } from '../src/core/scene/object3d'

describe('Object3D', () => {
  test('starts with an identity local matrix', () => {
    const object = new Object3D()

    expect(transformPointMat4(object.localMatrix, vec3(1, 2, 3))).toEqual(vec3(1, 2, 3))
  })

  test('composes position, rotation, and scale into a local matrix', () => {
    const object = new Object3D()
    object.position = vec3(10, 0, 2)
    object.rotation = vec3(Math.PI / 4, Math.PI / 6, 0)
    object.scale = vec3(2, 3, 4)

    const expected = multiplyMat4(
      translationMat4(10, 0, 2),
      multiplyMat4(
        rotationXMat4(Math.PI / 4),
        multiplyMat4(rotationYMat4(Math.PI / 6), scaleMat4(2, 3, 4))
      )
    )
    const actual = object.localMatrix
    const point = vec3(0.25, -0.5, 1)

    expect(transformPointMat4(actual, point)).toEqual({
      x: expect.closeTo(transformPointMat4(expected, point).x),
      y: expect.closeTo(transformPointMat4(expected, point).y),
      z: expect.closeTo(transformPointMat4(expected, point).z)
    })
  })
})
