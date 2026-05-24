import type { Point3D } from './types'

// 沿 z 轴移动一个 3D 点。
// dz 越大，点离观察者越远；配合 project() 后会显得更小。
export function translate_z({x, y, z}: Point3D, dz: number): Point3D {
  return { x, y, z: z + dz }
}

// 在 x-z 平面里旋转一个 3D 点，也就是绕 y 轴旋转。
//
// y 保持不变，x 和 z 根据角度互相转换。
// 这会让立方体看起来像是在左右方向转动。
export function rotate_xz({x, y, z}: Point3D, angle: number): Point3D {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return {
    x: x * c - z * s,
    z: x * s + z * c,
    y
  }
}
