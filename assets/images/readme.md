# 资源文件夹：`images`

本文件夹用于存放项目的所有图像文件。这些文件主要用于背景、卡片装饰或其他视觉元素。

## 文件说明

### `new_year_bg.svg`

- **用途**: 这是“新年主题”的专用背景图片。当新年主题被激活时，这张图片会作为页面的背景显示。
- **格式**: SVG 格式确保了背景在不同尺寸的屏幕上都能保持高质量的显示效果。

## 如何使用和修改

### 1. 引用位置

此背景图片并非在 CSS 中直接引用，而是由 JavaScript (`js/new-year-theme.js`) 动态加载。这种方式使得主题的切换更加灵活。

**JavaScript 控制 (`js/new-year-theme.js`):**

```javascript
// ...
export function applyNewYearMode() {
    // ...
    const shouldBeActive = isThemeAvailable && isThemeEnabledByUser;

    if (shouldBeActive) {
        // ...
        if (!isCurrentlyActive) {
            // 当主题需要被激活时
            body.classList.add('new-year-active');
            if (backgroundFaderInstance) {
                // 调用背景淡入淡出模块，更新背景图
                backgroundFaderInstance.update('assets/images/new_year_bg.svg', true);
            }
        }
    } else {
        // ...
    }
}
// ...
```

### 2. 修改指南

你可以很方便地替换当前的背景图片。

1.  准备好你的新背景图片（推荐使用 SVG 格式，但 `.jpg`, `.png` 等也可以）。
2.  将新图片放入 `assets/images/` 文件夹。
3.  **如果新图片与原文件同名 (`new_year_bg.svg`)**: 直接覆盖原文件即可，无需修改代码。
4.  **如果新图片使用不同文件名 (例如 `my_background.jpg`)**:
    -   打开 `js/new-year-theme.js` 文件。
    -   找到 `backgroundFaderInstance.update(...)` 这一行。
    -   将其中的路径修改为你的新图片路径。
    ```javascript
    // 修改前
    backgroundFaderInstance.update('assets/images/new_year_bg.svg', true);

    // 修改后
    backgroundFaderInstance.update('assets/images/my_background.jpg', true);
    ```
5.  保存文件即可。

---

## 如何扩展：添加一个全新的节日主题

本项目的设计允许轻松扩展新的季节性或节日性主题。下面以添加一个“圣诞节主题”为例，讲解完整的扩展步骤。

### 步骤 1：准备资源

1.  **图片**: 准备一张圣诞主题的背景图，例如 `christmas_bg.jpg`，并将其放入 `assets/images/` 文件夹。
2.  **音频 (可选)**: 如果需要背景音乐，准备一个音频文件，例如 `jingle_bells.mp3`，并将其放入 `assets/audio/` 文件夹。

### 步骤 2：定义主题激活时间

你需要定义一个函数来判断当前日期是否属于圣诞节期间。

1.  打开 `js/utils.js` 文件。
2.  参考 `isNewYearPeriod()` 函数的实现，添加一个 `isChristmasPeriod()` 函数。公历日期判断比农历更简单。

    ```javascript
    // 在 js/utils.js 中添加新函数

    export function isChristmasPeriod() {
        const today = new Date();
        const month = today.getMonth() + 1; // getMonth() 返回 0-11，所以 +1
        const day = today.getDate();

        // 示例：定义圣诞主题在12月24日至12月26日激活
        if (month === 12 && day >= 24 && day <= 26) {
            return true;
        }

        return false;
    }
    ```

### 步骤 3：创建主题逻辑

最简单的方式是复制并修改现有的新年主题逻辑。

1.  **复制文件**: 将 `js/new-year-theme.js` 复制一份，重命名为 `js/christmas-theme.js`。
2.  **修改新文件 (`js/christmas-theme.js`)**:
    -   **引入新的判断函数**:
        ```javascript
        // 修改前
        import { isNewYearPeriod } from './utils.js';
        // 修改后
        import { isChristmasPeriod } from './utils.js'; // <-- 修改这里
        ```
    -   **修改函数名**: 将所有 `NewYear` 相关的大小写函数/变量名改为 `Christmas`。例如，`applyNewYearMode` -> `applyChristmasMode`。
    -   **更新资源路径**: 修改 `update` 函数中的图片路径和（如果需要）`audio` 标签中的音频路径。
    -   **调整逻辑**: 确保所有判断条件都使用 `isChristmasPeriod()`。

    **修改后的 `js/christmas-theme.js` (部分示例):**
    ```javascript
    import { appSettings, saveSettings } from './settings.js';
    import { isChristmasPeriod } from './utils.js'; // <-- 已修改
    import { applyCurrentBackground } from './background.js';

    // ... (如果需要，修改音乐循环逻辑)

    export function applyChristmasMode() { // <-- 已修改
        // ...
        const isThemeAvailable = isChristmasPeriod() || appSettings.developer.forceChristmasTheme; // <-- 已修改
        // ...
        if (shouldBeActive) {
            if (!isCurrentlyActive) {
                body.classList.add('christmas-active'); // <-- 建议为新主题创建新的CSS类
                if (backgroundFaderInstance) {
                    backgroundFaderInstance.update('assets/images/christmas_bg.jpg', true); // <-- 已修改
                }
            }
        }
        // ...
    }

    export function initializeChristmasTheme(backgroundFader) { // <-- 已修改
        // ... (确保这里引用的元素ID是为圣诞主题准备的)
    }
    ```

### 步骤 4：创建主题 CSS

1.  在 `css/themes/` 目录下创建一个新的 CSS 文件，例如 `christmas.css`。
2.  参考 `new-year.css`，为 `.christmas-active` 类定义一套全新的颜色变量和样式。

### 步骤 5：集成到主程序

最后，你需要让主程序知道这个新主题的存在。

1.  打开 `js/main.js`。
2.  **引入新模块**:
    ```javascript
    // 在文件顶部引入
    import { initializeChristmasTheme, applyChristmasMode } from './christmas-theme.js';
    ```
3.  **初始化新主题**: 在 `document.addEventListener('DOMContentLoaded', ...)` 的适当位置调用初始化函数。
    ```javascript
    // ...
    initializeNewYearTheme(backgroundFader);
    initializeChristmasTheme(backgroundFader); // <-- 添加新主题的初始化
    // ...
    ```
4.  **在设置中添加开关 (可选但推荐)**:
    -   修改 `index.html`，在开发者选项中添加一个“强制开启圣诞主题”的开关。
    -   修改 `js/settings.js`，在 `defaultSettings` 中为新主题添加配置项。
    -   修改 `js/christmas-theme.js`，使其能响应这个新开关。

完成以上步骤后，你的新主题就完全集成到项目中了。
