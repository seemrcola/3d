import {
  BACKGROUND_COLOR,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  FOREGROUND_COLOR,
  FPS,
  LINE_WIDTH
} from './constants'
import {
  CUBE_MESH,
  MeshObject,
  PerspectiveCamera,
  Scene,
  vec3
} from './core'
import { Canvas3DRenderer } from './render'

// angle 控制立方体当前旋转角度。
let angle = 0
const scene = new Scene()
const cube = new MeshObject(CUBE_MESH)
const camera = new PerspectiveCamera({
  fov: Math.PI / 2,
  aspect: CANVAS_WIDTH / CANVAS_HEIGHT,
  near: 0.1,
  far: 100
})

scene.add(cube)

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

const renderer = new Canvas3DRenderer(ctx, {
  backgroundColor: BACKGROUND_COLOR,
  outlineColor: FOREGROUND_COLOR,
  outlineWidth: LINE_WIDTH,
  viewport: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT }
})

// 渲染一帧动画。
//
// 这一帧做的事情：
// 1. 根据 FPS 计算时间步长。
// 2. 更新立方体对象的姿态。
// 3. 交给 Canvas3DRenderer 渲染整个 scene。
function frame() {
  const dt = 1 / FPS
  angle += 2 * Math.PI * dt
  cube.position = vec3(0, 0, 2)
  cube.rotation = vec3(angle, angle, 0)
  renderer.render(scene, camera)

  // 用 setTimeout 模拟固定帧率的动画循环。
  // 之后如果要做更顺滑的动画，可以改成 requestAnimationFrame。
  setTimeout(frame, 1000 / FPS)
}

// 启动第一帧。
setTimeout(frame, 1000 / FPS)
