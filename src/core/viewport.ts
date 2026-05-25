import type { Point, Viewport } from './types'

// 把投影后的标准化坐标转换成 viewport 像素坐标。
//
// 这个函数只做坐标数学，不接触 CanvasRenderingContext2D。
// canvas、SVG、WebGL 或其他目标都可以复用它。
export function mapToViewport({ x, y }: Point, { width, height }: Viewport): Point {
  const sx = (x + 1) / 2 * width
  const sy = (1 - (y + 1) / 2) * height

  return { x: sx, y: sy }
}
