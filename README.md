# 3D Wireframe Cube
@tsoding 从tsoding那里学到的一点新知识。

一个用 TypeScript 和 Canvas 手写的最小 3D 线框立方体渲染项目。

这个项目没有使用 Three.js 之类的 3D 引擎，而是自己完成一条简单的 3D 渲染流水线：

```txt
3D 顶点
  -> 绕 y 轴旋转
  -> 沿 z 轴平移
  -> 透视投影成 2D 坐标
  -> 转换成 Canvas 像素坐标
  -> 按边的定义画成线框
```

适合用来理解 3D 图形里最核心的几个概念：坐标、旋转、深度、透视投影、屏幕映射和逐帧渲染。

## 效果

页面会在 `canvas` 上绘制一个绿色线框立方体。每一帧里，立方体会绕 y 轴旋转，同时沿 z 轴逐渐移动，然后通过透视投影呈现在 2D 屏幕上。

## 技术栈

- TypeScript
- Canvas 2D API
- Bun

## 项目结构

```txt
.
├── index.html          # 页面入口，挂载 canvas 并加载 src/index.ts
├── package.json        # Bun / TypeScript 项目配置
├── tsconfig.json       # TypeScript 编译检查配置
└── src
    ├── constants.ts    # 画布尺寸、颜色、FPS、立方体顶点和面
    ├── index.ts        # 主渲染入口，负责 canvas 初始化和动画循环
    ├── project.ts      # 透视投影：3D 坐标 -> 2D 坐标
    ├── render.ts       # 面的深度排序、填色和轮廓绘制
    ├── screen.ts       # 屏幕映射：标准化 2D 坐标 -> canvas 像素坐标
    ├── task.ts         # 链式调用工具，用来组织顶点转换流水线
    ├── translate.ts    # 3D 变换：z 轴平移、绕 y 轴旋转
    └── types.ts        # Point、Point3D、Face 等基础类型
```

## 运行项目

安装依赖：

```bash
bun install
```

启动本地页面：

```bash
bun index.html
```

Bun 会启动一个本地开发服务器，默认地址通常是：

```txt
http://localhost:3000/
```

打开这个地址即可看到 canvas 画面。

## 验证

运行 TypeScript 类型检查：

```bash
bunx tsc --noEmit
```

如果之后添加了 `*.test.ts` 或 `*.spec.ts` 测试文件，可以用下面的命令运行测试：

```bash
bun test
```

## 核心流程

主流程在 `src/index.ts` 里。每一帧会先更新动画状态，然后把立方体的每个 3D 顶点转换成 2D 屏幕点：

```ts
const projected = CUBE_VERTICES.map(v =>
  task(v)
    .pipe(rotate_xz, angle)
    .pipe(translate_z, dz)
    .pipe(project)
    .pipe(screen)
    .value()
)
```

这段链式调用等价于：

```ts
screen(project(translate_z(rotate_xz(v, angle), dz)))
```

链式写法的好处是转换顺序更接近人的阅读习惯：先旋转，再平移，再投影，最后映射到屏幕。

## 坐标和投影

项目里有两种坐标：

- `Point3D`：三维世界坐标，包含 `x`、`y`、`z`
- `Point`：二维坐标，包含 `x`、`y`

透视投影在 `src/project.ts` 里：

```ts
return { x: x / z, y: y / z }
```

这个公式的直觉是：`z` 越大，点越远；同样的 `x` 和 `y` 除以更大的 `z` 后会变小，所以远处的物体看起来更小。

屏幕映射在 `src/screen.ts` 里，负责把 `-1` 到 `1` 附近的投影坐标转换成 canvas 像素坐标。因为 canvas 的 y 轴向下增长，而数学坐标里的 y 轴通常向上增长，所以这里也会翻转 y 轴。

## 立方体数据

立方体由两部分组成：

- `CUBE_VERTICES`：8 个顶点
- `CUBE_FACES`：6 个面

`CUBE_FACES` 里的每一项都是四个顶点下标和一个颜色。渲染时会先用这四个顶点填充面，再沿这四个顶点闭合连线，所以不再需要单独维护 `CUBE_EDGES`。

## 后续可以尝试

- 用 `requestAnimationFrame` 替换 `setTimeout`，让动画更贴合浏览器刷新率
- 增加 x 轴、z 轴旋转，让立方体旋转更立体
- 加上顶点绘制，把 `point()` 函数接回主流程
- 增加相机距离，避免点太靠近 `z = 0` 时投影变得过大
- 给边添加深度排序或颜色变化，观察更明显的空间关系
