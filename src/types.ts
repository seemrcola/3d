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

// 立方体的一个面。
// vertices 是 CUBE_VERTICES 里的四个顶点下标，按绕面一圈的顺序排列。
export interface Face {
  vertices: [number, number, number, number]
  color: string
}
