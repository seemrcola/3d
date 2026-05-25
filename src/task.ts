type PipeFunction = (value: any, ...args: any[]) => any

// 一个很轻量的链式调用工具。
//
// 它解决的问题是：把这种从里往外读的嵌套调用：
//   mapToViewport(perspectiveProject(translateZ(rotateXZ(v, angle), dz)), viewport)
//
// 改成从上往下读的流水线：
//   task(v)
//     .pipe(rotateXZ, angle)
//     .pipe(translateZ, dz)
//     .pipe(perspectiveProject)
//     .pipe(mapToViewport, viewport)
//     .value()
//
// pipe() 会把当前值作为第一个参数传给函数。
// pipe(fn, a, b) 实际执行的是 fn(currentValue, a, b)。
export function task(value: any) {
  return {
    // 执行一步转换，并把转换结果重新包成 task，方便继续 .pipe()。
    pipe(fn: PipeFunction, ...args: any[]) {
      const nextValue = fn(value, ...args)

      return task(nextValue)
    },

    // 取出最后算出来的真实值。
    value() {
      return value
    }
  }
}
