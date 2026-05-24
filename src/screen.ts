import type { Point } from './types'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants'

// 把投影后的标准化坐标转换成 canvas 像素坐标。
//
// project() 得到的坐标大致在 -1 到 1 之间：
//   x = -1 表示最左边，x = 1 表示最右边。
//   y = -1 表示下方，y = 1 表示上方。
//
// canvas 的坐标系不一样：
//   x = 0 在左边，x 越大越靠右。
//   y = 0 在上边，y 越大越靠下。
//
// 所以这里不仅要缩放到画布尺寸，还要把 y 轴翻转。
export function screen({x, y}: Point): Point {
  const sx = (x + 1) / 2 * CANVAS_WIDTH
  const sy = (1 - (y + 1) / 2) * CANVAS_HEIGHT
  return { x: sx, y: sy }
}
