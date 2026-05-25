import type { Face, Point, Point3D } from './types'

// 一个已经算出平均深度的面。
// z 用来做绘制排序：在当前投影模型里，z 越大表示离观察者越远。
export interface DepthSortedFace extends Face {
  z: number
}

// 一个面投影到屏幕后得到的四个 canvas 像素点。
// 这里保持固定长度，是为了表达“当前项目里的面都是四边形”。
type FacePoints = [Point, Point, Point, Point]

// 计算一个面的平均 z 值。
// 面本身只保存顶点下标，所以这里需要到 transformed 里取出当前帧的 3D 顶点。
function faceDepth(face: Face, transformed: Point3D[]): number {
  const totalZ = face.vertices.reduce((sum, index) => sum + transformed[index]!.z, 0)

  return totalZ / face.vertices.length
}

// 按深度给面排序。
// canvas 没有 3D 深度缓冲，后画的图形会盖住先画的图形；
// 所以这里使用简单的“画家算法”：先画远处的面，再画近处的面。
export function sortFacesByDepth(faces: Face[], transformed: Point3D[]): DepthSortedFace[] {
  return faces
    .map(face => ({
      ...face,
      z: faceDepth(face, transformed)
    }))
    .sort((a, b) => b.z - a.z)
}

// 把一个面的四个顶点下标转换成四个屏幕坐标。
// projected 里的点已经完成了 3D 投影和 canvas 坐标映射，可以直接用于绘制。
function facePoints(face: Face, projected: Point[]): FacePoints {
  const [a, b, c, d] = face.vertices

  return [projected[a]!, projected[b]!, projected[c]!, projected[d]!]
}

// 在 canvas 上填充一个四边形面。
// points 的顺序来自 CUBE_FACES，按这个顺序连线后会围成当前面的边界。
function fillFace(ctx: CanvasRenderingContext2D, points: FacePoints, color: string) {
  const [first, ...rest] = points

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
// a 和 b 已经是屏幕像素坐标，不再是 3D 世界坐标。
function strokeLine(ctx: CanvasRenderingContext2D, a: Point, b: Point) {
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()
}

// 沿一个面的四条边画线。
// 不同面共享的边会被画两次；这里接受这个重复，让几何数据只保留 CUBE_FACES。
function strokeFaceOutline(ctx: CanvasRenderingContext2D, points: FacePoints) {
  for (let i = 0; i < points.length; i++) {
    strokeLine(ctx, points[i]!, points[(i + 1) % points.length]!)
  }
}

// 绘制带颜色的立方体面。
//
// 这个函数封装了颜色绘制算法：
// 1. 按每个面的平均 z 值从远到近排序。
// 2. 先填充所有彩色面，让近处的面覆盖远处的面。
// 3. 最后统一画面边框，让线框始终压在颜色上方。
export function drawColoredFaces(
  ctx: CanvasRenderingContext2D,
  faces: Face[],
  transformed: Point3D[],
  projected: Point[],
  outlineColor: string,
  outlineWidth: number
) {
  const sortedFaces = sortFacesByDepth(faces, transformed)

  for (const cubeFace of sortedFaces) {
    fillFace(ctx, facePoints(cubeFace, projected), cubeFace.color)
  }

  ctx.strokeStyle = outlineColor
  ctx.lineWidth = outlineWidth

  for (const cubeFace of sortedFaces) {
    strokeFaceOutline(ctx, facePoints(cubeFace, projected))
  }
}
