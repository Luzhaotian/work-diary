# 上班记 (Work Diary)

一个简洁实用的上下班打卡记录与工时统计应用，帮助你轻松管理工作时间。

## 功能特性

- **打卡记录** - 记录每日上下班时间，支持手动修改
- **请假管理** - 支持全天/半天请假标记，可配置是否展示请假按钮
- **历史记录** - 查看历史打卡记录，支持按月筛选、导出为文件或复制文本
- **日历视图** - 以日历形式直观展示每日打卡状态
- **工时统计** - 自动计算月度工时、出勤天数、平均工时等数据，支持多时间范围切换
- **中国工作日** - 可配置双休/单休（休周六或休周日）/大小周/无休，以及是否遵循法定节假日与调休
- **首次引导** - 半透明蒙层指引至「设置 → 日历设置」，不改动任何配置
- **个性设置** - 支持按钮设置、日历设置、午休扣除等个性化配置

## 技术栈

- **框架**: uni-app + Vue 3
- **语言**: TypeScript
- **样式**: SCSS
- **构建**: Vite
- **数据存储**: 本地存储 (uni.setStorageSync)

## 运行平台

- H5 (Web)
- 微信小程序

## 体验小程序

微信扫码即可体验「打卡办公」：

<p align="center">
  <img src="docs/miniprogram-qrcode.jpg" alt="打卡办公微信小程序码" width="280" />
</p>

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# H5 开发
npm run dev:h5

# 微信小程序开发
npm run dev:mp-weixin
```

### 构建打包

```bash
# 构建 H5
npm run build:h5

# 构建微信小程序
npm run build:mp-weixin
```

### 类型检查

```bash
npm run type-check
```

### 提交校验

安装依赖后会通过 `husky` 自动挂上 Git hooks。每次 `git commit` 前会：

1. 对暂存的 `.vue` / `.ts` / `.js` 等文件跑 `eslint --fix`
2. 执行 `npm run type-check`（`vue-tsc`）

任一环节失败则中止提交。

## 项目结构

```
src/
├── pages/
│   ├── index/       # 首页 - 打卡记录（tabBar）
│   ├── record/      # 历史记录（tabBar，右下角 FAB 进入工时统计）
│   ├── calendar/    # 日历视图（tabBar）
│   ├── stats/       # 工时统计（非 tabBar，从历史页 FAB 进入）
│   └── settings/    # 设置（tabBar）
│       ├── components/  # 设置子组件
│       │   ├── LeaveSetting.vue     # 请假功能设置
│       │   ├── CalendarSetting.vue  # 日历设置（休息制度 / 法定节假日）
│       │   └── HoursSetting.vue     # 午休扣除设置
│       ├── detail.vue       # 设置详情页（按 ?type= 渲染对应子组件）
│       └── settings.vue     # 设置主页
├── components/      # 公共组件
│   ├── ClockDisplay.vue   # 时钟显示
│   ├── ClockEditForm.vue  # 打卡编辑表单（首页/历史/日历共用）
│   └── GuideOverlay.vue   # 首次引导蒙层
├── composables/     # 组合式函数
│   └── useClockForm.ts    # 打卡表单状态与事件逻辑
├── types/           # TypeScript 类型定义
│   ├── clock.ts     # ClockRecord / MonthlyStats / ClockFormController
│   └── event.ts     # uni-app 事件类型
├── utils/           # 工具函数
│   ├── storage.ts   # 本地数据存储（记录 + 各项设置，含模块级缓存）
│   ├── time.ts      # 时间/工时计算
│   ├── date.ts      # 日期工具（本地时区安全解析）
│   ├── stats.ts     # 月度统计计算
│   ├── workday.ts   # 工作日判断（休息制度 × 法定节假日）
│   └── theme.ts     # 主题色常量（组件属性/JS 用，与 $blue 同源）
├── styles/          # 全局样式
│   ├── variables.scss  # 样式变量
│   └── settings.scss   # 设置页共享样式（mixin）
└── static/          # 静态资源
    └── tabs/        # tabBar 图标（4 图标 × 常态/激活态 = 8 张 PNG）
```

tabBar 图标由 `scripts/generate-tab-icons.py` 程序化生成（Pillow 超采样绘制），
配色取自 `pages.json` 的 `color` / `selectedColor`。改主题色后重跑该脚本即可重新生成：

```bash
python3 scripts/generate-tab-icons.py
```

## 许可证

MIT
