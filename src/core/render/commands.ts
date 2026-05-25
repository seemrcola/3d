import type { Point } from '../types'

// RenderCommand 是 core 和具体渲染后端之间的边界。
// core 只告诉外部"画什么"，不直接接触 CanvasRenderingContext2D。
export interface FaceRenderCommand {
  type: 'face'
  // 填充色目前直接来自 Face.color；后续可以替换成 Material。
  color: string
  // 深度越大越远。Canvas 没有 z-buffer，所以 renderer 会按这个顺序画。
  depth: number
  // 屏幕空间顶点，数量由面裁剪后决定（四边形裁剪可能变成 3-4 边形）。
  points: Point[]
}

export type RenderCommand = FaceRenderCommand
