import {
  BACKGROUND_COLOR,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  FOREGROUND_COLOR,
  FPS,
  LINE_WIDTH
} from './constants'
import {
  CUBE_FACES,
  CUBE_VERTICES,
  mapToViewport,
  perspectiveProject,
  rotateXZ,
  rotateYZ,
  translateZ
} from './core'
import { drawColoredFaces } from './render'
import { task } from './task'

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

// 渲染一帧动画。
//
// 这一帧做的事情：
// 1. 根据 FPS 计算时间步长。
// 2. 更新 z 轴位移和旋转角度。
// 3. 清空画布。
// 4. 把立方体每个 3D 顶点先变换到当前帧的位置。
// 5. 把变换后的 3D 点投影到屏幕上的 2D 点。
// 6. 调用 render.ts 里的绘制算法，把六个面按深度填色并画出轮廓。
function frame() {
  const dt = 1 / FPS
  dz += dt
  dz = Math.min(2, dz)
  angle += 2 * Math.PI * dt
  clear()

  // 顶点转换流水线：
  // 3D 顶点 -> 绕 y 轴旋转 -> 绕 x 轴旋转 -> 沿 z 轴平移。
  const transformed = CUBE_VERTICES.map(v =>
    task(v)
      .pipe(rotateXZ, angle)
      .pipe(rotateYZ, angle)
      .pipe(translateZ, dz)
      .value()
  )

  // 变换后的 3D 点 -> 透视投影 -> canvas 像素坐标。
  const projected = transformed.map(v =>
    task(v)
      .pipe(perspectiveProject)
      .pipe(mapToViewport, { width: CANVAS_WIDTH, height: CANVAS_HEIGHT })
      .value()
  )

  // 面的排序、填色和边框绘制都放在 render.ts 中，
  // 这里保持主循环只描述“准备数据 -> 绘制”的流程。
  drawColoredFaces(ctx, CUBE_FACES, transformed, projected, FOREGROUND_COLOR, LINE_WIDTH)

  // 用 setTimeout 模拟固定帧率的动画循环。
  // 之后如果要做更顺滑的动画，可以改成 requestAnimationFrame。
  setTimeout(frame, 1000 / FPS)
}

// 启动第一帧。
setTimeout(frame, 1000 / FPS)
