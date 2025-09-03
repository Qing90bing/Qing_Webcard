/**
 * @file settings-updater.js
 * @description
 * 本文件是设置面板的中央UI更新器。
 * 它的主要职责是调用从其他模块导入的各种UI更新函数，
 * 以确保整个设置面板的用户界面能够准确反映 `appSettings` 中的当前状态。
 * 这种集中式管理使得状态同步逻辑更清晰、更易于维护。
 *
 * @module components/system/settings/settings-updater
 */

import { appSettings } from '../../../core/settings.js';
import { isNewYearPeriod } from '../../ui/holiday/calendar.js';
import { updateBgSettingsUI } from '../../styling/background/background.js';
import { updateAppearanceSettingsUI } from '../../styling/appearance/appearance.js';
import { updateViewToggleUI } from '../view-manager/view-manager.js';

/**
 * @description 更新时间格式设置（12/24小时制）的UI。
 */
function updateTimeFormatUI() {
    const selectedFormat = appSettings.timeFormat;
    const radio = document.querySelector(`input[name="time-format"][value="${selectedFormat}"]`);
    if (radio) {
        radio.checked = true;
    }
}

/**
 * @description 更新“一言”设置（模式、分类）的UI。
 */
function updateHitokotoSettingsUI() {
    const { mode, categories } = appSettings.hitokoto;

    // 更新模式单选按钮
    const radio = document.querySelector(`input[name="hitokoto-mode"][value="${mode}"]`);
    if (radio) {
        radio.checked = true;
    }

    // 根据模式显示或隐藏自定义分类选项
    const customOptionsContainer = document.getElementById('hitokoto-custom-options');
    if (mode === 'custom') {
        customOptionsContainer.classList.add('open');
    } else {
        customOptionsContainer.classList.remove('open');
    }

    // 更新分类复选框的选中状态
    const allCheckboxes = document.querySelectorAll('input[name="hitokoto-category"]');
    allCheckboxes.forEach(checkbox => {
        checkbox.checked = categories.includes(checkbox.value);
    });

    // 更新“全选”复选框的状态
    const selectAllCheckbox = document.getElementById('hitokoto-select-all');
    if (selectAllCheckbox) {
        const allCategories = Array.from(allCheckboxes).map(cb => cb.value);
        selectAllCheckbox.checked = categories.length === allCategories.length;
    }
}

/**
 * @description 更新沉浸模式下冒号闪烁开关的UI。
 */
function updateImmersiveBlinkUI() {
    const toggle = document.getElementById('immersive-blink-toggle');
    if (toggle) {
        toggle.checked = appSettings.immersiveBlinkingColon;
    }
}

/**
 * @description 更新开发者设置的UI。
 */
export function updateDeveloperSettingsUI() {
    const devToggle = document.getElementById('dev-options-toggle');
    const forceNewYearToggle = document.getElementById('force-new-year-theme-toggle');

    if (devToggle) {
        devToggle.checked = appSettings.developer.uiToggleState;
    }
    if (forceNewYearToggle) {
        forceNewYearToggle.checked = appSettings.developer.forceNewYearTheme;
    }
}

/**
 * @description 主更新函数，调用所有独立的UI更新函数来同步整个设置面板。
 * 这个函数应该在每次打开设置面板时被调用。
 */
export function updateSettingsUI() {
    // 调用从其他模块导入或在此文件中定义的各种UI更新函数
    updateBgSettingsUI();
    // 注意：updateThemeSettingsUI() 由其自己的初始化器处理，以避免UI跳动问题。
    updateTimeFormatUI();
    updateViewToggleUI();
    updateHitokotoSettingsUI();
    updateImmersiveBlinkUI();
    updateDeveloperSettingsUI();
    updateAppearanceSettingsUI();

    // --- 新年主题背景开关的特殊逻辑 ---
    // 这个开关只在新年期间或开发者强制开启时才显示。
    const newYearBgToggleSection = document.getElementById('new-year-bg-toggle-section');
    const newYearBgToggle = document.getElementById('new-year-bg-toggle');
    const shouldThemeBeActive = isNewYearPeriod() || appSettings.developer.forceNewYearTheme;

    if (newYearBgToggleSection && newYearBgToggle) {
        if (shouldThemeBeActive) {
            newYearBgToggleSection.classList.remove('hidden');
            newYearBgToggle.checked = appSettings.newYearTheme.backgroundEnabled;
        } else {
            newYearBgToggleSection.classList.add('hidden');
        }
    }
}
