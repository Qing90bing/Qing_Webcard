# 资源文件夹：`audio`

本文件夹用于存放项目的所有音频文件。这些文件通常用于背景音乐、音效或与特定主题（如节日主题）相关联的听觉元素。

## 文件说明

### `Wishing_you_prosperity_Liu_Dehua.mp3`

- **用途**: 这是当前项目中唯一的音频文件，用作“新年主题”的背景音乐。
- **文件名**: 为了便于识别，文件名直接反映了歌曲内容（刘德华 - 恭喜发财）。

## 如何使用和修改

### 1. 引用位置

此音频文件首先在 `index.html` 中通过 `<audio>` 标签进行加载，然后在 `js/new-year-theme.js` 中进行逻辑控制（播放、暂停、循环等）。

**HTML 引用 (`index.html`):**
```html
...
<!-- [NEW] New Year Theme Audio & Controls -->
<audio id="new-year-audio" preload="auto" src="assets/audio/Wishing_you_prosperity_Liu_Dehua.mp3"></audio>
...
```
- `id="new-year-audio"`: 是 JavaScript 用来选取该元素的关键标识符。
- `src`: 指向音频文件的路径。

**JavaScript 控制 (`js/new-year-theme.js`):**

JavaScript 文件负责在新年主题激活时，控制音乐的播放、暂停以及实现无缝循环。
```javascript
// ...
// 定义音乐循环的起止时间（单位：秒）
const NY_MUSIC_LOOP_START = 85.16; // 歌曲的 1分25秒16
const NY_MUSIC_LOOP_END = 173.20;   // 歌曲的 2分53秒20

// ...

// 监听音乐播放的 'timeupdate' 事件以实现循环
newYearAudio.addEventListener('timeupdate', () => {
    if (newYearAudio.paused) return;

    // 当音乐播放到循环结束点时，自动跳回循环开始点
    if (newYearAudio.currentTime >= NY_MUSIC_LOOP_END) {
        newYearAudio.currentTime = NY_MUSIC_LOOP_START;
    }
});
// ...
```

### 2. 修改指南

你可以替换或修改此背景音乐。

#### 方案 A：替换同名文件 (最简单)

1.  准备好你的新 `.mp3` 音频文件。
2.  将其重命名为 `Wishing_you_prosperity_Liu_Dehua.mp3`。
3.  用你的新文件覆盖 `assets/audio/` 目录下的同名文件。

**注意**: 如果你的新音频文件时长与原文件不同，当前的循环逻辑可能不适用。你可能需要移除循环代码或根据下一节的指导调整循环时间点。

#### 方案 B：使用不同文件名或调整循环

如果你想使用新的音频文件（例如 `my-music.mp3`）并为其设置新的循环点：

1.  将你的新音频文件放入 `assets/audio/` 文件夹。
2.  **更新 HTML**: 打开 `index.html`，修改 `<audio>` 标签的 `src` 属性。
    ```html
    <!-- 修改前 -->
    <audio id="new-year-audio" preload="auto" src="assets/audio/Wishing_you_prosperity_Liu_Dehua.mp3"></audio>

    <!-- 修改后 -->
    <audio id="new-year-audio" preload="auto" src="assets/audio/my-music.mp3"></audio>
    ```
3.  **调整 JavaScript (可选)**:
    -   打开 `js/new-year-theme.js`。
    -   找到 `NY_MUSIC_LOOP_START` 和 `NY_MUSIC_LOOP_END` 这两个常量。
    -   根据你的新音乐，确定你希望的循环开始和结束时间点（以秒为单位）。
    -   更新这两个常量的值。

    ```javascript
    // 示例：假设新音乐想从第10秒循环到第60秒
    const NY_MUSIC_LOOP_START = 10.0;
    const NY_MUSIC_LOOP_END = 60.0;
    ```
    -   如果你**不希望**音乐循环播放，最简单的方法是直接删除或注释掉 `timeupdate` 事件的监听器。
    ```javascript
    /*
    // 删除或注释掉以下代码块来禁用循环
    newYearAudio.addEventListener('timeupdate', () => {
        // ...
    });
    */
    ```

4.  保存所有修改过的文件。
