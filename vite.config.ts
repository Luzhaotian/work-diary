import { defineConfig, type PluginOption } from 'vite'
import UniPlugin from '@dcloudio/vite-plugin-uni'

// 兼容不同版本的导出结构：某些版本 default 导出是 { default: fn } 嵌套。
// 用精确类型而非 any，避免掩盖真正的类型错误（此前是全项目唯一的 lint 警告）。
type UniFactory = () => PluginOption | PluginOption[]
const maybeNested = UniPlugin as unknown as UniFactory | { default: UniFactory }
const uni: UniFactory = 'default' in maybeNested ? maybeNested.default : maybeNested

export default defineConfig({
  plugins: [uni()],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
})
