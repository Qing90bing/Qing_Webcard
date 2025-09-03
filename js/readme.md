# JavaScript 源码目录总览

欢迎来到本项目的 JavaScript 源码目录！本文档旨在帮助开发者和初学者快速理解 `js` 目录下的代码结构，并能轻松地找到特定功能对应的源代码。

## 目录结构

本项目的 JavaScript 代码遵循模块化的开发思想，主要分为两大核心目录：

-   `core/`
    -   存放应用的核心驱动逻辑与入口文件。这里的代码是整个应用运行的基石。
-   `components/`
    -   存放应用的所有功能和UI组件。这是一个庞大的目录，其下又根据“功能类型”对组件进行了细分，例如 `features` (核心功能)、`styling` (样式控制)、`ui` (界面元素) 等。

---

## 功能查找表 (Feature-to-File Finder)

下表将项目的主要功能点映射到了实现它们的具体文件或目录，以便您快速查找。

### 核心与初始化 (Core & Initialization)

| 功能描述             | 主要实现位置                               |
| -------------------- | ------------------------------------------ |
| **应用总启动流程**   | `js/core/main.js`                          |
| **全局设置管理**     | `js/core/settings.js`                      |
| **重置所有设置**     | `js/components/system/settings/reset-settings.js` |

### 主要UI视图与功能 (Main UI Views & Features)

| 功能描述                     | 主要实现位置                                    |
| ---------------------------- | ----------------------------------------------- |
| **时钟与日期显示**           | `js/components/ui/clock/`                       |
| **全屏沉浸式时钟**           | `js/components/ui/clock/clock.js` (交互) <br> `js/components/system/immersive/` (设置) |
| **每日问候语**               | `js/components/ui/greeting/`                    |
| **节假日倒计时与列表**       | `js/components/ui/holiday/`                     |
| **"今日人品"小游戏**         | `js/components/features/luck-game/`             |
| **"一言" (Hitokoto) 功能**   | `js/components/features/hitokoto/`              |
| **"时间胶囊" (年度/月度进度)** | `js/components/features/time-capsule/`          |
| **主视图切换 (GitHub/天气)** | `js/components/system/view-manager/`            |
| **GitHub 贡献图与提交历史**  | `js/components/features/github/`                |
| **天气信息显示**             | `js/components/features/weather/`               |
| **右侧栏卡片管理与切换**     | `js/components/system/card/card-manager.js`     |
| **链接卡片轮播/滑块**        | `js/components/system/card/card-slider.js`      |
| **"小破站运行时间"计数器**   | `js/components/ui/site-runtime/`                |

### 样式与主题 (Styling & Theming)

| 功能描述                         | 主要实现位置                             |
| -------------------------------- | ---------------------------------------- |
| **主题切换 (日间/夜间/系统)**    | `js/components/styling/theme/`           |
| **背景图片设置 (默认/Bing/自定义)** | `js/components/styling/background/`      |
| **新年特殊主题 (背景与音乐)**    | `js/components/styling/new-year/`        |
| **外观设置 (毛玻璃/圆角/模糊)**  | `js/components/styling/appearance/`      |

### 系统与通用功能 (System & Common Features)

| 功能描述                   | 主要实现位置                               |
| -------------------------- | ------------------------------------------ |
| **设置面板 (总)**          | `js/components/system/settings/`           |
| **全局 Esc 键处理**        | `js/components/common/escape-handler.js`   |
| **全局工具提示 (Tooltip)**   | `js/components/common/tooltip.js`          |
| **开发者模式 (彩蛋与设置)**  | `js/components/developer/`                 |
