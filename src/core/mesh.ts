import type { Face, Point3D } from './types'

// 一个已经算出平均深度的面。
// z 用来做绘制排序：在当前投影模型里，z 越大表示离观察者越远。
export interface DepthSortedFace extends Face {
  z: number
}

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
