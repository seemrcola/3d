import type { Vec3 } from './math'
import type { Face } from './types'
import { crossVec3, dotVec3, subVec3 } from './math'

// 一个已经算出平均深度的面。
// z 用来做绘制排序：在当前投影模型里，z 越大表示离观察者越远。
export interface DepthSortedFace extends Face {
  z: number
}

// 计算一个面的平均 z 值。
// 面本身只保存顶点下标，所以这里需要到 transformed 里取出当前帧的 3D 顶点。
function faceDepth(face: Face, transformed: Vec3[]): number {
  const totalZ = face.vertices.reduce((sum, index) => sum + transformed[index]!.z, 0)

  return totalZ / face.vertices.length
}

// 按深度给面排序。
// canvas 没有 3D 深度缓冲，后画的图形会盖住先画的图形；
// 所以这里使用简单的"画家算法"：先画远处的面，再画近处的面。
export function sortFacesByDepth(faces: Face[], transformed: Vec3[]): DepthSortedFace[] {
  // 预计算所有面的深度，避免排序时重复计算。
  const result: DepthSortedFace[] = new Array(faces.length)
  for (let i = 0; i < faces.length; i++) {
    const face = faces[i]!
    result[i] = { ...face, z: faceDepth(face, transformed) }
  }
  result.sort((a, b) => b.z - a.z)
  return result
}

// 判断一个面是否背对相机。
// 面的顶点顺序决定法线方向；如果 OBJ winding 不一致，剔除结果也会不一致。
export function isBackFace(vertices: Vec3[], cameraPosition: Vec3): boolean {
  const [v0, v1, v2] = vertices
  if (!v0 || !v1 || !v2) return false

  const edge1 = subVec3(v1, v0)
  const edge2 = subVec3(v2, v0)
  const normal = crossVec3(edge1, edge2)
  const viewDirection = subVec3(cameraPosition, v0)

  return dotVec3(normal, viewDirection) <= 0
}
