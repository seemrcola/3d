import type { Edge, Point3D } from './types'

// canvas 的逻辑尺寸。
// index.ts 会再根据 devicePixelRatio 放大真实像素，避免高分屏模糊。
export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 800

// 手动控制帧率。
// 每帧的时间步长 dt = 1 / FPS，动画速度也依赖这个值。
export const FPS = 60

// 画面颜色。
// 背景是深色，立方体边线和点使用绿色，形成类似线框模型的效果。
export const BACKGROUND_COLOR = '#101010'
export const FOREGROUND_COLOR = '#50FF50'

// 立方体顶点和边线的绘制样式。
export const POINT_SIZE = 8
export const LINE_WIDTH = 2

// 一个边长为 0.5 的立方体，中心在原点附近。
// 前 4 个点是 z = 0.25 的面，后 4 个点是 z = -0.25 的面。
// 这里的坐标还不是屏幕像素，只是 3D 世界坐标。
export const CUBE_VERTICES: Point3D[] = [
  { x:  0.25, y:  0.25, z:  0.25 },
  { x: -0.25, y:  0.25, z:  0.25 },
  { x: -0.25, y: -0.25, z:  0.25 },
  { x:  0.25, y: -0.25, z:  0.25 },

  { x:  0.25, y:  0.25, z: -0.25 },
  { x: -0.25, y:  0.25, z: -0.25 },
  { x: -0.25, y: -0.25, z: -0.25 },
  { x:  0.25, y: -0.25, z: -0.25 }
]

// 立方体的 12 条边。
// 每一项 [i, j] 表示把第 i 个顶点和第 j 个顶点连起来。
export const CUBE_EDGES: Edge[] = [
  // 正面
  [0, 1], [1, 2], [2, 3], [3, 0],
  // 背面
  [4, 5], [5, 6], [6, 7], [7, 4],
  // 顶点连线
  [0, 4], [1, 5], [2, 6], [3, 7]
]
