/**
 * @file immersive-mode.js
 * @description
 * 本文件负责管理与“沉浸模式”相关的特定功能。
 * 目前，它主要处理沉浸模式下时钟冒号是否闪烁这一项设置。
 *
 * @module components/system/immersive/immersive-mode
 */
import { appSettings, saveSettings } from '../../../core/settings.js';

/**
 * @description 根据用户的设置，应用或移除时钟冒号的闪烁效果。
 * 实现方式是通过在 `<body>` 元素上切换一个CSS类。具体的动画效果在CSS文件中定义。
 */
function applyBlinkingEffect() {
    document.body.classList.toggle('immersive-blink-enabled', appSettings.immersiveBlinkingColon);
}

/**
 * @description 初始化沉浸模式的功能。
 * 主要工作是为设置面板中的“冒号闪烁”开关绑定事件监听器，并在页面加载时应用初始设置。
 */
export function initializeImmersiveMode() {
    const immersiveBlinkToggle = document.getElementById('immersive-blink-toggle');
    if (immersiveBlinkToggle) {
        // 1. 根据已加载的设置，设置开关的初始状态
        immersiveBlinkToggle.checked = appSettings.immersiveBlinkingColon;

        // 2. 添加监听器，当用户点击开关时，更新设置、保存并应用效果
        immersiveBlinkToggle.addEventListener('change', () => {
            appSettings.immersiveBlinkingColon = immersiveBlinkToggle.checked;
            saveSettings();
            applyBlinkingEffect();
        });
    }

    // 3. 在页面初次加载时，应用一次效果，以确保显示正确的状态
    applyBlinkingEffect();
}
