// canvas 的逻辑尺寸。
// index.ts 会再根据 devicePixelRatio 放大真实像素，避免高分屏模糊。
export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 800

// 手动控制帧率。
// 每帧的时间步长 dt = 1 / FPS，动画速度也依赖这个值。
export const FPS = 24

// 画面颜色。
// 背景是深色，立方体边线使用绿色，形成类似线框模型的效果。
export const BACKGROUND_COLOR = '#101010'
export const FOREGROUND_COLOR = '#50FF50'

// 立方体边线宽度。面填充颜色来自 CUBE_FACES，边线颜色来自 FOREGROUND_COLOR。
export const LINE_WIDTH = 2
