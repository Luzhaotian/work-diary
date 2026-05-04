# 上班记 (Work Diary)

一个简洁实用的上下班打卡记录与工时统计应用，帮助你轻松管理工作时间。

## 功能特性

- **打卡记录** - 记录每日上下班时间，支持手动修改
- **请假管理** - 支持全天/半天请假标记
- **历史记录** - 查看历史打卡记录，支持按月筛选
- **日历视图** - 以日历形式直观展示每日打卡状态
- **工时统计** - 自动计算月度工时、出勤天数、平均工时等数据
- **中国工作日** - 自动识别中国法定节假日和调休工作日

## 技术栈

- **框架**: uni-app + Vue 3
- **语言**: TypeScript
- **样式**: SCSS
- **构建**: Vite
- **数据存储**: 本地存储 (uni.setStorageSync)

## 运行平台

- H5 (Web)
- 微信小程序

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

## 项目结构

```
src/
├── pages/
│   ├── index/       # 首页 - 打卡记录
│   ├── record/      # 历史记录
│   ├── calendar/    # 日历视图
│   └── stats/       # 工时统计
├── types/           # TypeScript 类型定义
├── utils/           # 工具函数
│   ├── storage.ts   # 本地数据存储
│   ├── time.ts      # 时间计算工具
│   └── workday.ts   # 工作日判断
├── styles/          # 全局样式
└── static/          # 静态资源
```

## 许可证

MIT
