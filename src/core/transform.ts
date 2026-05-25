import type { Point3D } from './types'

// 沿 z 轴移动一个 3D 点。
// dz 越大，点离观察者越远；配合透视投影后会显得更小。
export function translateZ({ x, y, z }: Point3D, dz: number): Point3D {
  return { x, y, z: z + dz }
}

// 在 x-z 平面里旋转一个 3D 点，也就是绕 y 轴旋转。
export function rotateXZ({ x, y, z }: Point3D, angle: number): Point3D {
  const c = Math.cos(angle)
  const s = Math.sin(angle)

  return {
    x: x * c - z * s,
    y,
    z: x * s + z * c
  }
}

// 在 y-z 平面里旋转一个 3D 点，也就是绕 x 轴旋转。
export function rotateYZ({ x, y, z }: Point3D, angle: number): Point3D {
  const c = Math.cos(angle)
  const s = Math.sin(angle)

  return {
    x,
    y: y * c - z * s,
    z: y * s + z * c
  }
}
