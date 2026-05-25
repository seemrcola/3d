import { describe, expect, test } from 'bun:test'
import {
  addVec3,
  crossVec3,
  dotVec3,
  lengthVec3,
  normalizeVec3,
  scaleVec3,
  subVec3,
  vec3
} from '../src/core/math/vec3'

describe('vec3', () => {
  test('creates and combines 3D vectors', () => {
    const a = vec3(1, 2, 3)
    const b = vec3(4, 6, 8)

    expect(addVec3(a, b)).toEqual(vec3(5, 8, 11))
    expect(subVec3(b, a)).toEqual(vec3(3, 4, 5))
    expect(scaleVec3(a, 2)).toEqual(vec3(2, 4, 6))
  })

  test('measures vector relationships', () => {
    const x = vec3(1, 0, 0)
    const y = vec3(0, 1, 0)
    const diagonal = vec3(3, 4, 0)

    expect(dotVec3(x, y)).toBe(0)
    expect(crossVec3(x, y)).toEqual(vec3(0, 0, 1))
    expect(lengthVec3(diagonal)).toBe(5)
    expect(normalizeVec3(diagonal)).toEqual({
      x: expect.closeTo(0.6),
      y: expect.closeTo(0.8),
      z: 0
    })
  })

  test('keeps a zero vector stable when normalizing', () => {
    expect(normalizeVec3(vec3(0, 0, 0))).toEqual(vec3(0, 0, 0))
  })
})
