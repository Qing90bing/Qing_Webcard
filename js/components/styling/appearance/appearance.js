/**
 * @file appearance.js
 * @description
 * 本文件负责管理应用中所有与“外观”相关的设置，包括毛玻璃效果、卡片圆角和模糊程度。
 * 它将UI更新、样式应用和事件监听逻辑清晰地分离开来。
 *
 * @module components/styling/appearance
 */

import { appSettings, saveSettings } from '../../../core/settings.js';

// --- 辅助函数 ---

/**
 * @description 更新滑块（slider）的背景填充进度，以提供视觉反馈。
 * @param {HTMLInputElement} slider - 需要更新的滑块元素。
 */
function updateSliderProgress(slider) {
    const min = slider.min;
    const max = slider.max;
    const value = slider.value;
    const percentage = ((value - min) / (max - min)) * 100;
    slider.style.backgroundSize = `${percentage}% 100%`;
}

// --- UI 更新函数 ---

/**
 * @description 根据 `appSettings` 中的值，更新外观设置面板中所有控件的显示状态。
 * 这个函数通常在加载设置后或打开设置面板时调用。
 */
export function updateAppearanceSettingsUI() {
    const { glassEffect, cardBorderRadius, cardBlurAmount } = appSettings.appearance;

    const glassEffectToggle = document.getElementById('glass-effect-toggle');
    if (glassEffectToggle) {
        glassEffectToggle.checked = glassEffect;
    }

    const radiusSlider = document.getElementById('card-border-radius-slider');
    const radiusValue = document.getElementById('card-border-radius-value');
    if (radiusSlider && radiusValue) {
        radiusSlider.value = cardBorderRadius;
        radiusValue.textContent = `${cardBorderRadius}px`;
        updateSliderProgress(radiusSlider);
    }

    const blurSlider = document.getElementById('card-blur-amount-slider');
    const blurValue = document.getElementById('card-blur-amount-value');
    if (blurSlider && blurValue) {
        blurSlider.value = cardBlurAmount;
        blurValue.textContent = `${cardBlurAmount}px`;
        updateSliderProgress(blurSlider);
    }
}

// --- 样式应用函数 ---

/**
 * @description 根据设置应用或移除毛玻璃效果。
 * 它通过切换body上的一个CSS类来控制全局样式，并同步更新模糊度滑块的禁用状态。
 */
export function applyGlassEffect() {
    document.body.classList.toggle('glass-effect-disabled', !appSettings.appearance.glassEffect);

    const blurSlider = document.getElementById('card-blur-amount-slider');
    const blurContainer = document.getElementById('blur-setting-container');
    if (blurSlider && blurContainer) {
        const isGlassEnabled = appSettings.appearance.glassEffect;
        blurSlider.disabled = !isGlassEnabled;
        blurContainer.classList.toggle('disabled', !isGlassEnabled);
    }
}

/**
 * @description 将卡片圆角和模糊度的设置值应用为CSS自定义属性（变量）。
 * 这种方法使得CSS可以动态地使用这些值，实现了JS与CSS的解耦。
 */
export function applyCardSettings() {
    const { cardBorderRadius, cardBlurAmount } = appSettings.appearance;
    document.documentElement.style.setProperty('--card-border-radius', `${cardBorderRadius}px`);
    document.documentElement.style.setProperty('--card-backdrop-blur', `${cardBlurAmount}px`);
}

// --- 事件监听器设置 ---

/**
 * @description 初始化外观设置面板的所有事件监听器。
 */
export function initializeAppearanceSettings() {
    // 毛玻璃效果开关
    const glassEffectToggle = document.getElementById('glass-effect-toggle');
    if (glassEffectToggle) {
        glassEffectToggle.addEventListener('change', () => {
            appSettings.appearance.glassEffect = glassEffectToggle.checked;
            saveSettings();
            applyGlassEffect();
        });
    }

    // 卡片圆角滑块
    const radiusSlider = document.getElementById('card-border-radius-slider');
    const radiusValue = document.getElementById('card-border-radius-value');
    if (radiusSlider && radiusValue) {
        // 'input'事件在拖动时实时触发，提供即时视觉反馈
        radiusSlider.addEventListener('input', (e) => {
            const newValue = e.target.value;
            radiusValue.textContent = `${newValue}px`;
            appSettings.appearance.cardBorderRadius = parseInt(newValue, 10);
            applyCardSettings();
            updateSliderProgress(e.target);
        });
        // 'change'事件在用户释放鼠标时触发，此时才保存设置，避免频繁写入localStorage
        radiusSlider.addEventListener('change', () => {
            saveSettings();
        });
    }

    // 卡片模糊度滑块
    const blurSlider = document.getElementById('card-blur-amount-slider');
    const blurValue = document.getElementById('card-blur-amount-value');
    if (blurSlider && blurValue) {
        blurSlider.addEventListener('input', (e) => {
            const newValue = e.target.value;
            blurValue.textContent = `${newValue}px`;
            appSettings.appearance.cardBlurAmount = parseInt(newValue, 10);
            applyCardSettings();
            updateSliderProgress(e.target);
        });
        blurSlider.addEventListener('change', () => {
            saveSettings();
        });
    }
}
