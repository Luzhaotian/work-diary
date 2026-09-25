# 首次日历引导页设计

日期：2026-09-25  
状态：待实现

## 目标

新用户首次打开应用时，用分步向导配置**日历休息制度**与**法定节假日**；可跳过；之后可在设置中重新打开引导。

## 非目标

- 不引导午休扣除、请假按钮等其他设置
- 不做功能介绍轮播（非营销 onboarding）
- 不改动现有日历计算逻辑（`workday.ts`）

## 方案

独立页面 `pages/guide/guide` + 本地标记 `guide_completed`（方案一）。

## 页面与路由

| 项 | 说明 |
| --- | --- |
| 路径 | `pages/guide/guide` |
| pages.json | 列为第一项，作为启动默认页；不进 tabBar |
| 导航 | 可用系统导航栏标题「初始设置」，或自定义顶栏；不展示返回首页的系统返回（首次） |

### 步骤

1. **休息制度**  
   - 选项：双休 / 单休 / 大小周 / 无休（`WEEKEND_MODE_OPTIONS`）  
   - 单休或大小周：展开单休日（休周六 / 休周日）  
   - 大小周：展开参考日期 + 参考周类型（大周/小周）；可选「本周设为大周/小周」快捷（与设置页行为一致，写入同一 storage）  
2. **法定节假日**  
   - 开关：遵循法定节假日（默认开，与现网一致）  
   - 文案与设置页一致

### 操作

| 操作 | 行为 |
| --- | --- |
| 下一步 | 步骤 1 → 2；步骤内选项即时写入 storage（与设置页一致，避免丢改） |
| 完成 | `setGuideCompleted(true)`，按来源跳转（见下） |
| 稍后再说 | 不强制改用户已点选项；若从未改过则保持默认双休 + 法定节假日开启；`setGuideCompleted(true)`，再跳转 |

### 来源与离开

| 来源 | 进入方式 | 完成/跳过后 |
| --- | --- | --- |
| 首次启动 | 启动落在引导页，或 `App.onLaunch` 发现未完成则 `reLaunch` 引导 | `reLaunch` → `pages/index/index` |
| 设置「重新配置日历」 | `navigateTo` `/pages/guide/guide?from=settings` | `navigateBack` 回设置；若栈异常则 `reLaunch` 设置页 |

## 存储

| Key / API | 说明 |
| --- | --- |
| 现有 calendar keys | `setWeekendMode`、`setSingleRestDay`、`setBiweeklyAnchorDate`、`setBiweeklyAnchorType`、`setUseHolidays` 等，引导与设置共用 |
| `guide_completed` | 新增 `getGuideCompleted()` / `setGuideCompleted(boolean)`；空/缺省视为未完成 |

启动守卫（`App.vue` `onLaunch`）：

- 若 `!getGuideCompleted()`，`reLaunch` 到引导页（避免仅依赖 pages 顺序，后续改顺序仍可靠）
- 若已完成且当前误入引导且无 `from=settings`，可 `reLaunch` 首页（可选，实现时二选一：允许已完成用户从设置进入即可）

## UI 与复用

- **不整页复用** `CalendarSetting.vue`（设置页结构与引导分步不同）
- 复用：`storage` 中选项常量与 getter/setter；视觉延续白卡片 + 勾选 + `$blue`，与现有设置一致
- 步骤指示：简单「1/2」「2/2」或圆点，不引入新设计系统

## 设置入口

在 `pages/settings/settings` 列表增加一项，例如「重新配置日历」，副标题可写「休息制度与法定节假日」，点击进入引导页并带 `from=settings`。

## 错误与边界

- 大小周未选参考日：进入大小周模式时若无存储值，用当天日期作为默认参考日（与现 `getBiweeklyAnchorDate` 行为一致）
- 微信小程序：`reLaunch` / `navigateTo` 路径带前导 `/`
- 引导页不出现在 tabBar；用户手势返回：首次完成前尽量留在引导（无首页栈）；从设置进入可用系统返回

## 测试要点

1. 清 storage 后冷启动 → 落在引导 → 配完进首页 → 再冷启动不再出现  
2. 跳过 → 进首页 → 日历按默认双休 + 法定节假日  
3. 设置 → 重新配置 → 改单休 → 完成回设置 → 日历文案与着色更新  
4. 大小周两步配置后，日历大小周与设置页一致  

## 实现范围（文件）

- 新增：`src/pages/guide/guide.vue`
- 修改：`src/pages.json`、`src/App.vue`、`src/utils/storage.ts`、`src/pages/settings/settings.vue`
- 文档：`docs/DEVELOPMENT.md`、`README.md` 各补一句功能说明
