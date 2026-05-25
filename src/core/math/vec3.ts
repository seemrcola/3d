// Vec3 是最小的 3D 向量类型。
// 这里和 Point3D 长得一样，但语义不同：Vec3 更偏数学运算，Point3D 更偏几何位置。
export interface Vec3 {
  x: number
  y: number
  z: number
}

// 小工厂函数让测试和调用代码保持简短，也避免到处手写 { x, y, z }。
export function vec3(x: number, y: number, z: number): Vec3 {
  return { x, y, z }
}

// 向量加法：常用于把“位置 + 位移”组合成新位置。
export function addVec3(a: Vec3, b: Vec3): Vec3 {
  return vec3(a.x + b.x, a.y + b.y, a.z + b.z)
}

// 向量减法：常用于得到两个点之间的方向向量。
export function subVec3(a: Vec3, b: Vec3): Vec3 {
  return vec3(a.x - b.x, a.y - b.y, a.z - b.z)
}

// 标量乘法：把向量长度按比例放大或缩小，方向不变。
export function scaleVec3(v: Vec3, scalar: number): Vec3 {
  return vec3(v.x * scalar, v.y * scalar, v.z * scalar)
}

// 点积可以用来判断两个方向的夹角关系；结果越大，方向越接近。
export function dotVec3(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

// 叉积会得到一个同时垂直于 a 和 b 的向量。
// 后续如果做背面剔除或光照法线，会用到这个运算。
export function crossVec3(a: Vec3, b: Vec3): Vec3 {
  return vec3(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x
  )
}

// 三维向量长度，Math.hypot 比手写 sqrt(x*x + y*y + z*z) 更直观。
export function lengthVec3(v: Vec3): number {
  return Math.hypot(v.x, v.y, v.z)
}

// 单位化：保留方向，把长度变成 1。
// 零向量没有方向，直接返回零向量可以避免除以 0 产生 NaN。
export function normalizeVec3(v: Vec3): Vec3 {
  const length = lengthVec3(v)

  if (length === 0) {
    return vec3(0, 0, 0)
  }

  return scaleVec3(v, 1 / length)
}
