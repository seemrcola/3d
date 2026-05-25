import type { Point, Viewport } from '../types'
import type { Vec3 } from '../math'
import { vec3 } from '../math'
import { mapToViewport } from '../viewport'
import { Object3D } from './object3d'

export interface PerspectiveCameraOptions {
  // 垂直视野角，单位是弧度。Math.PI / 2 表示 90 度。
  fov: number
  // viewport 宽高比，用来避免非正方形画布里的图像被横向拉伸。
  aspect: number
  // near / far 是相机能看见的深度范围，范围外的点会被裁掉。
  near: number
  far: number
}

// 当前相机是 MVP 版本：支持位置和透视投影，还没有 camera rotation/view matrix。
// 约定相机朝 +z 方向看，所以 cameraZ 越大表示点越远。
export class PerspectiveCamera extends Object3D {
  fov: number
  aspect: number
  near: number
  far: number

  constructor({ fov, aspect, near, far }: PerspectiveCameraOptions) {
    super()
    this.fov = fov
    this.aspect = aspect
    this.near = near
    this.far = far
  }

  // 把世界坐标点投影成 viewport 像素点。
  // 返回 null 表示点在 near/far 外面，调用方应该跳过依赖这个点的面。
  projectPoint(point: Vec3, viewport: Viewport): Point | null {
    // 先把世界坐标转换成相机相对坐标。
    // 目前相机不能旋转，所以只需要减去 camera.position。
    const cameraX = point.x - this.position.x
    const cameraY = point.y - this.position.y
    const cameraZ = point.z - this.position.z

    if (cameraZ <= this.near || cameraZ >= this.far) {
      return null
    }

    // tan(fov / 2) 是视锥半高和深度的比例。
    // 深度越大，cameraX / cameraZ 和 cameraY / cameraZ 越小，也就是远处更小。
    const scale = Math.tan(this.fov / 2)

    return mapToViewport(
      {
        x: cameraX / (cameraZ * scale * this.aspect),
        y: cameraY / (cameraZ * scale)
      },
      viewport
    )
  }

  // 将世界空间下的顶点转换到相机空间。
  // 用于裁剪前统一坐标系。
  private toCameraSpace(point: Vec3): Vec3 {
    return vec3(
      point.x - this.position.x,
      point.y - this.position.y,
      point.z - this.position.z
    )
  }

  // 用 Sutherland–Hodgman 风格裁剪一个多边形面到 near 平面。
  // vertices 是世界坐标系下的面顶点，返回值是世界坐标系下裁剪后的顶点。
  // 返回 null 表示整个面都在近裁剪面后面，可以丢弃。
  clipNearFace(vertices: Vec3[]): Vec3[] | null {
    const n = vertices.length
    const cameraSpace = vertices.map(v => this.toCameraSpace(v))
    const behind: boolean[] = cameraSpace.map(v => v.z <= this.near)

    // 全部在 near 后面 → 丢弃
    if (behind.every(b => b)) return null
    // 全部在 near 前面 → 原样返回
    if (behind.every(b => !b)) return vertices

    // 部分在 near 后面 → 逐边裁剪
    const result: Vec3[] = []
    for (let i = 0; i < n; i++) {
      const curr = vertices[i]!
      const next = vertices[(i + 1) % n]!
      const currCs = cameraSpace[i]!
      const nextCs = cameraSpace[(i + 1) % n]!
      const currBehind = behind[i]!
      const nextBehind = behind[(i + 1) % n]!

      // 当前顶点在 near 前面 → 保留
      if (!currBehind) {
        result.push(curr)
      }

      // 边跨越 near 平面 → 计算交点并插入
      if (currBehind !== nextBehind) {
        const t = (this.near - currCs.z) / (nextCs.z - currCs.z)
        result.push(vec3(
          curr.x + t * (next.x - curr.x),
          curr.y + t * (next.y - curr.y),
          curr.z + t * (next.z - curr.z)
        ))
      }
    }

    return result.length >= 3 ? result : null
  }
}
