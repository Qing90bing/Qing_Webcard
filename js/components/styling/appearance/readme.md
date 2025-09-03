# 外观设置模块 (Appearance Settings)

## 目录概述

本模块负责管理应用中所有与“外观”相关的可定制项，特别是卡片的“毛玻璃效果”（Glassmorphism）。

它包含了启用/禁用毛玻璃效果、调整卡片圆角大小以及调整卡片背景模糊程度的全部逻辑。

---

## 文件详解

### `appearance.js` - 外观设置与应用

#### 职责

由于本模块功能相对内聚，所有逻辑都包含在这一个文件中。其核心职责是：

1.  **UI 事件监听**:
    -   监听设置面板中“启用毛玻璃效果”的开关 (`toggle`) 的状态变化。
    -   监听“卡片圆角”和“背景模糊”两个滑块 (`slider`) 的拖动事件。

2.  **设置管理**:
    -   当用户与上述控件交互时，实时地将新的值更新到全局的 `appSettings` 对象中。
    -   在用户完成操作（例如，释放滑块）后，调用 `saveSettings()` 函数将更改持久化到 `localStorage`。

3.  **应用样式**:
    -   包含 `applyGlassEffect()` 和 `applyCardSettings()` 两个函数。
    -   这些函数负责将 `appSettings` 中的设置值，转化为页面上实际的视觉变化。

---

## 技术实现细节

### 通过 CSS 自定义属性 (CSS Variables) 解耦

本模块是展示现代CSS与JavaScript交互模式的绝佳范例。它并没有用JavaScript去粗暴地直接修改大量元素的 `style` 属性，而是巧妙地利用了 **CSS 自定义属性（也称 CSS 变量）**。

**实现模式：**

1.  **JavaScript 只负责“声明”**: `applyCardSettings` 函数的唯一工作，就是在文档的根元素 (`<html>`) 上设置几个CSS变量的值。

    **代码片段 (`appearance.js`):**
    ```javascript
    export function applyCardSettings() {
        const { cardBorderRadius, cardBlurAmount } = appSettings.appearance;
        // 在 <html> 标签上设置 CSS 变量
        document.documentElement.style.setProperty('--card-border-radius', `${cardBorderRadius}px`);
        document.documentElement.style.setProperty('--card-backdrop-blur', `${cardBlurAmount}px`);
    }
    ```

2.  **CSS 负责“使用”**: 在项目的CSS样式表中，所有需要这些动态值的地方，都通过 `var()` 函数来使用这些变量。

    **CSS 伪代码:**
    ```css
    .card {
        border-radius: var(--card-border-radius);
        backdrop-filter: blur(var(--card-backdrop-blur));
    }
    ```

**这样做的好处（解耦）:**
-   **职责清晰**: JavaScript 的任务只是更新变量，它不需要知道具体哪个元素的哪个样式会用到这个变量。
-   **易于维护**: 如果未来需要让更多元素也拥有相同的圆角，我们只需要在CSS中为新元素添加 `border-radius: var(--card-border-radius);` 即可，完全无需改动JavaScript代码。
-   **性能更优**: 浏览器处理CSS变量的变更通常比JavaScript逐一修改大量DOM元素的样式要更高效。

### 滑块进度高亮技巧

标准的 HTML `<input type="range">` 滑块本身不支持显示填充进度（即滑块左侧有一个颜色，右侧是另一种颜色）。`updateSliderProgress` 函数通过一个纯CSS的技巧实现了这个效果。

它计算出滑块当前值在其总范围内的百分比，然后将这个百分比应用到滑块轨道的 `background-size` 属性上。结合在CSS中定义的 `linear-gradient` 背景，就实现了动态的、双色的滑块轨道，极大地提升了UI的清晰度和美观度。
