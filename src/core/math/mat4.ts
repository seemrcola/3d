import type { Vec3 } from './vec3'
import { vec3 } from './vec3'

// Column-major 4x4 matrix，和 OpenGL/WebGL 常见的内存布局一致。
// 也就是说，数组里连续 4 个数字表示一列，而不是一行。
// 这样平移量会落在最后一列：m[12], m[13], m[14]。
export type Mat4 = [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number
]

function mat4(values: Mat4): Mat4 {
  return values
}

// 从 column-major 数组里按“行、列”读取元素。
// 矩阵乘法公式通常按 row/column 写，用这个 helper 可以减少索引心算。
function element(m: Mat4, row: number, column: number): number {
  return m[column * 4 + row]!
}

// 单位矩阵：对点做变换时不会改变点的位置。
export function identityMat4(): Mat4 {
  return mat4([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ])
}

// 平移矩阵：把局部坐标整体移动到世界坐标里的某个位置。
export function translationMat4(x: number, y: number, z: number): Mat4 {
  return mat4([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 1
  ])
}

// 缩放矩阵：沿三个轴分别拉伸或压缩模型。
export function scaleMat4(x: number, y: number, z: number): Mat4 {
  return mat4([
    x, 0, 0, 0,
    0, y, 0, 0,
    0, 0, z, 0,
    0, 0, 0, 1
  ])
}

// 绕 x 轴旋转：y/z 会互相影响，x 保持不变。
export function rotationXMat4(angle: number): Mat4 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)

  return mat4([
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1
  ])
}

// 绕 y 轴旋转：x/z 会互相影响，y 保持不变。
export function rotationYMat4(angle: number): Mat4 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)

  // 标准右手系：绕 Y 轴正方向旋转，从 +X 转向 +Z。
  return mat4([
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1
  ])
}

// 绕 z 轴旋转：x/y 会互相影响，z 保持不变。
export function rotationZMat4(angle: number): Mat4 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)

  return mat4([
    c, s, 0, 0,
    -s, c, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ])
}

// 矩阵乘法：返回 a * b。
// 使用列向量约定时，multiplyMat4(T, R) 作用到点上等价于“先 R 后 T”。
// Object3D.localMatrix 正是利用这个规则组合 scale -> rotation -> translation。
export function multiplyMat4(a: Mat4, b: Mat4): Mat4 {
  const result = new Array<number>(16) as Mat4

  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 4; row++) {
      result[column * 4 + row] =
        element(a, row, 0) * element(b, 0, column) +
        element(a, row, 1) * element(b, 1, column) +
        element(a, row, 2) * element(b, 2, column) +
        element(a, row, 3) * element(b, 3, column)
    }
  }

  return result
}

// 把一个 3D 点当作齐次坐标 (x, y, z, 1) 乘以 4x4 矩阵。
// tw 是齐次坐标里的 w 分量；透视投影会把 w 变成非 1，需要除回普通 3D 坐标。
export function transformPointMat4(m: Mat4, point: Vec3): Vec3 {
  const x = point.x
  const y = point.y
  const z = point.z
  const w = 1
  const tx = element(m, 0, 0) * x + element(m, 0, 1) * y + element(m, 0, 2) * z + element(m, 0, 3) * w
  const ty = element(m, 1, 0) * x + element(m, 1, 1) * y + element(m, 1, 2) * z + element(m, 1, 3) * w
  const tz = element(m, 2, 0) * x + element(m, 2, 1) * y + element(m, 2, 2) * z + element(m, 2, 3) * w
  const tw = element(m, 3, 0) * x + element(m, 3, 1) * y + element(m, 3, 2) * z + element(m, 3, 3) * w

  if (tw !== 0 && tw !== 1) {
    return vec3(tx / tw, ty / tw, tz / tw)
  }

  return vec3(tx, ty, tz)
}

// 透视投影矩阵。当前 demo 的相机走的是更直观的 projectPoint，
// 这个函数保留下来是为了测试和后续接近标准 graphics pipeline。
export function perspectiveMat4(fovY: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan(fovY / 2)
  const depth = near - far

  return mat4([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) / depth, -1,
    0, 0, (2 * far * near) / depth, 0
  ])
}
