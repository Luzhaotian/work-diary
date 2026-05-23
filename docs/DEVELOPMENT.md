# 开发文档

## 开发环境

### HBuilderX

通过命令行启动 HBuilderX 并确保使用内置 Node：

```bash
env PATH="/Applications/HBuilderX.app/Contents/HBuilderX/plugins/node:$PATH" open -a HBuilderX
```

### 常见问题

#### vite.config.ts 编译报错 "uni is not a function"

`@dcloudio/vite-plugin-uni` 3.0 版本的 ESM 导出结构变为嵌套 `{ default: { default: fn } }`，需要在 vite.config.ts 中做兼容处理：

```ts
import UniPlugin from '@dcloudio/vite-plugin-uni'
const uni = (UniPlugin as any).default || UniPlugin
```

## 功能说明

### 请假功能

- 首页和日历页均支持请假开关和类型选择（全天/半天）
- 请假开关切换时自动保存到 storage
- 请假类型切换时也会同步更新 storage（不只是更新内存状态）
- 可在设置中全局控制是否展示请假按钮

### 历史记录导出

在历史记录页面点击导出按钮，支持两种方式：

1. **导出为文件** - 生成 CSV 文件，通过微信分享/打开文档方式保存
2. **复制文本** - 将当月记录以 TSV 格式复制到剪贴板，可直接粘贴到 Excel 或记事本

导出文本格式示例：

```
日期	上班	下班	工时	请假
2026-05-18	08:47	19:40	10.9h	
2026-05-19	--:--	--:--	0h	全天假
2026-05-15	09:00	18:00	9.0h	
```

### 工时统计

- 支持时间范围切换：近3月、近半年、近1年、近5年、全部
- 近3月/近半年：柱状图和月度明细按时间升序（旧→新）
- 近1年/近5年/全部：柱状图和月度明细按时间倒序（新→旧）
- 月度明细支持分页加载

### 月份导航栏

历史记录页面的月份导航栏使用 `position: sticky` 粘性定位，滚动时固定在顶部。
