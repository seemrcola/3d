import type { Point, Point3D } from './types'

// 透视投影：把 3D 点压成 2D 点。
//
// 这里用的是最简化的透视公式：
//   screenX = x / z
//   screenY = y / z
//
// z 越大，x / z 和 y / z 越小，所以远处的东西看起来更小。
// 这就是“近大远小”的核心。
export function project({x, y, z}: Point3D): Point {
  return { x: x / z, y: y / z }
}
