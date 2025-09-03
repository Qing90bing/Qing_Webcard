# CSS 模块结构说明

欢迎来到本项目的 CSS 模块！本文档旨在帮助开发者，特别是初学者，快速理解本项目 CSS 代码的组织结构、设计原则和修改方法。

## 核心设计思想

本项目的 CSS 遵循模块化和关注点分离的原则。我们将不同功能的样式拆分到独立的文件夹和文件中，以便于管理、复用和维护。所有模块最终通过主样式文件 `style.css` 按特定顺序导入，以确保样式的正确层叠和覆盖。

## 文件与目录结构

`css` 目录下的结构如下：

```
css/
├── style.css             # 主样式文件，负责导入所有其他CSS模块
├── readme.md             # (本文档) CSS模块的整体说明
|
├── animations/           # 存放全局动画效果 (@keyframes 和应用类)
│   ├── animations.css
│   └── readme.md
|
├── base/                 # 存放项目的基础样式
│   ├── base.css          # 全局 HTML 标签的基础样式 (如 a, p, body)
│   ├── variables.css     # 全局 CSS 变量 (非主题相关的，如圆角大小)
│   └── readme.md
|
├── components/           # 存放可复用的UI组件样式
│   ├── buttons.css
│   ├── cards.css
│   ├── forms.css
│   ├── ... (其他组件)
│   └── readme.md
|
├── layout/               # 存放页面主布局结构样式
│   ├── layout.css
│   └── readme.md
|
├── pages/                # 存放特定页面的专属样式
│   ├── main-content.css
│   ├── settings.css
│   └── readme.md
|
├── themes/               # 存放颜色主题
│   ├── dark.css          # 暗色主题
│   ├── light.css         # 亮色主题
│   ├── new-year.css      # 新年主题
│   └── readme.md
|
└── utils/                # 存放通用工具类
    ├── utils.css
    └── readme.md
```

## 各目录详解

### `style.css`
这是唯一的CSS入口文件。它不包含具体的样式规则，而是使用 `@import` 规则来组织和加载其他所有CSS文件。**导入顺序至关重要**，因为它决定了样式的优先级。当前的顺序为：
1.  **Base**: 基础变量和样式
2.  **Layout**: 页面布局
3.  **Animations**: 动画效果
4.  **Components**: UI组件
5.  **Pages**: 特定页面样式
6.  **Utils**: 工具类
7.  **Themes**: 主题（最后加载以覆盖颜色）

### `base/`
存放项目最底层的样式规则。
-   `variables.css`: 定义全局的设计“令牌”（Design Tokens），如 `--card-border-radius`。这些是独立于颜色主题的通用变量。
-   `base.css`: 为基本的HTML元素（如 `body`, `h1`, `p`, `a` 等）提供一个统一的、跨浏览器一致的初始样式。

### `layout/`
定义网站的主要宏观布局，例如页面的整体网格结构、头部、尾部、侧边栏等容器的排列方式。

### `animations/`
包含所有可复用的 `@keyframes` 动画定义和对应的CSS类。其他开发者可以直接通过添加类名（如 `.bounce-in`）来使用这些预设的动画效果。

### `components/`
这是项目的核心UI库。每个文件对应一个可复用的界面组件，如按钮 (`buttons.css`)、卡片 (`cards.css`)、模态框 (`modals.css`) 等。这里的样式应该是独立的、可移植的。

### `pages/`
如果某个样式仅适用于一个特定的页面（例如，“用户设置”页面的特殊布局），则应将其放在这里。这可以避免污染全局组件样式。

### `themes/`
定义了网站的颜色方案。每个主题文件（如 `dark.css`, `light.css`）都包含一系列颜色变量。通过切换 `<body>` 标签上的 `theme-*` 类，可以轻松更换整个网站的主题。

### `utils/`
提供高优先级的、单一用途的“工具类”，例如 `.hidden` 用于隐藏元素。这些类可以快速地应用到任何元素上，通常带有 `!important` 以确保其效果。

## 如何查找和修改样式

-   **要修改一个按钮的样式？** -> 前往 `components/buttons.css`。
-   **要调整网站的整体圆角大小？** -> 前往 `base/variables.css`。
-   **要改变暗色模式下的链接颜色？** -> 前往 `themes/dark.css`。
-   **要添加一个新的UI组件？** -> 在 `components/` 目录下创建一个新的CSS文件，然后在 `style.css` 中正确的位置导入它。
-   **要添加一个只在“主页”使用的特殊样式？** -> 前往 `pages/main-content.css`。

遵循这个结构，可以帮助我们保持代码的整洁和可维护性。
