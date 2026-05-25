export type { Face, Mesh, Point, Viewport } from './types'
export type { DepthSortedFace } from './mesh'
export type { Mat4, Vec3 } from './math'

export { sortFacesByDepth } from './mesh'
export type { FaceRenderCommand, RenderCommand } from './render'
export { createRenderCommands } from './render'
export { mapToViewport } from './viewport'
export { CUBE_FACES, CUBE_MESH, CUBE_VERTICES } from './primitives/cube'
export { MeshObject, Object3D, PerspectiveCamera, Scene } from './scene'
export type { PerspectiveCameraOptions } from './scene'
export {
  addVec3,
  crossVec3,
  dotVec3,
  identityMat4,
  lengthVec3,
  multiplyMat4,
  normalizeVec3,
  perspectiveMat4,
  rotationXMat4,
  rotationYMat4,
  rotationZMat4,
  scaleMat4,
  scaleVec3,
  subVec3,
  transformPointMat4,
  translationMat4,
  vec3
} from './math'
