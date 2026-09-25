# 开发文档

## 开发环境

### 提交校验

`npm install` 后 husky 会注册 `.husky/pre-commit`：

1. `lint-staged`：对暂存的 `.vue` / `.ts` / `.js` 等执行 `eslint --fix`
2. `npm run type-check`：全量 `vue-tsc --noEmit`

校验失败时 commit 会被拦截。跳过校验需自行使用 `git commit --no-verify`（不推荐）。

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

### 日历设置

- **休息制度**：双休 / 单休（休周六或休周日）/ 大小周（自选参考周为大周或小周，隔周交替）/ 无休
- **法定节假日**：开启则按中国法定节假日与调休；关闭则为「无法定节假日」，仅按休息制度判断
- 影响日历着色、加班标记，以及统计中的应出勤天数

### 首次引导

- 新用户首次进入首页时显示半透明蒙层，提示去底部「设置」配置日历
- 「去设置」会跳到设置页并高亮「日历设置」；「知道了」仅关闭蒙层
- **不会写入或修改**任何日历/午休等配置，真正改设置仍由用户在设置页操作
- 已有打卡记录的老用户升级后自动跳过蒙层

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
