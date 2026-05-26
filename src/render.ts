import type { PerspectiveCamera, Point, RenderCommand, Scene, Viewport } from './core'
import { createRenderCommands } from './core'

export interface Canvas3DRendererOptions {
  backgroundColor: string
  fillAlpha?: number
  outlineColor: string
  outlineWidth: number
  viewport: Viewport
}

// 在 canvas 上填充一个多边形面。
// points 来自 core render command,按顺序连线后围成当前面的边界。
// 四边形裁剪后可能变成三角形,所以这里接受任意数量的顶点。
function fillFace(ctx: CanvasRenderingContext2D, points: Point[], color: string) {
  const [first, ...rest] = points
  if (!first) return

  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(first.x, first.y)

  for (const point of rest) {
    ctx.lineTo(point.x, point.y)
  }

  ctx.closePath()
  ctx.fill()
}

// 在 canvas 上画一条边。
// a 和 b 已经是屏幕像素坐标,不再是 3D 世界坐标。
function strokeLine(ctx: CanvasRenderingContext2D, a: Point, b: Point) {
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()
}

// 沿一个面的边画线。
// 不同面共享的边会被画两次；MVP 先接受这个重复，后续可用 edge command 优化。
function strokeFaceOutline(ctx: CanvasRenderingContext2D, points: Point[]) {
  for (let i = 0; i < points.length; i++) {
    strokeLine(ctx, points[i]!, points[(i + 1) % points.length]!)
  }
}

function drawFaceCommand(ctx: CanvasRenderingContext2D, command: RenderCommand) {
  fillFace(ctx, command.points, command.color)
}

function strokeFaceCommand(ctx: CanvasRenderingContext2D, command: RenderCommand) {
  strokeFaceOutline(ctx, command.points)
}

export class Canvas3DRenderer {
  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly options: Canvas3DRendererOptions
  ) {}

  // 清屏只使用 viewport 的逻辑尺寸。
  // index.ts 已经通过 ctx.scale(dpr, dpr) 处理了高分屏真实像素。
  clear() {
    this.ctx.fillStyle = this.options.backgroundColor
    this.ctx.fillRect(0, 0, this.options.viewport.width, this.options.viewport.height)
  }

  // renderer 的职责很窄:向 core 请求 RenderCommand,再把命令翻译成 Canvas 2D 调用。
  // 这样 core 可以独立测试,也给未来增加 SVG/WebGL renderer 留出了空间。
  render(scene: Scene, camera: PerspectiveCamera) {
    const commands = createRenderCommands(scene, camera, this.options.viewport)

    this.clear()

    this.ctx.strokeStyle = this.options.outlineColor
    this.ctx.lineWidth = this.options.outlineWidth

    // 使用画家算法(从远到近),在同一次遍历中先填充面再描边。
    // 填充使用透明度,描边恢复不透明,方便观察背面和内部遮挡关系。
    for (const command of commands) {
      this.ctx.globalAlpha = this.options.fillAlpha ?? 1
      drawFaceCommand(this.ctx, command)
      this.ctx.globalAlpha = 1
      strokeFaceCommand(this.ctx, command)
    }
  }
}
