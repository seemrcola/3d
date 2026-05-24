type PipeFunction = (value: any, ...args: any[]) => any

// 一个很轻量的链式调用工具。
//
// 它解决的问题是：把这种从里往外读的嵌套调用：
//   screen(project(translate_z(rotate_xz(v, angle), dz)))
//
// 改成从上往下读的流水线：
//   task(v)
//     .pipe(rotate_xz, angle)
//     .pipe(translate_z, dz)
//     .pipe(project)
//     .pipe(screen)
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
