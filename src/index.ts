import type { Point } from './types'
import {
  BACKGROUND_COLOR,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CUBE_EDGES,
  CUBE_VERTICES,
  FOREGROUND_COLOR,
  FPS,
  LINE_WIDTH,
  POINT_SIZE
} from './constants'
import { project } from './project'
import { screen } from './screen'
import { task } from './task'
import { translate_z, rotate_xz } from './translate'

// dz 控制立方体沿 z 轴移动的距离。
// angle 控制立方体当前旋转角度。
let dz = 0
let angle = 0

const game = document.querySelector('#canvas') as HTMLCanvasElement
const dpr = window.devicePixelRatio || 1
const ctx = game.getContext('2d') as CanvasRenderingContext2D

// canvas 有两套尺寸：
// 1. width / height 是真实绘制像素。
// 2. style.width / style.height 是页面上显示的 CSS 尺寸。
//
// 真实像素乘以 dpr，可以让高分屏上画出来的线条更清晰。
game.width = CANVAS_WIDTH * dpr
game.height = CANVAS_HEIGHT * dpr
game.style.width = CANVAS_WIDTH + 'px'
game.style.height = CANVAS_HEIGHT + 'px'
ctx.scale(dpr, dpr)

// 每一帧先用背景色覆盖整个画布，清掉上一帧的内容。
function clear() {
  ctx.fillStyle = BACKGROUND_COLOR
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
}

// 画一个顶点。
// 当前主流程只画边线；这个函数保留着，之后想显示顶点时可以直接用。
function point({x, y}: Point) {
  ctx.fillStyle = FOREGROUND_COLOR
  ctx.fillRect(x - POINT_SIZE / 2, y - POINT_SIZE / 2, POINT_SIZE, POINT_SIZE)
}

// 画一条边。
// a 和 b 已经是屏幕像素坐标，不再是 3D 世界坐标。
function line(a: Point, b: Point) {
  ctx.strokeStyle = FOREGROUND_COLOR
  ctx.lineWidth = LINE_WIDTH
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()
}

// 渲染一帧动画。
//
// 这一帧做的事情：
// 1. 根据 FPS 计算时间步长。
// 2. 更新 z 轴位移和旋转角度。
// 3. 清空画布。
// 4. 把立方体每个 3D 顶点转换成屏幕上的 2D 点。
// 5. 按 CUBE_EDGES 的定义把这些点连成线框。
function frame() {
  const dt = 1 / FPS
  dz += dt
  angle += 2 * Math.PI * dt
  clear()

  // 顶点转换流水线：
  // 3D 顶点 -> 绕 y 轴旋转 -> 沿 z 轴平移 -> 透视投影 -> canvas 像素坐标。
  const projected = CUBE_VERTICES.map(v =>
    task(v)
      .pipe(rotate_xz, angle)
      .pipe(translate_z, dz)
      .pipe(project)
      .pipe(screen)
      .value()
  )
  for (const [i, j] of CUBE_EDGES) {
    line(projected[i]!, projected[j]!)
  }

  // 用 setTimeout 模拟固定帧率的动画循环。
  // 之后如果要做更顺滑的动画，可以改成 requestAnimationFrame。
  setTimeout(frame, 1000 / FPS)
}

// 启动第一帧。
setTimeout(frame, 1000 / FPS)
