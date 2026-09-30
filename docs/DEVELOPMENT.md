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
type UniFactory = () => PluginOption | PluginOption[]
const maybeNested = UniPlugin as unknown as UniFactory | { default: UniFactory }
const uni: UniFactory = 'default' in maybeNested ? maybeNested.default : maybeNested
```

用精确类型而非 `as any`，避免掩盖真实类型错误（这是全项目唯一的 lint 警告来源，已消除）。

## 功能说明

### 请假功能

- 首页和日历页均支持请假开关和类型选择（全天/半天）
- 请假开关切换时自动保存到 storage
- 请假类型切换时也会同步更新 storage（不只是更新内存状态）
- 可在设置中全局控制是否展示请假按钮
- **工时口径**：全天假不计工时；半天假当天若也打了卡，那几小时照常计入
  （半天假当天上了另外半天班）。列表、CSV 导出、复制文本、月度统计四处
  统一走 `utils/time.ts` 的 `effectiveHours`，避免各写一套判断导致口径不一致。

### 日历设置

- **休息制度**：双休 / 单休（休周六或休周日）/ 大小周（自选参考周为大周或小周，隔周交替）/ 无休
- **法定节假日**：开启则按中国法定节假日与调休；关闭则为「无法定节假日」，仅按休息制度判断
- 影响日历着色、加班标记，以及统计中的应出勤天数
- 依赖 `chinese-workday`，其内置节假日表为静态数据（当前覆盖 2010–2026）。
  超出覆盖范围的年份只能把周末当假日，法定节假日与调休识别不到，
  日历/统计对这类年份为近似结果，需等依赖更新数据表
- 各项设置的读取结果在 `utils/storage.ts` 做了模块级缓存：日历逐日、统计逐月
  调用工作日判断时不再重复触发同步 `getStorageSync`；写入时自动失效对应缓存

### 首次引导

- 新用户首次进入首页时显示半透明蒙层，提示去底部「设置」配置日历
- 「去设置」会跳到设置页并高亮「日历设置」；「知道了」仅关闭蒙层
- **不会写入或修改**任何日历/午休等配置，真正改设置仍由用户在设置页操作
- 已有打卡记录的老用户升级后自动跳过蒙层

### 历史记录导出

在历史记录页面点击导出按钮，支持两种方式：

1. **导出为文件** - 生成 CSV 文件（TSV 内容 + BOM，Excel 可直接识别中文）。
   微信小程序端走文件系统 + 分享/打开文档；H5 端用 Blob 触发浏览器下载
   （通过 `#ifdef MP-WEIXIN` 条件编译区分，两端产物各自只含自己的分支）
2. **复制文本** - 将当月记录以 TSV 格式复制到剪贴板，可直接粘贴到 Excel 或记事本

两种导出与列表展示使用同一工时口径（`effectiveHours`）：全天假遮时间、不计工时；
半天假保留真实打卡时间并计工时。

导出文本格式示例：

```
日期	上班	下班	工时	请假
2026-05-18	08:47	19:40	10.9h	
2026-05-19	--:--	--:--	0h	全天假
2026-05-15	09:00	18:00	9.0h	
```

### 工时统计

- 支持时间范围切换：近3月、近半年、近1年、近5年、全部
- 柱状图和月度明细统一按时间倒序（新→旧）
- 月度明细支持分页加载（每页 6 个月）
- **只展示有数据的月份**：所选区间内没有任何打卡/请假的空白月份会同时从
  明细、柱状图和汇总中过滤，避免「全部」范围下汇总数字被上百个空白月虚增
- 有数据的月份超过 60 个时，柱状图自动切换为按年聚合
- 计算走 `calcStatsForMonths` 批量接口：全量记录只读一次、按月分组，
  避免逐月全量 parse（此前「全部」范围一次渲染产生 6000+ 次同步 storage 读取）

### 数据一致性

- 同一天只允许一条记录：写入统一走 `upsertRecordByDate`（按日期查重合并），
  App 启动时还会执行一次 `dedupeRecordsByDate` 迁移，合并历史版本可能产生的重复记录
- 打卡写入的日期一律取操作当下的本地日期，应用跨零点常驻时不会把新的一天
  写进昨天的记录
- 首页/日历的「今天」「本月」始终取当下时间，不在 setup 里冻结快照

### 月份导航栏

历史记录页面的月份导航栏使用 `position: sticky` 粘性定位，滚动时固定在顶部。

## 共享代码

避免同一套逻辑/样式在多个页面各写一遍（一处改了另一处忘改就会口径不一致）：

- **`components/ClockEditForm.vue`** — 打卡编辑表单，首页、历史编辑弹窗、日历详情
  三处共用。状态仍由各页面持有的 `useClockForm()` 提供，通过 `form` prop 传入
- **`composables/useClockForm.ts`** — 表单状态与 uni-app 事件处理。
  约定：`clockIn` / `clockOut` 为空字符串表示「该项无数据」，**不用 09:00 / 18:00 兜底填充**，
  展示用的默认值由模板的 `|| DEFAULT_CLOCK_*` 负责。否则只打了上班卡的记录
  会在保存时被凭空补上默认下班时间、算出不存在的工时
- **`styles/settings.scss`** — 设置页共享样式，以 mixin 形式提供
  （`group-block` / `group-desc` / `cell-base` / `cell-nav` / `option-card`）。
  mixin 刻意拆细，各组件只 `@include` 模板真正用到的类，避免输出无用 CSS。
  各文件之间有差异的类（如 CalendarSetting 的 `.option` 带 `gap`）仍留在组件内
- **`utils/theme.ts`** — 主题色常量。SCSS 变量用不了组件属性（`color="..."`）
  和 JS 字符串（`confirmColor`），故单列一份与 `$blue` 同源的常量。
  `pages.json` 的 tabBar 配色是 JSON、无法 import，改主题色时需同步那里

### 命名空间说明

`@/styles/settings.scss` 不是 SCSS partial 约定（`_settings.scss`）——
uni-app 的自定义 resolver 按字面路径解析 `@use`，带下划线会解析失败。
与既有的 `variables.scss` 保持一致，均不加下划线。
