import {
  BACKGROUND_COLOR,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  FOREGROUND_COLOR,
  FPS,
  LINE_WIDTH
} from './constants'
import {
  MeshObject,
  PerspectiveCamera,
  parseObjMesh,
  Scene,
  vec3
} from './core'
import { Canvas3DRenderer } from './render'
import cubeObjUrl from '../models/cube.obj'
import teapotObjUrl from '../models/teapot.obj'

// angle 控制模型当前旋转角度。
let angle = 0
const scene = new Scene()
let cube: MeshObject | null = null
let teapot: MeshObject | null = null
const camera = new PerspectiveCamera({
  fov: Math.PI / 2,
  aspect: CANVAS_WIDTH / CANVAS_HEIGHT,
  near: 0.1,
  far: 100
})

async function loadObj(url: string, color: string): Promise<MeshObject | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const mesh = parseObjMesh(await response.text(), { color })
    if (mesh.vertices.length === 0 || mesh.faces.length === 0) return null

    return new MeshObject(mesh)
  } catch (error) {
    console.warn('Failed to load OBJ model.', error)
    return null
  }
}

async function loadDemoModels() {
  const [loadedCube, loadedTeapot] = await Promise.all([
    loadObj(cubeObjUrl, '#E85D75'),
    loadObj(teapotObjUrl, '#3A86FF')
  ])

  if (loadedCube) {
    cube = loadedCube
    scene.add(cube)
  }

  if (loadedTeapot) {
    teapot = loadedTeapot
    teapot.scale = vec3(0.18, 0.18, 0.18)
    scene.add(teapot)
  }
}

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
// 2. 更新模型对象的姿态。
// 3. 交给 Canvas3DRenderer 渲染整个 scene。
function frame() {
  const dt = 1 / FPS
  angle += 2 * Math.PI * dt
  if (cube) {
    cube.position = vec3(-0.45, 0, 2)
    cube.rotation = vec3(angle, angle, 0)
  }
  if (teapot) {
    teapot.position = vec3(1.05, -0.2, 2.4)
    teapot.rotation = vec3(-0.45, angle, 0)
  }
  renderer.render(scene, camera)

  // 用 setTimeout 模拟固定帧率的动画循环。
  // 之后如果要做更顺滑的动画，可以改成 requestAnimationFrame。
  setTimeout(frame, 1000 / FPS)
}

void loadDemoModels()

// 启动第一帧。
setTimeout(frame, 1000 / FPS)
