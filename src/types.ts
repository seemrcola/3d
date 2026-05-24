// 2D 坐标点。
// 经过 project() 之后，点会从 3D 坐标变成这种 2D 坐标。
export interface Point {
  x: number
  y: number
}

// 3D 坐标点。
// x: 左右方向，y: 上下方向，z: 深度方向。
export interface Point3D extends Point {
  z: number
}

// 立方体的一条边。
// 两个数字不是坐标，而是 CUBE_VERTICES 里的顶点下标。
export type Edge = [number, number]
