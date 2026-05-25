import type { Vec3 } from '../math'
import type { Face, Mesh } from '../types'

// 一个边长为 0.5 的立方体，中心在原点附近。
// 前 4 个点是 z = 0.25 的面，后 4 个点是 z = -0.25 的面。
export const CUBE_VERTICES: Vec3[] = [
  { x: 0.25, y: 0.25, z: 0.25 },
  { x: -0.25, y: 0.25, z: 0.25 },
  { x: -0.25, y: -0.25, z: 0.25 },
  { x: 0.25, y: -0.25, z: 0.25 },

  { x: 0.25, y: 0.25, z: -0.25 },
  { x: -0.25, y: 0.25, z: -0.25 },
  { x: -0.25, y: -0.25, z: -0.25 },
  { x: 0.25, y: -0.25, z: -0.25 }
]

// 立方体的 6 个面。
// 每个面由 4 个顶点组成；之后要给某一面单独上色，就改对应面里的 color。
export const CUBE_FACES: Face[] = [
  { vertices: [0, 1, 2, 3], color: '#E85D75' },
  { vertices: [4, 7, 6, 5], color: '#3A86FF' },
  { vertices: [0, 4, 5, 1], color: '#FFD166' },
  { vertices: [3, 2, 6, 7], color: '#06D6A0' },
  { vertices: [1, 5, 6, 2], color: '#B8F35A' },
  { vertices: [0, 3, 7, 4], color: '#FF9F1C' }
]

export const CUBE_MESH: Mesh = {
  vertices: CUBE_VERTICES,
  faces: CUBE_FACES
}
