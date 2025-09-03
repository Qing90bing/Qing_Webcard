# 一言 (Hitokoto) 功能模块

## 目录概述

本模块负责实现“一言”功能，即在主界面的卡片上显示一句从公共API获取的、富有哲理或趣味的句子。

它包含了获取“一言”数据和管理其相关用户设置的全部逻辑。

---

## 文件详解

### `hitokoto.js` - “一言”核心逻辑

#### 职责

这是“一言”功能的主文件，它的核心职责是：

1.  **获取数据**: 通过 `fetch` 函数调用 `v1.hitokoto.cn` 的API来异步获取一句“一言”。
2.  **处理设置**: 如果用户在设置中选择了“自定义”模式，它会根据用户选择的分类，动态地将分类参数拼接到API请求的URL上。
3.  **更新显示**: 将获取到的句子内容和出处，更新到主界面卡片的对应DOM元素上。
4.  **刷新交互**: 为卡片添加点击事件，允许用户通过点击来刷新“一言”。同时内置了一个简单的防抖（debounce）标志，以防止用户在短时间内过快地连续点击，从而发起不必要的网络请求。

### `hitokoto-settings.js` - “一言”设置界面

#### 职责

此文件专门管理在“设置”面板中与“一言”功能相关的所有UI交互和逻辑。其职责包括：

1.  **模式切换**: 处理“默认模式”与“自定义模式”两个单选按钮的切换逻辑。
2.  **分类选择**: 当用户选择“自定义”模式时，管理下方所有句子分类的复选框（Checkbox）的交互，包括全选/全不选以及至少保留一个分类的验证逻辑。
3.  **保存设置**: 当用户点击“保存”按钮时，收集当前选中的分类，更新全局的 `appSettings` 对象，并调用 `saveSettings()` 将其持久化。
4.  **通信**: 在设置保存后，主动调用 `hitokoto.js` 模块暴露的刷新函数，让用户的更改能立刻生效。

---

## > 给初学者的小贴士：模块之间如何“对话”？

`hitokoto` 模块是学习模块化JavaScript中“模块间通信”的一个绝佳例子。我们有两个文件，`hitokoto.js` (核心逻辑) 和 `hitokoto-settings.js` (设置UI)，设置UI需要在保存后，通知核心逻辑去刷新一次。它是怎么做到的呢？

答案就在 `main.js` 这个“总指挥”里。

**实现流程：**

1.  **`hitokoto.js` 提供一个“遥控器”**:
    在 `hitokoto.js` 的初始化函数 `initializeHitokoto` 的最后，它 `return` 了一个对象，这个对象里包含了它内部的 `fetchHitokoto` 函数。就像给外部提供了一个可以按的“刷新按钮”。

    **`hitokoto.js` 伪代码:**
    ```javascript
    export function initializeHitokoto(settings) {
        // ...各种内部逻辑...

        async function fetchHitokoto() {
            // ...获取和显示一言的代码...
        }

        // 返回一个包含了内部函数的对象
        return {
            fetchHitokoto: fetchHitokoto
        };
    }
    ```

2.  **`main.js` 进行“接线”**:
    在 `main.js` 中，它首先初始化 `hitokoto.js` 并把返回的“遥控器”存起来。然后，在初始化 `hitokoto-settings.js` 时，把这个“遥控器”当作参数传进去。

    **`main.js` 伪代码:**
    ```javascript
    // ...导入...
    import { initializeHitokoto } from './components/features/hitokoto/hitokoto.js';
    import { initializeHitokotoSettings } from './components/features/hitokoto/hitokoto-settings.js';

    // ...在 DOMContentLoaded 事件中...

    // 1. 初始化核心模块，并拿到它的“遥控器”
    const hitokotoModule = initializeHitokoto(appSettings);

    // 2. 初始化设置模块，并把“遥控器”交给它
    initializeHitokotoSettings(hitokotoModule);
    ```

3.  **`hitokoto-settings.js` 使用“遥控器”**:
    `hitokoto-settings.js` 在它的初始化函数中接收了这个 `hitokotoModule` 对象。现在，当用户点击保存按钮时，它就可以随时调用 `hitokotoModule.fetchHitokoto()` 来命令核心逻辑模块执行刷新操作了。

这种由一个模块（`hitokoto.js`）暴露接口，由另一个模块（`main.js`）进行协调，再将接口传递给第三个模块（`hitokoto-settings.js`）使用的模式，是一种非常常见且有效的解耦方法，也叫做**依赖注入**（Dependency Injection）的简化形式。
