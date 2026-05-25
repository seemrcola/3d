// 2D 坐标点。
// 经过投影后，3D 点会变成这种二维坐标。
export interface Point {
  x: number
  y: number
}

// 3D 坐标点。
// x: 左右方向，y: 上下方向，z: 深度方向。
export interface Point3D extends Point {
  z: number
}

// 立方体的一个面。
// vertices 是 mesh.vertices 里的四个顶点下标，按绕面一圈的顺序排列。
export interface Face {
  vertices: [number, number, number, number]
  color: string
}

// 一个独立于渲染 API 的三维网格。
export interface Mesh {
  vertices: Point3D[]
  faces: Face[]
}

// viewport 是 core 对“屏幕尺寸”的抽象，不绑定 DOM 或 Canvas。
export interface Viewport {
  width: number
  height: number
}
