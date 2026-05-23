import { defineConfig } from 'vite'
import UniPlugin from '@dcloudio/vite-plugin-uni'

// 兼容不同版本的导出结构：某些版本 default 导出是 { default: fn } 嵌套
const uni = (UniPlugin as any).default || UniPlugin

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
