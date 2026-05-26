import type { Vec3 } from '../math'
import type { Point, Viewport } from '../types'
import type { FaceRenderCommand, RenderCommand } from './commands'
import { PerspectiveCamera, Scene } from '../scene'
import { isBackFace, sortFacesByDepth } from '../mesh'
import { transformPointMat4 } from '../math'

// 核心渲染管线：把 Scene + Camera + Viewport 转成抽象绘制命令。
// 这层不调用 Canvas API，所以它可以被测试，也可以被别的 renderer 复用。
export function createRenderCommands(
  scene: Scene,
  camera: PerspectiveCamera,
  viewport: Viewport
): RenderCommand[] {
  const commands: FaceRenderCommand[] = []

  for (const object of scene.meshObjects()) {
    // 先把 mesh 的局部顶点变换到世界坐标。
    const transformed = object.mesh.vertices.map(vertex => transformPointMat4(object.localMatrix, vertex))

    // 对同一个 mesh 的面先做一次深度排序，避免远面盖住近面。
    for (const face of sortFacesByDepth(object.mesh.faces, transformed)) {
      // 取出面在世界空间的顶点
      const faceVertices: Vec3[] = face.vertices.map(i => transformed[i]!)
      if (isBackFace(faceVertices, camera.position)) continue

      // 用 near/far 平面裁剪；裁剪后可能变成 3~4 边形
      const clipped = camera.clipDepthFace(faceVertices)
      if (!clipped) continue

      // 将裁剪后的顶点投影到屏幕像素
      const projected: Point[] = []
      let allVisible = true
      for (const v of clipped) {
        const p = camera.projectPoint(v, viewport)
        if (!p) {
          allVisible = false
          break
        }
        projected.push(p)
      }
      if (!allVisible) continue

      commands.push({
        type: 'face',
        color: face.color,
        depth: face.z,
        points: projected
      })
    }
  }

  // 多个 mesh 对象之间也需要整体排序，否则对象 A 的近面可能被对象 B 的远面盖住。
  return commands.sort((a, b) => b.depth - a.depth)
}
