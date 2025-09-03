# 新年特殊主题模块 (New Year Special Theme)

## 目录概述

本模块负责实现一个**限时的特殊主题**——新年主题。

当处于中国新年期间（通常是除夕到正月初十），或者由开发者在后台强制开启时，这个主题会自动激活。它会覆盖用户常规的背景设置，应用一个专属的节日背景，并添加背景音乐等独特的节日元素。

---

## 文件详解

### `new-year-theme.js` - 新年主题管理器

#### 职责

这个文件是新年主题的“总开关”和“管理器”，它负责与该主题相关的所有逻辑。

1.  **激活条件检查 (Activation Check)**:
    -   本模块的核心是一个名为 `applyNewYearMode` 的函数，它像一个状态机，根据一系列条件来决定是否应该激活新年主题。
    -   **主要条件有两个**:
        1.  **时间/强制条件**: 当前日期是否在新年期间内（这个判断由 `js/components/ui/holiday/calendar.js` 中的 `isNewYearPeriod()` 函数提供），**或者** 开发者是否在开发者模式中强制开启了新年主题。
        2.  **用户许可条件**: 用户是否在设置中启用了“新年节日背景”。
    -   只有当以上两个大条件**同时满足**时，新年主题才会被激活。

2.  **主题应用 (Theme Application)**:
    -   当主题被激活时，脚本会给 `<body>` 元素添加一个 `new-year-active` 的CSS类。这个类会触发在CSS文件中预定义好的样式，从而显示出特殊的新年背景。
    -   为了实现平滑过渡，它会调用从外部注入的 `backgroundFader` 实例，优雅地将背景切换为新年专属的SVG图像。

3.  **背景音乐控制 (Music Control)**:
    -   管理页面中 `<audio>` 元素的播放。它负责处理一个浮动的音乐播放/暂停按钮的显示和交互，并且实现了一个精巧的“无缝循环”逻辑（详见下文技术细节）。

4.  **UI 禁用 (UI Disabling)**:
    -   当新年主题处于激活状态时，为了避免用户设置的常规背景与新年背景冲突，脚本会自动禁用掉设置面板中的“背景设置”区域，给用户一个明确的视觉提示。

---

## > 技术实现细节：如何实现“无缝音频循环”？

在 `new-year-theme.js` 中，背景音乐并不是简单地从头到尾循环播放。它的需求是：**第一次播放时，包含一段完整的前奏；前奏结束后，只循环播放乐曲的主旋律部分。**

如果只是简单地设置 `<audio>` 元素的 `loop` 属性为 `true`，那每次都会连前奏一起循环，效果不佳。

**解决方案**: 脚本通过监听 `<audio>` 元素的 `timeupdate` 事件（该事件会在音频播放时持续触发），并结合一个标志位 `newYearMusicIntroPlayed` 来实现这个精巧的控制。

**实现逻辑：**

1.  **设置循环点**: 首先定义好音乐循环的开始时间点 (`LOOP_START`) 和结束时间点 (`LOOP_END`)。

2.  **监听 `timeupdate`**:
    -   在事件的回调函数中，首先检查音频是否正在播放。
    -   **判断前奏是否已播放**:
        -   如果 `newYearMusicIntroPlayed` 标志位是 `false`（意味着这是第一次播放）：
            -   就一直让音乐正常播放。
            -   当 `audio.currentTime`（当前播放时间）**超过**了 `LOOP_END` 时，说明前奏和第一遍主旋律已经放完。此时，立刻将 `newYearMusicIntroPlayed` 标志位设为 `true`，并将 `audio.currentTime` **强制跳回到** `LOOP_START`。
        -   如果 `newYearMusicIntroPlayed` 标志位是 `true`（意味着已经进入循环阶段）：
            -   就持续检查 `audio.currentTime` 是否超过了 `LOOP_END`。
            -   一旦超过，就立即将其再次跳回到 `LOOP_START`。

**代码片段示例:**
```javascript
let newYearMusicIntroPlayed = false;
const NY_MUSIC_LOOP_START = 85.16; // 循环开始秒数
const NY_MUSIC_LOOP_END = 173.20;  // 循环结束秒数

newYearAudio.addEventListener('timeupdate', () => {
    if (newYearAudio.paused) return;

    if (!newYearMusicIntroPlayed) { // 还没播完前奏
        if (newYearAudio.currentTime >= NY_MUSIC_LOOP_END) {
            newYearMusicIntroPlayed = true; // 标记前奏已结束
            newYearAudio.currentTime = NY_MUSIC_LOOP_START; // 跳回循环起点
        }
    } else { // 已经进入循环阶段
        if (newYearAudio.currentTime >= NY_MUSIC_LOOP_END) {
            newYearAudio.currentTime = NY_MUSIC_LOOP_START; // 无限循环
        }
    }
});
```

通过这个简单的标志位和时间判断，就实现了一个完美的、只在特定区间内无缝循环的音频播放器。
