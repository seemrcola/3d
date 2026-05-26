import type { Vec3 } from './math'

// 2D 坐标点。
// 经过投影后，3D 点会变成这种二维坐标。
export interface Point {
  x: number
  y: number
}

// mesh 的一个面。
// vertices 是 mesh.vertices 里的顶点下标，按绕面一圈的顺序排列。
// 三角面、四边形和更高边数多边形都用同一种结构表示。
export interface Face {
  vertices: number[]
  color: string
}

// 一个独立于渲染 API 的三维网格。
export interface Mesh {
  vertices: Vec3[]
  faces: Face[]
}

// viewport 是 core 对“屏幕尺寸”的抽象，不绑定 DOM 或 Canvas。
export interface Viewport {
  width: number
  height: number
}
