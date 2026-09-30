/**
 * 主题色常量。
 *
 * SCSS 变量（styles/variables.scss 的 $blue）无法用在组件属性（color="..."）
 * 和 JS 字符串（confirmColor）里，此前 #2563EB 在 9 处硬编码，改主题色要全局搜。
 * 统一从这里取，保证与 $blue 同源。
 *
 * 注：pages.json 的 tabBar selectedColor 也是 #2563EB，但 JSON 无法 import，
 * 只能保留字面量，改主题色时需同步那里。
 */
export const PRIMARY_COLOR = '#2563EB'

/** uni.showModal / uni.showActionSheet 的确认按钮配色 */
export const CONFIRM_COLOR = PRIMARY_COLOR
